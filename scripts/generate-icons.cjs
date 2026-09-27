/**
 * Generates PWA PNG icons without any native dependencies.
 * Renders the Tas Hair mark (triangle + flowing hair) on a purple background
 * by rasterising a scaled vector definition into pixels, then PNG-encoding.
 *
 * Run: node scripts/generate-icons.cjs
 */

const { writeFileSync } = require('fs');
const { join } = require('path');
const zlib = require('zlib');

// ─── Minimal PNG encoder ────────────────────────────────────────────────────

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const payload = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(payload));
  return Buffer.concat([len, payload, crc]);
}

function encodePNG(width, height, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // RGBA
  const rowLen = width * 4;
  const raw = Buffer.alloc((rowLen + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (rowLen + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4;
      const di = y * (rowLen + 1) + 1 + x * 4;
      raw[di] = pixels[si]; raw[di + 1] = pixels[si + 1];
      raw[di + 2] = pixels[si + 2]; raw[di + 3] = pixels[si + 3];
    }
  }
  const compressed = zlib.deflateSync(raw, { level: 6 });
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', compressed), pngChunk('IEND', Buffer.alloc(0))]);
}

// ─── Geometry helpers (supersampled for anti-aliasing) ──────────────────────

// Point-in-triangle test
function inTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  return !(hasNeg && hasPos);
}

// Distance from point to line segment (for triangle outline stroke)
function distToSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  let t = l2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx, cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function drawIcon(size) {
  const SS = 4; // supersample factor
  const S = size * SS;
  const pixels = new Uint8Array(size * size * 4);

  // Scale factor: original mark defined on 64-unit grid
  const u = S / 64;

  // Triangle points (on 64 grid): (22,16)(44,16)(27,38)
  const tri = [22 * u, 16 * u, 44 * u, 16 * u, 27 * u, 38 * u];
  const strokeW = 2.4 * u;

  // Flowing-hair rough bounding via a set of overlapping "strand" quadratics
  // Approximate with filled polygon sampled from the SVG path shape.
  // We build a coarse strand mask using a few teardrop shapes.
  const strands = [
    // [cx, cy, rx, ry] ellipse-ish strands, tapering downward
    { x: 33 * u, y: 30 * u, rx: 7 * u, ry: 16 * u, skew: 0.15 },
    { x: 31 * u, y: 42 * u, rx: 4.5 * u, ry: 12 * u, skew: 0.05 },
    { x: 35 * u, y: 40 * u, rx: 4 * u, ry: 11 * u, skew: -0.05 },
  ];

  function hexToRgb(hex) {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }
  const [pr, pg, pb] = hexToRgb('#7B2D8B');

  const cornerR = size * 0.22 * SS;

  // Render at supersampled resolution then downsample
  const hi = new Uint8Array(S * S * 4);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const idx = (y * S + x) * 4;

      // Rounded-rect background mask
      const dx = Math.max(0, Math.max(cornerR - x, x - (S - cornerR)));
      const dy = Math.max(0, Math.max(cornerR - y, y - (S - cornerR)));
      if (Math.hypot(dx, dy) > cornerR) { hi[idx + 3] = 0; continue; }

      // Background purple with subtle diagonal gradient
      const gf = (x + y) / (S * 2);
      let r = Math.min(255, Math.round(pr + (1 - gf) * 25 - gf * 18));
      let g = Math.min(255, Math.round(pg + (1 - gf) * 8 - gf * 6));
      let b = Math.min(255, Math.round(pb + (1 - gf) * 18 - gf * 10));
      let a = 255;

      // Triangle outline (white stroke)
      const dTri = Math.min(
        distToSeg(x, y, tri[0], tri[1], tri[2], tri[3]),
        distToSeg(x, y, tri[2], tri[3], tri[4], tri[5]),
        distToSeg(x, y, tri[4], tri[5], tri[0], tri[1])
      );
      if (dTri <= strokeW / 2) { r = 255; g = 255; b = 255; }

      // Flowing hair strands (light gradient fill)
      let onHair = false;
      for (const s of strands) {
        const lx = (x - s.x) - (y - s.y) * s.skew;
        const ly = y - s.y;
        // teardrop: ellipse that tapers at bottom
        const taper = ly > 0 ? 1 + ly / (s.ry * 1.5) : 1;
        if ((lx * lx) / ((s.rx / taper) ** 2) + (ly * ly) / (s.ry * s.ry) <= 1) {
          onHair = true;
          break;
        }
      }
      if (onHair) {
        // light purple → white gradient top-to-bottom
        const hv = Math.min(1, Math.max(0, (y / u - 19) / 39));
        r = Math.round(232 - hv * 40 + hv * 60);
        g = Math.round(204 - hv * 40 + hv * 90);
        b = Math.round(240 + hv * 15);
        r = Math.min(255, r); g = Math.min(255, g); b = Math.min(255, b);
      }

      hi[idx] = r; hi[idx + 1] = g; hi[idx + 2] = b; hi[idx + 3] = a;
    }
  }

  // Downsample (box filter) from S -> size
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const si = ((y * SS + sy) * S + (x * SS + sx)) * 4;
          r += hi[si]; g += hi[si + 1]; b += hi[si + 2]; a += hi[si + 3];
        }
      }
      const n = SS * SS;
      const di = (y * size + x) * 4;
      pixels[di] = Math.round(r / n);
      pixels[di + 1] = Math.round(g / n);
      pixels[di + 2] = Math.round(b / n);
      pixels[di + 3] = Math.round(a / n);
    }
  }

  return pixels;
}

// ─── Generate ────────────────────────────────────────────────────────────────

const publicDir = join(__dirname, '../public');
const sizes = [
  { size: 192, name: 'logo-192.png' },
  { size: 512, name: 'logo-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

for (const { size, name } of sizes) {
  console.log(`Generating ${name} (${size}x${size})...`);
  const pixels = drawIcon(size);
  writeFileSync(join(publicDir, name), encodePNG(size, size, pixels));
  console.log(`✅ ${name}`);
}
console.log('\n🎉 All icons generated!');

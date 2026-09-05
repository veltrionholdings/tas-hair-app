/**
 * Generates PWA PNG icons without any native dependencies.
 * Uses a minimal pure-JS PNG encoder.
 * Run: node scripts/generate-icons.cjs
 */

const { writeFileSync, mkdirSync } = require('fs');
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

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBytes = Buffer.from(type);
  const payload = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(payload));
  return Buffer.concat([len, payload, crc]);
}

function encodePNG(width, height, pixels) {
  // pixels: Uint8Array of RGBA values, row by row
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // colour type: RGB (we'll strip alpha for simplicity... actually keep RGBA=6)
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Build raw scanlines
  const rowLen = width * 4;
  const raw = Buffer.alloc((rowLen + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (rowLen + 1)] = 0; // filter type: None
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4;
      const di = y * (rowLen + 1) + 1 + x * 4;
      raw[di]     = pixels[si];
      raw[di + 1] = pixels[si + 1];
      raw[di + 2] = pixels[si + 2];
      raw[di + 3] = pixels[si + 3];
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 6 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── Icon drawing ────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function drawIcon(size) {
  const pixels = new Uint8Array(size * size * 4);
  const [pr, pg, pb] = hexToRgb('#7B2D8B'); // brand purple
  const cx = size / 2;
  const cy = size / 2;
  const cornerR = size * 0.22;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Rounded rect test
      const dx = Math.max(0, Math.max(cornerR - x, x - (size - cornerR)));
      const dy = Math.max(0, Math.max(cornerR - y, y - (size - cornerR)));
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > cornerR) {
        // Outside - transparent
        pixels[idx + 3] = 0;
        continue;
      }

      // Anti-alias at edge
      const alpha = dist > cornerR - 1.5 ? Math.round((cornerR - dist) * 170) : 255;

      // Base purple
      let r = pr, g = pg, b = pb;

      // Subtle gradient: lighter top-left, darker bottom-right
      const gradFactor = (x + y) / (size * 2);
      r = Math.min(255, Math.round(r + (1 - gradFactor) * 30 - gradFactor * 20));
      g = Math.min(255, Math.round(g + (1 - gradFactor) * 10 - gradFactor * 8));
      b = Math.min(255, Math.round(b + (1 - gradFactor) * 20 - gradFactor * 10));

      // ── Draw scissors body ──
      // Rotate coords -30 degrees around centre
      const rad = -Math.PI / 6;
      const rx = (x - cx) * Math.cos(rad) - (y - cy) * Math.sin(rad);
      const ry = (x - cx) * Math.sin(rad) + (y - cy) * Math.cos(rad);

      const unit = size / 64;
      let onScissors = false;

      // Top blade (rotated ellipse = check ry < 0 quadrant)
      if (ry < 0) {
        const eby = ry + unit * 8;
        if ((rx * rx) / (unit * 2.5 * unit * 2.5) + (eby * eby) / (unit * 10 * unit * 10) <= 1.0) {
          onScissors = true;
        }
      }
      // Bottom blade
      if (ry > 0) {
        const eby = ry - unit * 8;
        if ((rx * rx) / (unit * 2.5 * unit * 2.5) + (eby * eby) / (unit * 10 * unit * 10) <= 1.0) {
          onScissors = true;
        }
      }

      // Pivot hole (purple circle over scissors)
      const pivotDist = Math.sqrt(rx * rx + ry * ry);
      const pivotOuter = unit * 3.2 + unit * 1.8 / 2;
      const pivotInner = unit * 3.2 - unit * 1.8 / 2;
      let onPivotRing = false;
      if (pivotDist <= pivotOuter && pivotDist >= pivotInner) onPivotRing = true;
      if (pivotDist < pivotInner) { onScissors = false; } // hole

      // Top handle loop
      const thx = rx - unit;
      const thy = ry + unit * 20;
      const tho = unit * 4.5 + unit * 1.1;
      const thi = unit * 4.5 - unit * 1.1;
      const tho2 = unit * 5.5 + unit * 1.1;
      const thi2 = unit * 5.5 - unit * 1.1;
      const thEllipse = (thx * thx) / (unit * 4.5 * unit * 4.5) + (thy * thy) / (unit * 5.5 * unit * 5.5);
      // Ring approximation
      const thOuter = (thx * thx) / (tho * tho) + (thy * thy) / (tho2 * tho2);
      const thInner = (thx * thx) / (thi * thi) + (thy * thy) / (thi2 * thi2);
      let onHandleTop = thOuter <= 1.0 && thInner >= 1.0;

      // Bottom handle loop
      const bhx = rx + unit;
      const bhy = ry - unit * 20;
      const bhOuter = (bhx * bhx) / (tho * tho) + (bhy * bhy) / (tho2 * tho2);
      const bhInner = (bhx * bhx) / (thi * thi) + (bhy * bhy) / (thi2 * thi2);
      let onHandleBottom = bhOuter <= 1.0 && bhInner >= 1.0;

      if (onScissors || onPivotRing || onHandleTop || onHandleBottom) {
        r = 255; g = 255; b = 255;
      }

      // ── Sparkle dots ──
      const sp1 = Math.sqrt((x - size * 0.78) ** 2 + (y - size * 0.20) ** 2);
      const sp2 = Math.sqrt((x - size * 0.70) ** 2 + (y - size * 0.125) ** 2);
      const sp3 = Math.sqrt((x - size * 0.86) ** 2 + (y - size * 0.28) ** 2);

      if (sp1 < size * 0.031) { r = Math.round(r * 0.4 + 255 * 0.6); g = Math.round(g * 0.4 + 255 * 0.6); b = Math.round(b * 0.4 + 255 * 0.6); }
      if (sp2 < size * 0.020) { r = Math.round(r * 0.6 + 255 * 0.4); g = Math.round(g * 0.6 + 255 * 0.4); b = Math.round(b * 0.6 + 255 * 0.4); }
      if (sp3 < size * 0.020) { r = Math.round(r * 0.6 + 255 * 0.4); g = Math.round(g * 0.6 + 255 * 0.4); b = Math.round(b * 0.6 + 255 * 0.4); }

      pixels[idx]     = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
      pixels[idx + 3] = alpha;
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
  const png = encodePNG(size, size, pixels);
  writeFileSync(join(publicDir, name), png);
  console.log(`✅ ${name}`);
}

console.log('\n🎉 All icons generated!');

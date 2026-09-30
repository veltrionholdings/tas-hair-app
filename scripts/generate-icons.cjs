/**
 * Generates the Tas Hair app icons, favicon and in-app mark assets from the
 * real logo (public/logo-source.jpg).
 *
 * Strategy (Option A — white tile):
 *  - App icons: crop the logo MARK (triangle + hair), centre it on a white
 *    rounded-square-friendly tile with padding, export at 192/512/180.
 *  - favicon.png: same mark, small.
 *  - logo-mark.png: tightly-cropped mark on white (for the header + spinner).
 *  - logo-full.png: the full logo (mark + text) on white (for splash/large use).
 *
 * Run:  node scripts/generate-icons.cjs
 */

const sharp = require('sharp');
const { join } = require('path');

const publicDir = join(__dirname, '../public');
const SOURCE = join(publicDir, 'logo-source.jpg');

// Mark bounding box measured from the 640x640 source.
// The text "TAS HAIR" begins at y=423, so the mark bottom is hard-clamped at
// y=422 (no bottom padding) to avoid catching letter tops. Side/top padding
// gives the strokes a little breathing room.
const MARK = { left: 122, top: 48, right: 370, bottom: 422 };
const SIDE_PAD = 10;
const TOP_PAD = 10;

const markLeft = Math.max(0, MARK.left - SIDE_PAD);
const markTop = Math.max(0, MARK.top - TOP_PAD);
const markRegion = {
  left: markLeft,
  top: markTop,
  width: MARK.right + SIDE_PAD - markLeft,
  height: MARK.bottom - markTop, // stops exactly at the text line
};

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

/**
 * Build a square white tile of `size` px with the cropped mark centred,
 * leaving `marginRatio` of the tile as padding on the tighter axis.
 */
async function makeIconTile(size, marginRatio, outName) {
  const inner = Math.round(size * (1 - marginRatio * 2));

  const mark = await sharp(SOURCE)
    .extract(markRegion)
    .resize(inner, inner, { fit: 'contain', background: WHITE })
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(join(publicDir, outName));

  console.log(`  ✓ ${outName} (${size}x${size})`);
}

async function main() {
  console.log('Generating icons from logo-source.jpg...');

  // Home-screen / PWA icons — white tile, mark centred with ~16% margin.
  await makeIconTile(192, 0.16, 'logo-192.png');
  await makeIconTile(512, 0.16, 'logo-512.png');
  await makeIconTile(180, 0.16, 'apple-touch-icon.png');

  // Favicon — a touch tighter so the mark reads at tiny sizes.
  await makeIconTile(64, 0.1, 'favicon.png');

  // Tightly-cropped mark on white, for the header and loading spinner.
  await sharp(SOURCE)
    .extract(markRegion)
    .resize(256, 256, { fit: 'contain', background: WHITE })
    .png()
    .toFile(join(publicDir, 'logo-mark.png'));
  console.log('  ✓ logo-mark.png (256x256)');

  // Full logo (mark + text) on white, for splash / large display.
  await sharp(SOURCE)
    .resize(640, 640, { fit: 'contain', background: WHITE })
    .png()
    .toFile(join(publicDir, 'logo-full.png'));
  console.log('  ✓ logo-full.png (640x640)');

  console.log('Done.');
}

main().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});

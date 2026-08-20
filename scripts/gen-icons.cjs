// Generate simple PNG icons for PWA without external dependencies
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c >>> 0;
    }
    crc32.table = table;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(size, draw) {
  const width = size;
  const height = size;
  // RGBA raw data per row, filtered with 0
  const rowLen = width * 4 + 1;
  const raw = Buffer.alloc(rowLen * height);
  for (let y = 0; y < height; y++) {
    raw[y * rowLen] = 0; // filter none
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = draw(x, y, size);
      const idx = y * rowLen + 1 + x * 4;
      raw[idx] = r;
      raw[idx + 1] = g;
      raw[idx + 2] = b;
      raw[idx + 3] = a;
    }
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function drawIcon(x, y, size) {
  // Rounded blue square background with white water drop
  const r = size * 0.12; // corner radius
  const cx = size / 2;
  const cy = size / 2;

  // Round-corner square mask for background
  let inBg = true;
  // Check corners
  if (x < r && y < r) {
    const dx = r - x;
    const dy = r - y;
    inBg = dx * dx + dy * dy <= r * r;
  } else if (x >= size - r && y < r) {
    const dx = x - (size - r - 1);
    const dy = r - y;
    inBg = dx * dx + dy * dy <= r * r;
  } else if (x < r && y >= size - r) {
    const dx = r - x;
    const dy = y - (size - r - 1);
    inBg = dx * dx + dy * dy <= r * r;
  } else if (x >= size - r && y >= size - r) {
    const dx = x - (size - r - 1);
    const dy = y - (size - r - 1);
    inBg = dx * dx + dy * dy <= r * r;
  }
  if (!inBg) return [0, 0, 0, 0];

  // Gradient-ish background
  const t = y / size;
  const R = Math.round(96 + (37 - 96) * t);
  const G = Math.round(165 + (99 - 165) * t);
  const B = Math.round(250 + (235 - 250) * t);

  // Water drop inside
  const dropCenterX = cx;
  const dropTopY = cy - size * 0.32;
  // Ellipse-like drop using two functions
  // Coordinate relative to drop
  const dx = (x - dropCenterX) / (size * 0.22);
  // Parametric: top part diamond, bottom circle
  const dyTop = size * 0.32;
  let inDrop = false;
  // drop as simplified shape
  const dypx = (y - dropTopY);
  const totalHeight = size * 0.62;
  if (dypx >= 0 && dypx <= totalHeight) {
    const p = dypx / totalHeight; // 0 top, 1 bottom
    // Width profile: narrower at top, wider mid, close at bottom
    let w;
    if (p < 0.5) {
      w = 0.15 + (0.36 - 0.15) * (p / 0.5);
    } else {
      w = 0.36 + (0.32 - 0.36) * ((p - 0.5) / 0.5);
    }
    inDrop = Math.abs(dx) <= w * (1 - Math.pow((p - 0.5) * 2, 2) * 0.0 + 0);
    // simpler ellipse blend
    const rx = dx;
    const ry = (p - 0.5) / 0.55;
    if (rx * rx + ry * ry <= 1) inDrop = true;
  }

  if (inDrop) {
    // White drop with slight shade
    const shade = y < cy ? 255 : 242;
    return [shade, shade, 255, 245];
  }
  return [R, G, B, 255];
}

const publicDir = path.resolve(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const s of sizes) {
  const png = makePng(s.size, drawIcon);
  fs.writeFileSync(path.join(publicDir, s.name), png);
  console.log('Generated', s.name, `${png.length} bytes`);
}

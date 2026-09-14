import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const W = 1200;
const H = 630;
const pixels = Buffer.alloc(W * H * 3);

const C = {
  bg: [7, 9, 11],
  surface: [13, 17, 21],
  border: [32, 38, 45],
  text: [242, 245, 247],
  muted: [139, 148, 158],
  risk: [227, 93, 93],
  finance: [83, 169, 123],
  info: [126, 164, 191],
  warning: [200, 154, 85],
};

const FONT = {
  A:['01110','10001','10001','11111','10001','10001','10001'],
  B:['11110','10001','10001','11110','10001','10001','11110'],
  C:['01111','10000','10000','10000','10000','10000','01111'],
  D:['11110','10001','10001','10001','10001','10001','11110'],
  E:['11111','10000','10000','11110','10000','10000','11111'],
  F:['11111','10000','10000','11110','10000','10000','10000'],
  G:['01111','10000','10000','10111','10001','10001','01110'],
  H:['10001','10001','10001','11111','10001','10001','10001'],
  I:['11111','00100','00100','00100','00100','00100','11111'],
  J:['00111','00010','00010','00010','10010','10010','01100'],
  K:['10001','10010','10100','11000','10100','10010','10001'],
  L:['10000','10000','10000','10000','10000','10000','11111'],
  M:['10001','11011','10101','10101','10001','10001','10001'],
  N:['10001','11001','10101','10011','10001','10001','10001'],
  O:['01110','10001','10001','10001','10001','10001','01110'],
  P:['11110','10001','10001','11110','10000','10000','10000'],
  Q:['01110','10001','10001','10001','10101','10010','01101'],
  R:['11110','10001','10001','11110','10100','10010','10001'],
  S:['01111','10000','10000','01110','00001','00001','11110'],
  T:['11111','00100','00100','00100','00100','00100','00100'],
  U:['10001','10001','10001','10001','10001','10001','01110'],
  V:['10001','10001','10001','10001','10001','01010','00100'],
  W:['10001','10001','10001','10101','10101','10101','01010'],
  X:['10001','10001','01010','00100','01010','10001','10001'],
  Y:['10001','10001','01010','00100','00100','00100','00100'],
  Z:['11111','00001','00010','00100','01000','10000','11111'],
  '0':['01110','10001','10011','10101','11001','10001','01110'],
  '1':['00100','01100','00100','00100','00100','00100','01110'],
  '2':['01110','10001','00001','00010','00100','01000','11111'],
  '3':['11110','00001','00001','01110','00001','00001','11110'],
  '!':['00100','00100','00100','00100','00100','00000','00100'],
  '/':['00001','00010','00100','01000','10000','00000','00000'],
  '+':['00000','00100','00100','11111','00100','00100','00000'],
  '-':['00000','00000','00000','11111','00000','00000','00000'],
  '.':['00000','00000','00000','00000','00000','00110','00110'],
  ' ':['00000','00000','00000','00000','00000','00000','00000'],
};

function putPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  pixels[i] = color[0];
  pixels[i + 1] = color[1];
  pixels[i + 2] = color[2];
}

function fillRect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) putPixel(xx, yy, color);
  }
}

function line(x0, y0, x1, y1, color, thickness = 2) {
  let dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  while (true) {
    fillRect(
      x0 - Math.floor(thickness / 2),
      y0 - Math.floor(thickness / 2),
      thickness,
      thickness,
      color,
    );
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

function drawText(text, x, y, scale, color) {
  let cursor = x;
  for (const raw of text.toUpperCase()) {
    const glyph = FONT[raw] ?? FONT[' '];
    glyph.forEach((row, gy) => {
      [...row].forEach((v, gx) => {
        if (v === '1') {
          fillRect(cursor + gx * scale, y + gy * scale, scale, scale, color);
        }
      });
    });
    cursor += 6 * scale;
  }
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcInput = Buffer.concat([typeBuf, data]);
  let crc = 0xffffffff;
  for (const b of crcInput) {
    crc ^= b;
    for (let k = 0; k < 8; k++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  crc = (crc ^ 0xffffffff) >>> 0;
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

fillRect(0, 0, W, H, C.bg);
fillRect(0, 0, W, 6, C.info);

drawText('IMPACT!', 70, 62, 10, C.text);
drawText('FAIR / FMVA DECISION SIMULATOR', 72, 153, 4, C.muted);
drawText('CYBER RISK / FINANCIAL IMPACT / DECISION', 70, 232, 4, C.text);
drawText('FROM LOSS EXPOSURE TO BOARD-READY DECISION SUPPORT', 72, 300, 3, C.muted);
line(70, 372, 1130, 372, C.border, 2);

const cards = [
  ['FAIR', C.risk],
  ['MONTE CARLO', C.warning],
  ['FINANCE', C.finance],
  ['BOARD MODE', C.info],
];
const cw = 254;
const gap = 17;
const cy = 410;
const ch = 108;
for (let i = 0; i < cards.length; i++) {
  const x = 70 + i * (cw + gap);
  fillRect(x, cy, cw, ch, C.surface);
  fillRect(x, cy, cw, 2, C.border);
  fillRect(x, cy + ch - 2, cw, 2, C.border);
  fillRect(x, cy, 2, ch, C.border);
  fillRect(x + cw - 2, cy, 2, ch, C.border);
  fillRect(x, cy, 6, ch, cards[i][1]);
  drawText(cards[i][0], x + 20, cy + 24, 3, cards[i][1]);
}

const pts = [
  [858, 86],
  [908, 119],
  [958, 101],
  [1008, 146],
  [1058, 112],
  [1118, 159],
];
for (let i = 0; i < pts.length - 1; i++) {
  line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], C.border, 3);
}
for (const [x, y] of pts) fillRect(x - 5, y - 5, 10, 10, C.info);

drawText('JTFLACK-GRC.GITHUB.IO/IMPACT/', 70, 574, 3, C.muted);

const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) {
  const rowStart = y * (W * 3 + 1);
  raw[rowStart] = 0;
  pixels.copy(raw, rowStart + 1, y * W * 3, (y + 1) * W * 3);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;
ihdr[9] = 2;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = path.resolve('public/impact-social-card-v2.png');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png);
console.log(`Generated ${out} (${png.length} bytes)`);

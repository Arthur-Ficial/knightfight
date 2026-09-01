import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

// Generates the PWA/app icons procedurally - a gold sword on a dark shield - so
// there are zero binary assets in the repo. Minimal hand-rolled PNG encoder.

const crcTable = ((): number[] => {
  const table: number[] = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (buf: Buffer): number => {
  let c = 0xffffffff;
  for (const byte of buf) {
    c = (crcTable[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type: string, data: Buffer): Buffer => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
};

type Rgb = [number, number, number];

const encodePng = (size: number, pixel: (x: number, y: number) => Rgb): Buffer => {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let o = 0;
  for (let y = 0; y < size; y += 1) {
    raw[o] = 0;
    o += 1;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b] = pixel(x, y);
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255;
      o += 4;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
};

const draw = (size: number) => (x: number, y: number): Rgb => {
  const u = x / size;
  const v = y / size;
  const bg: Rgb = [10 + Math.round(v * 14), 10, 20 + Math.round(v * 10)];
  const cx = 0.5;
  const bladeW = 0.045;
  const inBlade = Math.abs(u - cx) < bladeW && v > 0.18 && v < 0.74;
  const inGuard = Math.abs(v - 0.66) < 0.03 && Math.abs(u - cx) < 0.2;
  const inPommel = Math.hypot(u - cx, v - 0.8) < 0.05;
  const inTip = Math.abs(u - cx) < bladeW * 2 && v >= 0.12 && v <= 0.18;
  if (inBlade || inGuard || inPommel || inTip) {
    return [232, 197, 106];
  }
  const ring = Math.abs(Math.hypot(u - 0.5, v - 0.5) - 0.44);
  if (ring < 0.012) {
    return [90, 32, 54];
  }
  return bg;
};

mkdirSync('public/icons', { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(`public/icons/icon-${size}.png`, encodePng(size, draw(size)));
  process.stdout.write(`wrote public/icons/icon-${size}.png\n`);
}

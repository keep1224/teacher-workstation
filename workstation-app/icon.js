/*
  教师班主任工作台 · 应用图标生成器（纯 Node，无依赖）
  用法：node icon.js
  产物（输出到 build/icons/）：
    teacher-workstation.ico   Windows（16/24/32/48/64/128/256）
    teacher-workstation.icns  macOS（icns 容器，内嵌 512/1024 png）
    teacher-workstation.png   PWA / Linux 用（512）
  electron-builder 配置 build/icons/ 后，三平台自动使用对应格式。
*/
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---------- 1) 图标绘制（1024 画布） ----------
const S = 1024;
const px = new Float64Array(S * S * 4); // 每像素 [R, G, B, A]
let bgMask = new Uint8Array(S * S); // 背景是否不透明（圆角外透明）

function insideRoundRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  // 中间条带（横/竖方向落在圆角半径范围内）直接算内部
  if (x >= x0 + r && x <= x1 - r) return true;
  if (y >= y0 + r && y <= y1 - r) return true;
  // 四角：到角圆心的距离 <= r
  const cx = x < x0 + r ? x0 + r : x1 - r;
  const cy = y < y0 + r ? y0 + r : y1 - r;
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function setPx(i, r, g, b, a) {
  if (!a) return;
  const ia = 1 - px[i * 4 + 3];
  px[i * 4] = r * a + px[i * 4] * ia;
  px[i * 4 + 1] = g * a + px[i * 4 + 1] * ia;
  px[i * 4 + 2] = b * a + px[i * 4 + 2] * ia;
  px[i * 4 + 3] = Math.max(px[i * 4 + 3], a);
  if (px[i * 4 + 3] > 0.5) bgMask[i] = 1;
}

function sample(x, y) {
  if (x < 0 || y < 0 || x >= S || y >= S) return 0;
  return px[(y * S + x) * 4 + 3];
}

// 圆角矩形填充
function fillRoundRect(x0, y0, x1, y1, r, col, a) {
  for (let y = Math.max(0, y0); y <= Math.min(S - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(S - 1, x1); x++) {
      if (!insideRoundRect(x + 0.5, y + 0.5, x0, y0, x1, y1, r)) continue;
      const i = y * S + x;
      setPx(i, col[0] / 255, col[1] / 255, col[2] / 255, a);
    }
  }
}

// 圆角描边（矩形框）
function strokeRoundRect(x0, y0, x1, y1, r, w, col, a) {
  const t = w / 2;
  fillRoundRect(x0 - t, y0 - t, x0 + t, y1 + t, r, col, a);
  fillRoundRect(x1 - t, y0 - t, x1 + t, y1 + t, r, col, a);
  fillRoundRect(x0 - t, y0 - t, x1 + t, y0 + t, r, col, a);
  fillRoundRect(x0 - t, y1 - t, x1 + t, y1 + t, r, col, a);
}

// 加粗折线（多段）
function thickPolyline(pts, w, col, a) {
  for (let s = 0; s < pts.length - 1; s++) {
    const [x0, y0] = pts[s], [x1, y1] = pts[s + 1];
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const half = w / 2;
    const steps = Math.max(Math.abs(dx), Math.abs(dy)) * 2;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const bx = x0 + dx * t, by = y0 + dy * t;
      for (let o = -half; o <= half; o += 1) {
        const X = Math.round(bx + nx * o), Y = Math.round(by + ny * o);
        const x = Math.round(bx), y = Math.round(by);
        if (X >= 0 && X < S && Y >= 0 && Y < S) setPx(Y * S + X, col[0] / 255, col[1] / 255, col[2] / 255, a);
        if (x >= 0 && x < S && y >= 0 && y < S) setPx(y * S + x, col[0] / 255, col[1] / 255, col[2] / 255, a);
      }
    }
    // 端点圆帽
    for (const [ex, ey] of [[x0, y0], [x1, y1]]) {
      for (let yy = -half; yy <= half; yy++) for (let xx = -half; xx <= half; xx++) {
        if (xx * xx + yy * yy > half * half + 1) continue;
        const X = Math.round(ex + xx), Y = Math.round(ey + yy);
        if (X >= 0 && X < S && Y >= 0 && Y < S) setPx(Y * S + X, col[0] / 255, col[1] / 255, col[2] / 255, a);
      }
    }
  }
}

const WHITE = [245, 246, 244];

// 背景：深灰圆角方（带 8% 外边距）
fillRoundRect(46, 46, 978, 978, 190, [23, 24, 26], 1);
// 黑板
const BX0 = 190, BY0 = 190, BX1 = 834, BY1 = 700;
fillRoundRect(BX0 - 26, BY0 - 26, BX1 + 26, BY1 + 26, 60, WHITE, 1); // 白框
fillRoundRect(BX0, BY0, BX1, BY1, 34, [36, 118, 82], 1); // 绿板
// 粉笔字
thickPolyline([[290, 560], [360, 630], [520, 430]], 30, WHITE, 0.95); // 大对勾
thickPolyline([[650, 470], [760, 470]], 28, WHITE, 0.95); // 一横
thickPolyline([[705, 415], [705, 525]], 28, WHITE, 0.95); // 一竖（加号）
// 星星（五角，中心 430,290）
(function star() {
  const cx = 430, cy = 300, R = 78, r = 30;
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 ? r : R;
    pts.push([cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)]);
  }
  // 填充：逐像素判断点是否在多边形内
  for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) {
    let inside = false;
    for (let i = 0, j = 9; i < 10; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    if (inside) setPx(y * S + x, WHITE[0] / 255, WHITE[1] / 255, WHITE[2] / 255, 0.95);
  }
})();
// 下方三本书（堆叠）
const bookY = 800;
fillRoundRect(330, bookY + 54, 694, bookY + 122, 14, [74, 128, 215], 1);  // 蓝
fillRoundRect(360, bookY, 664, bookY + 46, 14, [232, 116, 96], 1);       // 红
fillRoundRect(390, bookY - 46, 634, bookY - 14, 14, [245, 196, 94], 1);  // 黄

// ---------- 2) 缩到目标尺寸 ----------
function downsample(size) {
  const out = new Uint8ClampedArray(size * size * 4);
  const ratio = S / size;
  const block = Math.round(ratio);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    const x0 = x * block, x1 = Math.min(S, x0 + block);
    const y0 = y * block, y1 = Math.min(S, y0 + block);
    for (let sy = y0; sy < y1; sy++) for (let sx = x0; sx < x1; sx++) {
      const i = sy * S + sx;
      const aa = px[i * 4 + 3];
      r += px[i * 4] * aa; g += px[i * 4 + 1] * aa; b += px[i * 4 + 2] * aa; a += aa; n++;
    }
    const o = (y * size + x) * 4;
    out[o] = a ? Math.round((r / a) * 255) : 0;
    out[o + 1] = a ? Math.round((g / a) * 255) : 0;
    out[o + 2] = a ? Math.round((b / a) * 255) : 0;
    out[o + 3] = Math.round((a / n) * 255);
  }
  return out;
}

// ---------- 3) PNG 编码（纯手写，zlib 内置） ----------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function encodePNG(size, rgba) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter none
    for (let x = 0; x < size; x++) {
      const o = (y * size + x) * 4, d = y * (size * 4 + 1) + 1 + x * 4;
      raw[d] = rgba[o]; raw[d + 1] = rgba[o + 1]; raw[d + 2] = rgba[o + 2]; raw[d + 3] = rgba[o + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- 4) ICO（小尺寸 BMP 格式 + 256 PNG） ----------
function makeIco(sizes) {
  const small = sizes.filter((s) => s < 256);
  const png256 = sizes.includes(256) ? encodePNG(256, downsample(256)) : null;
  const bmps = small.map((s) => {
    const rgba = downsample(s);
    const xor = Buffer.alloc(s * s * 4); // BGRA
    for (let i = 0; i < s * s; i++) {
      xor[i * 4] = rgba[i * 4 + 2]; xor[i * 4 + 1] = rgba[i * 4 + 1];
      xor[i * 4 + 2] = rgba[i * 4]; xor[i * 4 + 3] = rgba[i * 4 + 3];
    }
    // AND 掩码（1bpp，行 4 字节对齐）：alpha=0 处置 1
    const andRow = Math.ceil(s / 8);
    const and = Buffer.alloc(andRow * s);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      if (rgba[(y * s + x) * 4 + 3] === 0) and[y * andRow + Math.floor(x / 8)] |= 0x80 >> (x % 8);
    }
    // BITMAPINFOHEADER（高度翻倍：XOR+AND）
    const hdr = Buffer.alloc(40);
    hdr.writeUInt32LE(40, 0); hdr.writeInt32LE(s, 4); hdr.writeInt32LE(s * 2, 8);
    hdr.writeUInt16LE(1, 12); hdr.writeUInt16LE(32, 14);
    return Buffer.concat([hdr, Buffer.from(and), xor]);
  });
  // ICO 目录
  const entries = [];
  let offset = 6 + 16 * (bmps.length + (png256 ? 1 : 0));
  const parts = [];
  for (const [i, b] of bmps.entries()) {
    const s = small[i];
    const e = Buffer.alloc(16);
    e[0] = s >= 256 ? 0 : s; e[1] = 0; e[2] = 0; e[3] = 0;
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(b.length, 8); e.writeUInt32LE(offset, 12);
    offset += b.length; parts.push(b); entries.push(e);
  }
  if (png256) {
    const e = Buffer.alloc(16);
    e[0] = 0; // 256
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(png256.length, 8); e.writeUInt32LE(offset, 12);
    offset += png256.length; parts.push(png256); entries.push(e);
  }
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(entries.length, 4);
  return Buffer.concat([header, ...entries, ...parts]);
}

// ---------- 5) ICNS（ic07=128 / ic08=512，内嵌 PNG） ----------
function icnsEntry(tag, png) {
  const out = Buffer.alloc(8 + png.length);
  out.write(tag, 0, 'ascii');
  out.writeUInt32BE(8 + png.length, 4);
  png.copy(out, 8);
  return out;
}
function makeIcns() {
  const entries = [icnsEntry('ic07', encodePNG(128, downsample(128))), icnsEntry('ic08', encodePNG(512, downsample(512)))];
  const total = 8 + entries.reduce((n, e) => n + e.length, 0);
  const out = Buffer.alloc(total);
  out.write('icns', 0, 'ascii');
  out.writeUInt32BE(total, 4);
  let o = 8;
  for (const e of entries) { e.copy(out, o); o += e.length; }
  return out;
}

// ---------- main ----------
const outDir = path.join(__dirname, 'build', 'icons');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'teacher-workstation.png'), encodePNG(512, downsample(512)));
fs.writeFileSync(path.join(outDir, 'teacher-workstation.ico'), makeIco([16, 24, 32, 48, 64, 128, 256]));
fs.writeFileSync(path.join(outDir, 'teacher-workstation.icns'), makeIcns());
console.log('图标已生成：', outDir);
console.log('  teacher-workstation.ico / .icns / .png');

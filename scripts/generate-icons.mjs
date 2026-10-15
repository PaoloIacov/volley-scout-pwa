/**
 * Genera la favicon e le icone PWA: una palla da pallavolo (geometria lucide)
 * con pannelli giallo, bianco e blu, cuciture e contorno blu notte.
 *
 *   npm run icons
 *
 * Output:
 *   public/favicon.ico            (16/32/48, sfondo trasparente)
 *   public/icons/icon-*.png       (72…512, sfondo blu notte, adatto a maskable)
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ colori */

const COLORI = {
  giallo: [255, 200, 0],
  bianco: [255, 255, 255],
  blu: [37, 99, 235],
  cuciture: [11, 32, 80], // blu notte
  sfondo: [8, 18, 49], // blu notte scuro (icone PWA)
};
const PANNELLI = [COLORI.giallo, COLORI.bianco, COLORI.blu];

/* ------------------------------------------------------- geometria (lucide) */

const CX = 12;
const CY = 12;
const R = 10; // raggio del cerchio nell viewBox 24×24
const HALF_CUCITURA = 0.4; // mezza larghezza delle cuciture (unità svg)
const HALF_CONTORNO = 0.45; // mezzo spessore del contorno

/** Arco SVG (endpoint → centro, specifica W3C) restituito come polilinea. */
function arcPoints(x1, y1, rx, ry, phiDeg, largeArc, sweep, x2, y2, steps = 256) {
  const phi = (phiDeg * Math.PI) / 180;
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);
  const dx2 = (x1 - x2) / 2;
  const dy2 = (y1 - y2) / 2;
  const x1p = cosP * dx2 + sinP * dy2;
  const y1p = -sinP * dx2 + cosP * dy2;

  let rx2 = rx * rx;
  let ry2 = ry * ry;
  const lambda = (x1p * x1p) / rx2 + (y1p * y1p) / ry2;
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx2 *= s;
    ry2 *= s;
  }

  const sign = largeArc !== sweep ? 1 : -1;
  const num = rx2 * ry2 - rx2 * (y1p * y1p) - ry2 * (x1p * x1p);
  const den = rx2 * (y1p * y1p) + ry2 * (x1p * x1p);
  const co = sign * Math.sqrt(Math.max(0, num / den));
  const cxp = co * ((rx * y1p) / ry);
  const cyp = co * ((-ry * x1p) / rx);
  const cx = cosP * cxp - sinP * cyp + (x1 + x2) / 2;
  const cy = sinP * cxp + cosP * cyp + (y1 + y2) / 2;

  const angle = (ux, uy, vx, vy) => {
    const cross = ux * vy - uy * vx;
    const dot = ux * vx + uy * vy;
    return Math.sign(cross || 1) * Math.acos(Math.min(1, Math.max(-1, dot / (Math.hypot(ux, uy) * Math.hypot(vx, vy)))));
  };

  const ux1 = (x1p - cxp) / rx;
  const uy1 = (y1p - cyp) / ry;
  const ux2 = (-x1p - cxp) / rx;
  const uy2 = (-y1p - cyp) / ry;
  const theta1 = angle(1, 0, ux1, uy1);
  let delta = angle(ux1, uy1, ux2, uy2);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;

  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = theta1 + (delta * i) / steps;
    points.push([
      cosP * rx * Math.cos(t) - sinP * ry * Math.sin(t) + cx,
      sinP * rx * Math.cos(t) + cosP * ry * Math.sin(t) + cy,
    ]);
  }
  return points;
}

/** Le 5 cuciture dell'icona pallavolo di lucide (viewBox 24×24). */
function cuciture() {
  return [
    arcPoints(11, 7, 16, 16, 20, 1, 1, 21.98, 11.362),
    arcPoints(12, 12, 13, 13, 0, 0, 1, 3.34, 17),
    arcPoints(16.83, 13.634, 16, 16, 0, 0, 1, 7.563, 20.962),
    arcPoints(20.66, 17, 13, 13, 0, 0, 0, 12, 12),
    arcPoints(12, 12, 13, 13, 0, 0, 1, 12, 2),
    arcPoints(8.17, 15.366, 16, 16, 0, 0, 1, 6.457, 3.676),
  ];
}

/* ------------------------------------------------------- campo ad alta ris. */

const N = 2048; // risoluzione del campo (24 unità svg)
const UNIT = N / 24; // celle per unità svg

function distSeg(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, (wx * vx + wy * vy) / len2));
  return Math.hypot(wx - t * vx, wy - t * vy);
}

/** Costruisce il campo RGBA del pallavolo a N×N. */
function buildField({ sfondo = null } = {}) {
  const inside = new Uint8Array(N * N);
  const seam = new Uint8Array(N * N);
  const region = new Int32Array(N * N).fill(-1);

  // 1. disco
  for (let gy = 0; gy < N; gy += 1) {
    const y = ((gy + 0.5) / N) * 24;
    const dy = y - CY;
    for (let gx = 0; gx < N; gx += 1) {
      const x = ((gx + 0.5) / N) * 24;
      const dx = x - CX;
      if (dx * dx + dy * dy <= R * R) inside[gy * N + gx] = 1;
    }
  }

  // 2. cuciture (segnate per segmento, bbox espanso)
  const rSeam = HALF_CUCITURA * UNIT;
  for (const polyline of cuciture()) {
    for (let i = 0; i < polyline.length - 1; i += 1) {
      const [ax, ay] = polyline[i];
      const [bx, by] = polyline[i + 1];
      const gax = ax * UNIT;
      const gay = ay * UNIT;
      const gbx = bx * UNIT;
      const gby = by * UNIT;
      const x0 = Math.max(0, Math.floor(Math.min(gax, gbx) - rSeam));
      const x1 = Math.min(N - 1, Math.ceil(Math.max(gax, gbx) + rSeam));
      const y0 = Math.max(0, Math.floor(Math.min(gay, gby) - rSeam));
      const y1 = Math.min(N - 1, Math.ceil(Math.max(gay, gby) + rSeam));
      for (let gy = y0; gy <= y1; gy += 1) {
        for (let gx = x0; gx <= x1; gx += 1) {
          const d = distSeg(gx + 0.5, gy + 0.5, gax, gay, gbx, gby);
          if (d <= rSeam) seam[gy * N + gx] = 1;
        }
      }
    }
  }

  // 3. contorno del disco
  const outline = new Uint8Array(N * N);
  const rOut = HALF_CONTORNO * UNIT;
  const rIn = (R - HALF_CONTORNO) * UNIT;
  const rOutIn = (R + HALF_CONTORNO) * UNIT;
  for (let gy = 0; gy < N; gy += 1) {
    for (let gx = 0; gx < N; gx += 1) {
      if (!inside[gy * N + gx]) continue;
      const dx = gx + 0.5 - CX * UNIT;
      const dy = gy + 0.5 - CY * UNIT;
      const d = Math.hypot(dx, dy);
      if (d >= rIn && d <= rOutIn) outline[gy * N + gx] = 1;
    }
  }
  void rOut;

  // 4. regioni (flood fill, 4-connessità; le cuciture/barriere separano)
  const stack = [];
  let id = 0;
  const stats = [];
  for (let start = 0; start < N * N; start += 1) {
    if (!inside[start] || seam[start] || outline[start] || region[start] !== -1) continue;
    const rid = id++;
    let area = 0;
    let sx = 0;
    let sy = 0;
    stack.push(start);
    region[start] = rid;
    while (stack.length > 0) {
      const cur = stack.pop();
      const cx = cur % N;
      const cy = (cur - cx) / N;
      area += 1;
      sx += cx;
      sy += cy;
      const neighbours = [
        cx > 0 ? cur - 1 : -1,
        cx < N - 1 ? cur + 1 : -1,
        cy > 0 ? cur - N : -1,
        cy < N - 1 ? cur + N : -1,
      ];
      for (const next of neighbours) {
        if (next < 0 || region[next] !== -1) continue;
        if (!inside[next] || seam[next] || outline[next]) continue;
        region[next] = rid;
        stack.push(next);
      }
    }
    stats.push({ id: rid, area, cx: sx / area, cy: sy / area });
  }

  // 5. colori: le regioni ordinate per angolo alternano giallo/bianco/blu
  const ordinate = [...stats].sort(
    (a, b) =>
      Math.atan2(a.cy - CY * UNIT, a.cx - CX * UNIT) -
      Math.atan2(b.cy - CY * UNIT, b.cx - CX * UNIT)
  );
  const coloreRegione = new Map();
  ordinate.forEach((r, i) => coloreRegione.set(r.id, PANNELLI[i % PANNELLI.length]));

  // 6. componi il campo RGBA
  const field = new Uint8Array(N * N * 4);
  for (let i = 0; i < N * N; i += 1) {
    let rgb = null;
    if (!inside[i]) rgb = sfondo; // le cuciture restano solo sulla palla
    else if (seam[i] || outline[i]) rgb = COLORI.cuciture;
    else rgb = coloreRegione.get(region[i]) ?? COLORI.bianco;
    const o = i * 4;
    if (!rgb) {
      field[o + 3] = 0;
      continue;
    }
    field[o] = rgb[0];
    field[o + 1] = rgb[1];
    field[o + 2] = rgb[2];
    field[o + 3] = 255;
  }
  return field;
}

/* ------------------------------------------------------ ridimensionamento */

/** Ridimensiona il campo con filtro box (con alpha premultiplicato). */
function resize(field, size, ballFraction) {
  // span in unità svg coperte dall'output: la palla (20 unità) deve occupare `ballFraction`
  const span = (20 / ballFraction) * (24 / 20);
  const unitOut = span / size; // unità svg per pixel di output
  const out = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // centro del pixel di output → coordinate svg → celle del campo
      const svgX = CX + (x + 0.5 - size / 2) * unitOut;
      const svgY = CY + (y + 0.5 - size / 2) * unitOut;
      const fx = svgX * UNIT;
      const fy = svgY * UNIT;
      const half = (unitOut * UNIT) / 2;

      const gx0 = Math.max(0, Math.floor(fx - half));
      const gx1 = Math.min(N - 1, Math.ceil(fx + half) - 1);
      const gy0 = Math.max(0, Math.floor(fy - half));
      const gy1 = Math.min(N - 1, Math.ceil(fy + half) - 1);

      let sr = 0;
      let sg = 0;
      let sb = 0;
      let sa = 0;
      let count = 0;
      for (let gy = gy0; gy <= gy1; gy += 1) {
        for (let gx = gx0; gx <= gx1; gx += 1) {
          const o = (gy * N + gx) * 4;
          const a = field[o + 3];
          sr += field[o] * a;
          sg += field[o + 1] * a;
          sb += field[o + 2] * a;
          sa += a;
          count += 1;
        }
      }
      const o = (y * size + x) * 4;
      const alpha = count === 0 ? 0 : Math.round(sa / count);
      out[o + 3] = alpha;
      if (sa > 0) {
        out[o] = Math.round(sr / sa);
        out[o + 1] = Math.round(sg / sa);
        out[o + 2] = Math.round(sb / sa);
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------- scrittura */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filtro "none"
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1
    );
  }
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function encodeICO(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // tipo icona
  header.writeUInt16LE(entries.length, 4);
  let offset = 6 + entries.length * 16;
  const dirs = [];
  const datas = [];
  for (const { size, png } of entries) {
    const dir = Buffer.alloc(16);
    dir[0] = size >= 256 ? 0 : size;
    dir[1] = size >= 256 ? 0 : size;
    dir[2] = 0; // palette
    dir[3] = 0; // riservato
    dir.writeUInt16LE(1, 4); // color planes
    dir.writeUInt16LE(32, 6); // bpp
    dir.writeUInt32LE(png.length, 8);
    dir.writeUInt32LE(offset, 12);
    dirs.push(dir);
    datas.push(png);
    offset += png.length;
  }
  return Buffer.concat([header, ...dirs, ...datas]);
}

/* ------------------------------------------------------------------ main */

function main() {
  console.log('Costruisco il campo del pallavolo…');
  const fieldTrasparente = buildField();
  const fieldConSfondo = buildField({ sfondo: COLORI.sfondo });

  mkdirSync(resolve(ROOT, 'public', 'icons'), { recursive: true });

  // Favicon: sfondo trasparente, palla al 90% del lato
  const icoEntries = [16, 32, 48].map((size) => ({
    size,
    png: encodePNG(size, size, resize(fieldTrasparente, size, 0.9)),
  }));
  writeFileSync(resolve(ROOT, 'public', 'favicon.ico'), encodeICO(icoEntries));
  console.log('  public/favicon.ico (16, 32, 48)');

  // Icone PWA: sfondo blu notte, palla all'80% (zona sicura per maskable)
  for (const size of [72, 96, 128, 144, 152, 192, 384, 512]) {
    const rgba = resize(fieldConSfondo, size, 0.8);
    writeFileSync(resolve(ROOT, 'public', 'icons', `icon-${size}x${size}.png`), encodePNG(size, size, rgba));
    console.log(`  public/icons/icon-${size}x${size}.png`);
  }

  // Anteprime per il controllo visivo
  const preview = resolve(ROOT, 'scripts', '.preview');
  mkdirSync(preview, { recursive: true });
  for (const size of [16, 48, 192, 512]) {
    writeFileSync(resolve(preview, `trasparente-${size}.png`), encodePNG(size, size, resize(fieldTrasparente, size, 0.9)));
    writeFileSync(resolve(preview, `sfondo-${size}.png`), encodePNG(size, size, resize(fieldConSfondo, size, 0.8)));
  }
  console.log('  anteprime in scripts/.preview');
}

main();

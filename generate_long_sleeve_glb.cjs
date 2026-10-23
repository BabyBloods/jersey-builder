/**
 * generate_long_sleeve_glb.cjs
 * Membuat public/shirt_long_sleeve.glb dengan lengan panjang utuh
 * langsung menyatu pada geometri mesh (welded 100% tanpa celah).
 */

const fs = require('fs');
const path = require('path');

const srcGlbPath = path.join(__dirname, 'public', 'shirt_baked.glb');
const outGlbPath = path.join(__dirname, 'public', 'shirt_long_sleeve.glb');

const buf = fs.readFileSync(srcGlbPath);
const jsonLen = buf.readUInt32LE(12);
const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
const gltf = JSON.parse(jsonStr);

const binChunkOffset = 20 + jsonLen + 8;
const binBuf = buf.slice(binChunkOffset);

// Accessors
// 0: POSITION (VEC3 FLOAT)
// 1: NORMAL (VEC3 FLOAT)
// 2: TEXCOORD_0 (VEC2 FLOAT)
// 3: INDICES (SCALAR UNSIGNED_SHORT)

const posAcc = gltf.accessors[0];
const posBv = gltf.bufferViews[posAcc.bufferView];
const origPosBytes = binBuf.slice(posBv.byteOffset, posBv.byteOffset + posBv.byteLength);

const normAcc = gltf.accessors[1];
const normBv = gltf.bufferViews[normAcc.bufferView];
const origNormBytes = binBuf.slice(normBv.byteOffset, normBv.byteOffset + normBv.byteLength);

const uvAcc = gltf.accessors[2];
const uvBv = gltf.bufferViews[uvAcc.bufferView];
const origUvBytes = binBuf.slice(uvBv.byteOffset, uvBv.byteOffset + uvBv.byteLength);

const idxAcc = gltf.accessors[3];
const idxBv = gltf.bufferViews[idxAcc.bufferView];
const origIdxBytes = binBuf.slice(idxBv.byteOffset, idxBv.byteOffset + idxBv.byteLength);

const origVertCount = posAcc.count; // 10513
console.log('Original vertices:', origVertCount, 'Original indices:', idxAcc.count);

// 24 titik kontur bukaan manset lengan kiri shirt_baked.glb
const LEFT_CUFF_RING = [
  { x: 0.2681, y: 0.0206, z: -0.0171 },
  { x: 0.2687, y: 0.0207, z: -0.0149 },
  { x: 0.2692, y: 0.0209, z: -0.0125 },
  { x: 0.2696, y: 0.0210, z: -0.0098 },
  { x: 0.2698, y: 0.0211, z: -0.0073 },
  { x: 0.2699, y: 0.0211, z: -0.0049 },
  { x: 0.2697, y: 0.0211, z: -0.0024 },
  { x: 0.2694, y: 0.0209, z: -0.0001 },
  { x: 0.2689, y: 0.0208, z: 0.0021 },
  { x: 0.2680, y: 0.0204, z: 0.0043 },
  { x: 0.2670, y: 0.0201, z: 0.0065 },
  { x: 0.2658, y: 0.0197, z: 0.0085 },
  { x: 0.2644, y: 0.0192, z: 0.0103 },
  { x: 0.2629, y: 0.0187, z: 0.0121 },
  { x: 0.2613, y: 0.0182, z: 0.0135 },
  { x: 0.2594, y: 0.0176, z: 0.0149 },
  { x: 0.2573, y: 0.0169, z: 0.0162 },
  { x: 0.2552, y: 0.0162, z: 0.0173 },
  { x: 0.2528, y: 0.0154, z: 0.0183 },
  { x: 0.2499, y: 0.0145, z: 0.0193 },
  { x: 0.2481, y: 0.0139, z: 0.0199 },
  { x: 0.2459, y: 0.0132, z: 0.0204 },
  { x: 0.2412, y: 0.0117, z: 0.0212 },
  { x: 0.2501, y: 0.0146, z: 0.0070 },
];

const newPositions = [];
const newNormals = [];
const newUvs = [];
const newIndices = [];

const N = LEFT_CUFF_RING.length;
const lengthSegs = 20;
const totalLength = 0.265;

function addForearm(isLeft) {
  const sign = isLeft ? 1 : -1;
  const cuffRing = isLeft
    ? LEFT_CUFF_RING
    : LEFT_CUFF_RING.map((p) => ({ x: -p.x, y: p.y, z: p.z }));

  let cx = 0, cy = 0, cz = 0;
  cuffRing.forEach((p) => { cx += p.x; cy += p.y; cz += p.z; });
  cx /= N; cy /= N; cz /= N;

  const rawDir = { x: sign * 0.22, y: -0.96, z: 0.14 };
  const dLen = Math.hypot(rawDir.x, rawDir.y, rawDir.z);
  const dir = { x: rawDir.x / dLen, y: rawDir.y / dLen, z: rawDir.z / dLen };

  const startVertIdx = origVertCount + (newPositions.length / 3);

  for (let r = 0; r <= lengthSegs; r++) {
    const frac = r / lengthSegs;
    // Ring 0 pas di bibir manset pendek (-0.003m), memanjang ke pergelangan
    const dist = -0.003 + frac * (totalLength + 0.003);
    const taper = frac === 0 ? 0.99 : (1.0 - frac * 0.28);

    for (let i = 0; i < N; i++) {
      const p = cuffRing[i];
      let dx = (p.x - cx) * taper;
      let dy = (p.y - cy) * taper;
      let dz = (p.z - cz) * taper;

      // Manset elastis di pergelangan
      if (frac > 0.88) {
        const ribF = (frac - 0.88) / 0.12;
        const ribAmp = Math.sin(ribF * Math.PI) * 0.0018;
        const rad = Math.hypot(dx, dz) || 1;
        dx += (dx / rad) * ribAmp;
        dz += (dz / rad) * ribAmp;
      }

      const px = cx + dir.x * dist + dx;
      const py = cy + dir.y * dist + dy;
      const pz = cz + dir.z * dist + dz;
      newPositions.push(px, py, pz);

      const rad = Math.hypot(dx, dz) || 1;
      const nx = dx / rad;
      const ny = 0.05;
      const nz = dz / rad;
      const nLen = Math.hypot(nx, ny, nz) || 1;
      newNormals.push(nx / nLen, ny / nLen, nz / nLen);

      const baseU = isLeft ? 0.465 : 0.090;
      const spanU = isLeft ? 0.205 : 0.210;
      const uvX = baseU + spanU * (i / N);
      const uvY = 0.810 + 0.170 * frac;
      newUvs.push(uvX, uvY);
    }
  }

  for (let r = 0; r < lengthSegs; r++) {
    for (let i = 0; i < N; i++) {
      const next = (i + 1) % N;
      const a = startVertIdx + r * N + i;
      const b = startVertIdx + (r + 1) * N + i;
      const c = startVertIdx + (r + 1) * N + next;
      const d = startVertIdx + r * N + next;

      if (isLeft) {
        newIndices.push(a, b, d);
        newIndices.push(b, c, d);
      } else {
        newIndices.push(a, b, d);
        newIndices.push(b, c, d);
      }
    }
  }
}

addForearm(false); // Lengan kanan
addForearm(true);  // Lengan kiri

console.log('Forearms added:', newPositions.length / 3, 'vertices,', newIndices.length / 3, 'triangles');

// Gabungkan buffer
const totalVerts = origVertCount + (newPositions.length / 3);
const totalIndices = idxAcc.count + newIndices.length;
console.log('Total vertices:', totalVerts, 'Total indices:', totalIndices);

// Buat Float32 / UInt16 buffer gabungan
const combinedPosBuf = Buffer.alloc(totalVerts * 12);
origPosBytes.copy(combinedPosBuf, 0);
for (let i = 0; i < newPositions.length; i++) {
  combinedPosBuf.writeFloatLE(newPositions[i], origPosBytes.length + i * 4);
}

const combinedNormBuf = Buffer.alloc(totalVerts * 12);
origNormBytes.copy(combinedNormBuf, 0);
for (let i = 0; i < newNormals.length; i++) {
  combinedNormBuf.writeFloatLE(newNormals[i], origNormBytes.length + i * 4);
}

const combinedUvBuf = Buffer.alloc(totalVerts * 8);
origUvBytes.copy(combinedUvBuf, 0);
for (let i = 0; i < newUvs.length; i++) {
  combinedUvBuf.writeFloatLE(newUvs[i], origUvBytes.length + i * 4);
}

const combinedIdxBuf = Buffer.alloc(totalIndices * 2);
origIdxBytes.copy(combinedIdxBuf, 0);
for (let i = 0; i < newIndices.length; i++) {
  combinedIdxBuf.writeUInt16LE(newIndices[i], origIdxBytes.length + i * 2);
}

// Byte offsets dan padding 4-byte
function pad4(len) {
  const rem = len % 4;
  return rem === 0 ? len : len + (4 - rem);
}

const posLenPadded = pad4(combinedPosBuf.length);
const normLenPadded = pad4(combinedNormBuf.length);
const uvLenPadded = pad4(combinedUvBuf.length);
const idxLenPadded = pad4(combinedIdxBuf.length);

const posOffset = 0;
const normOffset = posOffset + posLenPadded;
const uvOffset = normOffset + normLenPadded;
const idxOffset = uvOffset + uvLenPadded;

// Gambar asli (BV 4 & BV 5)
const img0Bv = gltf.bufferViews[4];
const img1Bv = gltf.bufferViews[5];
const img0Bytes = binBuf.slice(img0Bv.byteOffset, img0Bv.byteOffset + img0Bv.byteLength);
const img1Bytes = binBuf.slice(img1Bv.byteOffset, img1Bv.byteOffset + img1Bv.byteLength);

const img0Offset = idxOffset + idxLenPadded;
const img0LenPadded = pad4(img0Bytes.length);
const img1Offset = img0Offset + img0LenPadded;
const img1LenPadded = pad4(img1Bytes.length);

const totalBinLength = img1Offset + img1LenPadded;
const finalBinBuf = Buffer.alloc(totalBinLength);

combinedPosBuf.copy(finalBinBuf, posOffset);
combinedNormBuf.copy(finalBinBuf, normOffset);
combinedUvBuf.copy(finalBinBuf, uvOffset);
combinedIdxBuf.copy(finalBinBuf, idxOffset);
img0Bytes.copy(finalBinBuf, img0Offset);
img1Bytes.copy(finalBinBuf, img1Offset);

// Update glTF JSON metadata
const newGltf = JSON.parse(JSON.stringify(gltf));

// Update Accessors
newGltf.accessors[0].count = totalVerts;
// Hitung min & max position
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (let i = 0; i < totalVerts; i++) {
  const x = combinedPosBuf.readFloatLE(i * 12);
  const y = combinedPosBuf.readFloatLE(i * 12 + 4);
  const z = combinedPosBuf.readFloatLE(i * 12 + 8);
  if (x < minX) minX = x; if (x > maxX) maxX = x;
  if (y < minY) minY = y; if (y > maxY) maxY = y;
  if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
}
newGltf.accessors[0].min = [minX, minY, minZ];
newGltf.accessors[0].max = [maxX, maxY, maxZ];

newGltf.accessors[1].count = totalVerts;
newGltf.accessors[2].count = totalVerts;
newGltf.accessors[3].count = totalIndices;

// Update BufferViews
newGltf.bufferViews[0].byteOffset = posOffset;
newGltf.bufferViews[0].byteLength = combinedPosBuf.length;

newGltf.bufferViews[1].byteOffset = normOffset;
newGltf.bufferViews[1].byteLength = combinedNormBuf.length;

newGltf.bufferViews[2].byteOffset = uvOffset;
newGltf.bufferViews[2].byteLength = combinedUvBuf.length;

newGltf.bufferViews[3].byteOffset = idxOffset;
newGltf.bufferViews[3].byteLength = combinedIdxBuf.length;

newGltf.bufferViews[4].byteOffset = img0Offset;
newGltf.bufferViews[4].byteLength = img0Bytes.length;

newGltf.bufferViews[5].byteOffset = img1Offset;
newGltf.bufferViews[5].byteLength = img1Bytes.length;

newGltf.buffers[0].byteLength = totalBinLength;

// Pack GLB
const newJsonStr = JSON.stringify(newGltf);
const newJsonPaddedLen = pad4(Buffer.byteLength(newJsonStr, 'utf8'));
const newJsonBuf = Buffer.alloc(newJsonPaddedLen, 0x20); // Pad with spaces
newJsonBuf.write(newJsonStr, 'utf8');

const glbHeaderLen = 12;
const chunk0HeaderLen = 8;
const chunk1HeaderLen = 8;
const totalGlbLen = glbHeaderLen + chunk0HeaderLen + newJsonPaddedLen + chunk1HeaderLen + totalBinLength;

const outGlbBuf = Buffer.alloc(totalGlbLen);

// GLB Header
outGlbBuf.writeUInt32LE(0x46546C67, 0); // 'glTF'
outGlbBuf.writeUInt32LE(2, 4);          // version 2
outGlbBuf.writeUInt32LE(totalGlbLen, 8);

// Chunk 0: JSON
outGlbBuf.writeUInt32LE(newJsonPaddedLen, 12);
outGlbBuf.writeUInt32LE(0x4E4F534A, 16); // 'JSON'
newJsonBuf.copy(outGlbBuf, 20);

// Chunk 1: BIN
const chunk1HeaderOffset = 20 + newJsonPaddedLen;
outGlbBuf.writeUInt32LE(totalBinLength, chunk1HeaderOffset);
outGlbBuf.writeUInt32LE(0x004E4942, chunk1HeaderOffset + 4); // 'BIN\0'
finalBinBuf.copy(outGlbBuf, chunk1HeaderOffset + 8);

fs.writeFileSync(outGlbPath, outGlbBuf);
console.log('Successfully written shirt_long_sleeve.glb!');
console.log('Output size:', (outGlbBuf.length / (1024 * 1024)).toFixed(2), 'MB');

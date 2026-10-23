/**
 * generate_perfect_long_sleeve.cjs
 * Menghasilkan model 3D Lengan Panjang yang sempurna:
 * 1. Bagian badan, ketiak, dan bahu 100% asli dari shirt_baked.glb (zero slit, zero hole).
 * 2. Lengan bawah memanjang dari lingkar manset pendek asli hingga pergelangan tangan.
 * 3. Berbentuk tabung 3D penuh dengan volume anatomis, manset elastis di pergelangan, dan lipatan dalam rapi.
 */

const fs = require('fs');
const path = require('path');

const srcGlbPath = 'd:/Project/Web Jersey/public/shirt_baked.glb';
const outGlbPath = 'd:/Project/Web Jersey/public/shirt_long_sleeve.glb';

const buf = fs.readFileSync(srcGlbPath);
const jsonLen = buf.readUInt32LE(12);
const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
const gltf = JSON.parse(jsonStr);

const binChunkOffset = 20 + jsonLen + 8;
const binBuf = buf.slice(binChunkOffset);

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
console.log('Original vertices:', origVertCount, 'indices:', idxAcc.count);

// 32 Titik profil lingkar manset lengan kiri shirt_baked.glb
const LEFT_CUFF_PROFILE = [
  { x: 0.1604, y: -0.0119, z: -0.0261 },
  { x: 0.1605, y: -0.0117, z: -0.0311 },
  { x: 0.1610, y: -0.0116, z: -0.0381 },
  { x: 0.1619, y: -0.0113, z: -0.0439 },
  { x: 0.1627, y: -0.0110, z: -0.0486 },
  { x: 0.1652, y: -0.0103, z: -0.0555 },
  { x: 0.1690, y: -0.0092, z: -0.0624 },
  { x: 0.1742, y: -0.0077, z: -0.0682 },
  { x: 0.1836, y: -0.0049, z: -0.0744 },
  { x: 0.1936, y: -0.0020, z: -0.0771 },
  { x: 0.2044, y: 0.0010, z: -0.0769 },
  { x: 0.2145, y: 0.0038, z: -0.0745 },
  { x: 0.2245, y: 0.0068, z: -0.0700 },
  { x: 0.2345, y: 0.0097, z: -0.0632 },
  { x: 0.2455, y: 0.0131, z: -0.0530 },
  { x: 0.2469, y: 0.0136, z: -0.0515 },
  { x: 0.2480, y: 0.0138, z: -0.0260 },
  { x: 0.2488, y: 0.0141, z: -0.0007 },
  { x: 0.2458, y: 0.0132, z: 0.0203 },
  { x: 0.2380, y: 0.0108, z: 0.0215 },
  { x: 0.2301, y: 0.0080, z: 0.0224 },
  { x: 0.2188, y: 0.0042, z: 0.0236 },
  { x: 0.2061, y: -0.0003, z: 0.0248 },
  { x: 0.1920, y: -0.0053, z: 0.0246 },
  { x: 0.1840, y: -0.0080, z: 0.0227 },
  { x: 0.1739, y: -0.0111, z: 0.0167 },
  { x: 0.1673, y: -0.0125, z: 0.0085 },
  { x: 0.1643, y: -0.0129, z: 0.0023 },
  { x: 0.1621, y: -0.0128, z: -0.0049 },
  { x: 0.1613, y: -0.0125, z: -0.0104 },
  { x: 0.1596, y: -0.0074, z: -0.0183 },
  { x: 0.1601, y: -0.0122, z: -0.0216 },
];

const N = LEFT_CUFF_PROFILE.length; // 32
const lengthSegs = 22; // 22 rings along length
const totalLength = 0.275; // 27.5 cm reaching wrist

const newPositions = [];
const newNormals = [];
const newUvs = [];
const newIndices = [];

function addForearm(isLeft) {
  const sign = isLeft ? 1 : -1;
  const cuffRing = isLeft
    ? LEFT_CUFF_PROFILE
    : LEFT_CUFF_PROFILE.map(p => ({ x: -p.x, y: p.y, z: p.z }));

  let cx = 0, cy = 0, cz = 0;
  cuffRing.forEach(p => { cx += p.x; cy += p.y; cz += p.z; });
  cx /= N; cy /= N; cz /= N;

  // Natural arm vector: goes down and slightly inward
  const rawDir = { x: sign * -0.206, y: -0.976, z: -0.065 };
  const dLen = Math.hypot(rawDir.x, rawDir.y, rawDir.z);
  const dir = { x: rawDir.x / dLen, y: rawDir.y / dLen, z: rawDir.z / dLen };

  const startVertIdx = origVertCount + (newPositions.length / 3);

  for (let r = 0; r <= lengthSegs; r++) {
    const frac = r / lengthSegs;
    // Ring 0 starts with small negative distance (-0.005m) to tuck smoothly inside the short cuff
    const dist = -0.005 + frac * (totalLength + 0.005);

    // Anatomical taper: forearm tapers gently toward the wrist
    let taper = 1.0 - frac * 0.24;

    // Ribbed wrist cuff (manset pergelangan tangan) di 12% ujung lengan
    if (frac > 0.88) {
      const cuffFrac = (frac - 0.88) / 0.12;
      // Slight snug rib indentation + wave
      const ribWave = Math.sin(cuffFrac * Math.PI * 3) * 0.0015;
      taper = (1.0 - 0.24 * 0.88) - cuffFrac * 0.04 + ribWave;
    }

    for (let i = 0; i < N; i++) {
      const p = cuffRing[i];
      let dx = (p.x - cx) * taper;
      let dy = (p.y - cy) * taper;
      let dz = (p.z - cz) * taper;

      const px = cx + dir.x * dist + dx;
      const py = cy + dir.y * dist + dy;
      const pz = cz + dir.z * dist + dz;
      newPositions.push(px, py, pz);

      // Normal radial
      const rad = Math.hypot(dx, dz) || 1;
      const nx = dx / rad;
      const ny = 0.05;
      const nz = dz / rad;
      const nLen = Math.hypot(nx, ny, nz) || 1;
      newNormals.push(nx / nLen, ny / nLen, nz / nLen);

      // UV atlas mapping: left sleeve U=[0.40, 0.75], right sleeve U=[0.05, 0.38]
      const baseU = isLeft ? 0.420 : 0.060;
      const spanU = isLeft ? 0.310 : 0.310;
      const uvX = baseU + spanU * (i / N);
      const uvY = 0.750 + 0.220 * frac;
      newUvs.push(uvX, uvY);
    }
  }

  // Generate triangles
  for (let r = 0; r < lengthSegs; r++) {
    for (let i = 0; i < N; i++) {
      const next = (i + 1) % N;
      const a = startVertIdx + r * N + i;
      const b = startVertIdx + (r + 1) * N + i;
      const c = startVertIdx + (r + 1) * N + next;
      const d = startVertIdx + r * N + next;

      if (isLeft) {
        newIndices.push(a, d, b);
        newIndices.push(b, d, c);
      } else {
        newIndices.push(a, b, d);
        newIndices.push(b, c, d);
      }
    }
  }

  // Inward hem lip at the wrist so the sleeve opening has 3D thickness (not paper-thin)
  const wristRingIdx = startVertIdx + lengthSegs * N;
  const innerLipIdx = origVertCount + (newPositions.length / 3);
  for (let i = 0; i < N; i++) {
    const p = cuffRing[i];
    const taper = 0.68;
    const dx = (p.x - cx) * taper;
    const dy = (p.y - cy) * taper;
    const dz = (p.z - cz) * taper;

    const px = cx + dir.x * (totalLength - 0.008) + dx;
    const py = cy + dir.y * (totalLength - 0.008) + dy;
    const pz = cz + dir.z * (totalLength - 0.008) + dz;
    newPositions.push(px, py, pz);
    newNormals.push(-dir.x, -dir.y, -dir.z);
    newUvs.push(isLeft ? 0.55 : 0.20, 0.98);
  }

  for (let i = 0; i < N; i++) {
    const next = (i + 1) % N;
    const a = wristRingIdx + i;
    const b = innerLipIdx + i;
    const c = innerLipIdx + next;
    const d = wristRingIdx + next;
    if (isLeft) {
      newIndices.push(a, d, b);
      newIndices.push(b, d, c);
    } else {
      newIndices.push(a, b, d);
      newIndices.push(b, c, d);
    }
  }
}

addForearm(true);  // Left sleeve
addForearm(false); // Right sleeve

console.log('Forearms added:');
console.log('New verts:', newPositions.length / 3, 'New indices:', newIndices.length);

const totalVerts = origVertCount + (newPositions.length / 3);
const totalIndices = idxAcc.count + newIndices.length;
console.log('Total verts:', totalVerts, 'Total indices:', totalIndices);

// Buffer allocation
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

// Embedded images
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

// Update glTF JSON
const newGltf = JSON.parse(JSON.stringify(gltf));

newGltf.accessors[0].count = totalVerts;
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

newGltf.bufferViews[0].byteOffset = posOffset;
newGltf.bufferViews[0].byteLength = combinedPosBuf.length;

newGltf.bufferViews[1].byteOffset = normOffset;
newGltf.bufferViews[1].byteLength = combinedNormBuf.length;

newGltf.bufferViews[2].byteOffset = uvOffset;
newGltf.bufferViews[2].byteLength = combinedUvBuf.length;

newGltf.bufferViews[3].byteOffset = idxOffset;
newGltf.bufferViews[3].byteLength = combinedIdxBuf.length;

newGltf.bufferViews[4].byteOffset = img0Offset;
newGltf.bufferViews[5].byteOffset = img1Offset;

newGltf.buffers[0].byteLength = totalBinLength;

// Serialize GLB
const jsonBuf = Buffer.from(JSON.stringify(newGltf), 'utf8');
const jsonPad = (4 - (jsonBuf.length % 4)) % 4;
const paddedJsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(jsonPad, 0x20)]);

const totalGlbLen = 12 + 8 + paddedJsonBuf.length + 8 + totalBinLength;
const finalGlb = Buffer.alloc(totalGlbLen);

finalGlb.writeUInt32LE(0x46546C67, 0); // 'glTF'
finalGlb.writeUInt32LE(2, 4);          // version 2
finalGlb.writeUInt32LE(totalGlbLen, 8);

// JSON chunk
finalGlb.writeUInt32LE(paddedJsonBuf.length, 12);
finalGlb.writeUInt32LE(0x4E4F534A, 16);
paddedJsonBuf.copy(finalGlb, 20);

// BIN chunk
const binHeaderOff = 20 + paddedJsonBuf.length;
finalGlb.writeUInt32LE(totalBinLength, binHeaderOff);
finalGlb.writeUInt32LE(0x004E4942, binHeaderOff + 4);
finalBinBuf.copy(finalGlb, binHeaderOff + 8);

fs.writeFileSync(outGlbPath, finalGlb);
console.log('SUCCESS! Wrote', outGlbPath, 'size:', finalGlb.length);

const distPath = path.join('d:/Project/Web Jersey/dist', 'shirt_long_sleeve.glb');
if (fs.existsSync('d:/Project/Web Jersey/dist')) {
  fs.copyFileSync(outGlbPath, distPath);
  console.log('Copied to dist/shirt_long_sleeve.glb');
}

/**
 * generate_true_long_sleeve.cjs
 * Menghasilkan model 3D Lengan Panjang Sejati (Gambar 5):
 * 1. 100% Geometri asli tanpa potongan/celah di ketiak (seam ketiak 100% terkunci).
 * 2. Lengan menyatu mulus (single continuous sleeve) dari pundak hingga pergelangan tangan (tanpa cuff lengan pendek di tengah).
 * 3. Tapering anatomis ke pergelangan tangan dengan normal shading PBR yang mulus.
 */

const fs = require('fs');
const path = require('path');

const srcGlbPath = path.resolve('public/shirt_baked.glb');
const outGlbPath = path.resolve('public/shirt_long_sleeve.glb');
const distGlbPath = path.resolve('dist/shirt_long_sleeve.glb');

const buf = fs.readFileSync(srcGlbPath);
const jsonLen = buf.readUInt32LE(12);
const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
const gltf = JSON.parse(jsonStr);

const binChunkOffset = 20 + jsonLen + 8;
const binBuf = buf.slice(binChunkOffset);

const posAcc = gltf.accessors[0];
const posBv = gltf.bufferViews[posAcc.bufferView];
const normAcc = gltf.accessors[1];
const normBv = gltf.bufferViews[normAcc.bufferView];
const idxAcc = gltf.accessors[3];
const idxBv = gltf.bufferViews[idxAcc.bufferView];

const count = posAcc.count; // 10513
const idxCount = idxAcc.count; // 58551

const pos = [];
for (let i = 0; i < count; i++) {
  pos.push([
    binBuf.readFloatLE(posBv.byteOffset + i * 12),
    binBuf.readFloatLE(posBv.byteOffset + i * 12 + 4),
    binBuf.readFloatLE(posBv.byteOffset + i * 12 + 8)
  ]);
}

const indices = [];
for (let i = 0; i < idxCount; i++) {
  indices.push(binBuf.readUInt16LE(idxBv.byteOffset + i * 2));
}

// Build adjacency
const adj = Array.from({ length: count }, () => []);
for (let i = 0; i < idxCount; i += 3) {
  const a = indices[i], b = indices[i + 1], c = indices[i + 2];
  adj[a].push(b, c); adj[b].push(a, c); adj[c].push(a, b);
}

function processSleeve(isLeft) {
  const sign = isLeft ? 1 : -1;
  let targetV = 0, bestX = isLeft ? -999 : 999;
  for (let i = 0; i < count; i++) {
    if (isLeft ? (pos[i][0] > bestX) : (pos[i][0] < bestX)) {
      bestX = pos[i][0]; targetV = i;
    }
  }

  const visited = new Set();
  const sleeveVerts = [];
  const q = [targetV];
  visited.add(targetV);
  while (q.length > 0) {
    const u = q.pop(); sleeveVerts.push(u);
    for (const v of adj[u]) {
      if (!visited.has(v)) { visited.add(v); q.push(v); }
    }
  }
  const sleeveSet = new Set(sleeveVerts);

  // Torso candidates
  const torsoVerts = [];
  for (let i = 0; i < count; i++) {
    if (!sleeveSet.has(i) && Math.abs(pos[i][0]) > 0.05 && pos[i][1] > -0.15 && pos[i][1] < 0.25) {
      torsoVerts.push(i);
    }
  }

  // Seam vertices (within 4mm of torso) - 100% static anchor
  const seamVerts = new Set();
  for (const s of sleeveVerts) {
    const sp = pos[s];
    for (const t of torsoVerts) {
      const tp = pos[t];
      if (Math.hypot(sp[0] - tp[0], sp[1] - tp[1], sp[2] - tp[2]) < 0.004) {
        seamVerts.add(s);
        break;
      }
    }
  }

  // Dijkstra on sleeve mesh
  const sleeveAdj = new Map();
  for (const s of sleeveVerts) {
    sleeveAdj.set(s, []);
    for (const neighbor of adj[s]) {
      if (sleeveSet.has(neighbor)) {
        const sp = pos[s], np = pos[neighbor];
        const w = Math.hypot(sp[0] - np[0], sp[1] - np[1], sp[2] - np[2]);
        sleeveAdj.get(s).push({ v: neighbor, w });
      }
    }
  }

  const distArr = new Float32Array(count).fill(Infinity);
  for (const s of seamVerts) distArr[s] = 0;
  const pq = Array.from(seamVerts);
  while (pq.length > 0) {
    let minIdx = 0;
    for (let i = 1; i < pq.length; i++) {
      if (distArr[pq[i]] < distArr[pq[minIdx]]) minIdx = i;
    }
    const u = pq.splice(minIdx, 1)[0];
    const dU = distArr[u];
    for (const { v, w } of sleeveAdj.get(u)) {
      if (dU + w < distArr[v]) {
        distArr[v] = dU + w;
        if (!pq.includes(v)) pq.push(v);
      }
    }
  }

  let maxDist = 0;
  for (const s of sleeveVerts) maxDist = Math.max(maxDist, distArr[s]);

  // Natural arm hang vector (proporsional atletis seperti Gambar 5)
  const rawDir = { x: sign * -0.19, y: -0.975, z: -0.055 };
  const dLen = Math.hypot(rawDir.x, rawDir.y, rawDir.z);
  const dir = { x: rawDir.x / dLen, y: rawDir.y / dLen, z: rawDir.z / dLen };

  const targetExtension = 0.295; // Ekstensi memanjang ke pergelangan tangan (y ~ -0.30m)
  const dThreshold = 0.030;      // 3 cm buffer dari jahitan ketiak/bahu tetap 100% diam

  // Pusat sendi bahu
  let scx = 0, scy = 0, scz = 0;
  for (const s of seamVerts) {
    scx += pos[s][0]; scy += pos[s][1]; scz += pos[s][2];
  }
  scx /= seamVerts.size; scy /= seamVerts.size; scz /= seamVerts.size;

  let moved = 0;
  for (const s of sleeveVerts) {
    const d = distArr[s];
    if (d > dThreshold) {
      const normD = (d - dThreshold) / (maxDist - dThreshold);
      const w = Math.pow(normD, 1.25);

      // Taper anatomis pergelangan tangan (22% lebih ramping di manset)
      const taper = 1.0 - w * 0.22;

      const baseShiftX = scx + dir.x * (d * 0.85 + w * targetExtension);
      const baseShiftY = scy + dir.y * (d * 0.85 + w * targetExtension);
      const baseShiftZ = scz + dir.z * (d * 0.85 + w * targetExtension);

      const rx = (pos[s][0] - scx - dir.x * d * 0.85) * taper;
      const ry = (pos[s][1] - scy - dir.y * d * 0.85) * taper;
      const rz = (pos[s][2] - scz - dir.z * d * 0.85) * taper;

      pos[s][0] = baseShiftX + rx;
      pos[s][1] = baseShiftY + ry;
      pos[s][2] = baseShiftZ + rz;

      moved++;
    }
  }

  console.log(`[processSleeve] ${isLeft ? 'Kiri' : 'Kanan'}: ${moved}/${sleeveVerts.length} vertex dipanjangkan secara mulus.`);
}

processSleeve(true);
processSleeve(false);

// Recalculate Vertex Normals across entire mesh for smooth PBR shading
const normals = Array.from({ length: count }, () => [0, 0, 0]);
for (let i = 0; i < idxCount; i += 3) {
  const iA = indices[i], iB = indices[i + 1], iC = indices[i + 2];
  const pA = pos[iA], pB = pos[iB], pC = pos[iC];

  const vBA = [pB[0] - pA[0], pB[1] - pA[1], pB[2] - pA[2]];
  const vCA = [pC[0] - pA[0], pC[1] - pA[1], pC[2] - pA[2]];

  const fn = [
    vBA[1] * vCA[2] - vBA[2] * vCA[1],
    vBA[2] * vCA[0] - vBA[0] * vCA[2],
    vBA[0] * vCA[1] - vBA[1] * vCA[0]
  ];

  for (const idx of [iA, iB, iC]) {
    normals[idx][0] += fn[0];
    normals[idx][1] += fn[1];
    normals[idx][2] += fn[2];
  }
}

for (let i = 0; i < count; i++) {
  const n = normals[i];
  const len = Math.hypot(n[0], n[1], n[2]) || 1;
  n[0] /= len; n[1] /= len; n[2] /= len;
}

// Write back to binary buffer
const newBinBuf = Buffer.from(binBuf);
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;

for (let i = 0; i < count; i++) {
  const x = pos[i][0], y = pos[i][1], z = pos[i][2];
  newBinBuf.writeFloatLE(x, posBv.byteOffset + i * 12);
  newBinBuf.writeFloatLE(y, posBv.byteOffset + i * 12 + 4);
  newBinBuf.writeFloatLE(z, posBv.byteOffset + i * 12 + 8);

  newBinBuf.writeFloatLE(normals[i][0], normBv.byteOffset + i * 12);
  newBinBuf.writeFloatLE(normals[i][1], normBv.byteOffset + i * 12 + 4);
  newBinBuf.writeFloatLE(normals[i][2], normBv.byteOffset + i * 12 + 8);

  if (x < minX) minX = x; if (x > maxX) maxX = x;
  if (y < minY) minY = y; if (y > maxY) maxY = y;
  if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
}

const newGltf = JSON.parse(JSON.stringify(gltf));
newGltf.accessors[0].min = [minX, minY, minZ];
newGltf.accessors[0].max = [maxX, maxY, maxZ];

const jsonBuffer = Buffer.from(JSON.stringify(newGltf), 'utf8');
const jsonPad = (4 - (jsonBuffer.length % 4)) % 4;
const paddedJson = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPad, 0x20)]);

const totalLength = 12 + 8 + paddedJson.length + 8 + newBinBuf.length;
const finalGlb = Buffer.alloc(totalLength);

finalGlb.writeUInt32LE(0x46546C67, 0); // 'glTF'
finalGlb.writeUInt32LE(2, 4);
finalGlb.writeUInt32LE(totalLength, 8);

// JSON Chunk
finalGlb.writeUInt32LE(paddedJson.length, 12);
finalGlb.writeUInt32LE(0x4E4F534A, 16);
paddedJson.copy(finalGlb, 20);

// BIN Chunk
const binOffset = 20 + paddedJson.length;
finalGlb.writeUInt32LE(newBinBuf.length, binOffset);
finalGlb.writeUInt32LE(0x004E4942, binOffset + 4);
newBinBuf.copy(finalGlb, binOffset + 8);

fs.writeFileSync(outGlbPath, finalGlb);
console.log('BERHASIL! Wrote', outGlbPath, 'size:', finalGlb.length);

if (fs.existsSync(path.dirname(distGlbPath))) {
  fs.copyFileSync(outGlbPath, distGlbPath);
  console.log('Disalin ke', distGlbPath);
}

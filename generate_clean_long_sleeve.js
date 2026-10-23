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
const normAcc = gltf.accessors[1];
const normBv = gltf.bufferViews[normAcc.bufferView];
const idxAcc = gltf.accessors[3];
const idxBv = gltf.bufferViews[idxAcc.bufferView];

const count = posAcc.count; // 10513
const idxCount = idxAcc.count; // 58551

// Build adjacency to identify components
const adj = Array.from({ length: count }, () => []);
for (let i = 0; i < idxCount; i += 3) {
  const a = binBuf.readUInt16LE(idxBv.byteOffset + i * 2);
  const b = binBuf.readUInt16LE(idxBv.byteOffset + (i + 1) * 2);
  const c = binBuf.readUInt16LE(idxBv.byteOffset + (i + 2) * 2);
  adj[a].push(b, c);
  adj[b].push(a, c);
  adj[c].push(a, b);
}

const visited = new Set();
const components = [];
for (let i = 0; i < count; i++) {
  if (!visited.has(i)) {
    const comp = [];
    const q = [i];
    visited.add(i);
    while (q.length > 0) {
      const u = q.pop();
      comp.push(u);
      for (const v of adj[u]) {
        if (!visited.has(v)) {
          visited.add(v);
          q.push(v);
        }
      }
    }
    components.push(comp);
  }
}

// Identify sleeves
const leftSleeveSet = new Set(components.find(c => {
  let minX = Infinity;
  for (const v of c) {
    const x = binBuf.readFloatLE(posBv.byteOffset + v * 12);
    if (x < minX) minX = x;
  }
  return minX > 0.14;
}));

const rightSleeveSet = new Set(components.find(c => {
  let maxX = -Infinity;
  for (const v of c) {
    const x = binBuf.readFloatLE(posBv.byteOffset + v * 12);
    if (x > maxX) maxX = x;
  }
  return maxX < -0.14;
}));

console.log('Left sleeve verts:', leftSleeveSet.size, 'Right sleeve verts:', rightSleeveSet.size);

// Create modified positions buffer (same vertex count 10513!)
const newPosBuf = Buffer.from(binBuf.slice(posBv.byteOffset, posBv.byteOffset + posBv.byteLength));
const newNormBuf = Buffer.from(binBuf.slice(normBv.byteOffset, normBv.byteOffset + normBv.byteLength));

function deformSleeve(sleeveSet, isLeft) {
  const sign = isLeft ? 1 : -1;
  const shoulder = { x: sign * 0.222, y: 0.180, z: -0.015 };
  
  // Natural arm hang vector: goes down and slightly inward
  const armDir = { x: sign * -0.16, y: -0.97, z: -0.03 };
  const dLen = Math.hypot(armDir.x, armDir.y, armDir.z);
  armDir.x /= dLen; armDir.y /= dLen; armDir.z /= dLen;

  const tStart = 0.045; // Start extending below armpit / shoulder seam
  const tEnd = 0.210;   // Original cuff
  const targetExtension = 0.260; // Extra length to reach wrist (total length ~0.46m)

  for (const v of sleeveSet) {
    const origX = binBuf.readFloatLE(posBv.byteOffset + v * 12);
    const origY = binBuf.readFloatLE(posBv.byteOffset + v * 12 + 4);
    const origZ = binBuf.readFloatLE(posBv.byteOffset + v * 12 + 8);

    const dx = origX - shoulder.x;
    const dy = origY - shoulder.y;
    const dz = origZ - shoulder.z;
    const t = dx * armDir.x + dy * armDir.y + dz * armDir.z;

    if (t > tStart) {
      // Fraction along the sleeve below the shoulder seam
      const s = Math.min(1.0, (t - tStart) / (tEnd - tStart));
      // Smooth cubic ease for natural cloth drape
      const easeS = s * s * (3 - 2 * s);
      
      // Extension along arm direction
      const ext = easeS * targetExtension;

      // Radial displacement vector from arm axis
      const rx = dx - t * armDir.x;
      const ry = dy - t * armDir.y;
      const rz = dz - t * armDir.z;

      // Anatomical wrist taper (15% taper towards wrist)
      const taper = 1.0 - easeS * 0.18;

      const newX = shoulder.x + (t + ext) * armDir.x + rx * taper;
      const newY = shoulder.y + (t + ext) * armDir.y + ry * taper;
      const newZ = shoulder.z + (t + ext) * armDir.z + rz * taper;

      newPosBuf.writeFloatLE(newX, v * 12);
      newPosBuf.writeFloatLE(newY, v * 12 + 4);
      newPosBuf.writeFloatLE(newZ, v * 12 + 8);
    }
  }
}

deformSleeve(leftSleeveSet, true);
deformSleeve(rightSleeveSet, false);

// Recalculate normals for smooth lighting across the extended sleeve
// Extract positions to arrays
const positions = [];
for (let i = 0; i < count; i++) {
  positions.push([
    newPosBuf.readFloatLE(i * 12),
    newPosBuf.readFloatLE(i * 12 + 4),
    newPosBuf.readFloatLE(i * 12 + 8),
  ]);
}

const normals = Array.from({ length: count }, () => [0, 0, 0]);
for (let i = 0; i < idxCount; i += 3) {
  const a = binBuf.readUInt16LE(idxBv.byteOffset + i * 2);
  const b = binBuf.readUInt16LE(idxBv.byteOffset + (i + 1) * 2);
  const c = binBuf.readUInt16LE(idxBv.byteOffset + (i + 2) * 2);

  const pa = positions[a];
  const pb = positions[b];
  const pc = positions[c];

  const ab = [pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]];
  const ac = [pc[0] - pa[0], pc[1] - pa[1], pc[2] - pa[2]];

  const cross = [
    ab[1] * ac[2] - ab[2] * ac[1],
    ab[2] * ac[0] - ab[0] * ac[2],
    ab[0] * ac[1] - ab[1] * ac[0],
  ];

  normals[a][0] += cross[0]; normals[a][1] += cross[1]; normals[a][2] += cross[2];
  normals[b][0] += cross[0]; normals[b][1] += cross[1]; normals[b][2] += cross[2];
  normals[c][0] += cross[0]; normals[c][1] += cross[1]; normals[c][2] += cross[2];
}

for (let i = 0; i < count; i++) {
  // Only update normals for sleeves to preserve exact baked body normals
  if (leftSleeveSet.has(i) || rightSleeveSet.has(i)) {
    const n = normals[i];
    const len = Math.hypot(n[0], n[1], n[2]) || 1;
    newNormBuf.writeFloatLE(n[0] / len, i * 12);
    newNormBuf.writeFloatLE(n[1] / len, i * 12 + 4);
    newNormBuf.writeFloatLE(n[2] / len, i * 12 + 8);
  }
}

// Compute new bounding box
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (let i = 0; i < count; i++) {
  const x = positions[i][0];
  const y = positions[i][1];
  const z = positions[i][2];
  if (x < minX) minX = x; if (x > maxX) maxX = x;
  if (y < minY) minY = y; if (y > maxY) maxY = y;
  if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
}

// Build final GLB file
const newGltf = JSON.parse(JSON.stringify(gltf));
newGltf.accessors[0].min = [minX, minY, minZ];
newGltf.accessors[0].max = [maxX, maxY, maxZ];

// Construct new binary buffer with updated positions and normals
const newBinBuf = Buffer.from(binBuf);
newPosBuf.copy(newBinBuf, posBv.byteOffset);
newNormBuf.copy(newBinBuf, normBv.byteOffset);

const newJsonStr = JSON.stringify(newGltf);
const newJsonBuf = Buffer.from(newJsonStr, 'utf8');
const pad = (4 - (newJsonBuf.length % 4)) % 4;
const paddedJsonBuf = Buffer.concat([newJsonBuf, Buffer.alloc(pad, 0x20)]);

const totalLen = 12 + 8 + paddedJsonBuf.length + 8 + newBinBuf.length;
const finalGlb = Buffer.alloc(totalLen);

finalGlb.writeUInt32LE(0x46546C67, 0); // 'glTF'
finalGlb.writeUInt32LE(2, 4);          // version 2
finalGlb.writeUInt32LE(totalLen, 8);   // total length

// JSON chunk
finalGlb.writeUInt32LE(paddedJsonBuf.length, 12);
finalGlb.writeUInt32LE(0x4E4F534A, 16); // 'JSON'
paddedJsonBuf.copy(finalGlb, 20);

// BIN chunk
const binHeaderOffset = 20 + paddedJsonBuf.length;
finalGlb.writeUInt32LE(newBinBuf.length, binHeaderOffset);
finalGlb.writeUInt32LE(0x004E4942, binHeaderOffset + 4); // 'BIN\0'
newBinBuf.copy(finalGlb, binHeaderOffset + 8);

fs.writeFileSync(outGlbPath, finalGlb);
console.log('Successfully wrote clean shirt_long_sleeve.glb!');
console.log('Bounds: X=[', minX.toFixed(3), maxX.toFixed(3), '] Y=[', minY.toFixed(3), maxY.toFixed(3), '] Z=[', minZ.toFixed(3), maxZ.toFixed(3), ']');

// Also copy to dist if dist exists
const distPath = path.join('d:/Project/Web Jersey/dist', 'shirt_long_sleeve.glb');
if (fs.existsSync('d:/Project/Web Jersey/dist')) {
  fs.copyFileSync(outGlbPath, distPath);
  console.log('Copied to dist/shirt_long_sleeve.glb');
}

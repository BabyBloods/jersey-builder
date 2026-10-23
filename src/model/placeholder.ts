/**
 * model/placeholder.ts — Model Jersey 3D Realistis & Proporsional
 *
 * Dibangun murni dari Three.js BufferGeometry tanpa artefak distorsi gelombang/benjolan.
 * Karakteristik utama:
 * 1. Torso atletis rata dengan kelim lurus, motif tekstur mengalir lurus tanpa distorsi U-shape
 * 2. Bahu miring alami (shoulder slope) menyambung mulus ke lengan
 * 3. Lengan menggantung santai ke bawah samping (sudut ~45° alami)
 * 4. Kerah rib-knit ramping (slim profile) yang terpasang rapi di lingkar leher
 * 5. UV Mapping presisi:
 *    - Panel Depan: UV [0.02, 0.48] (pusat u = 0.25 tepat di tengah dada)
 *    - Panel Belakang: UV [0.52, 0.98] (pusat u = 0.75 tepat di tengah punggung)
 *    - Jahitan di samping badan dan atas bahu (tanpa jahitan/sobekan di dada)
 */

import * as THREE from 'three'

export interface JerseyMeshes {
  body: THREE.Mesh
  sleeve_l: THREE.Mesh
  sleeve_r: THREE.Mesh
  sleeve_l_long?: THREE.Mesh
  sleeve_r_long?: THREE.Mesh
  collar: THREE.Mesh
  group: THREE.Group
}

// ─────────────────────────────────────────────────────────
// 1. Geometri Badan Jersey (Torso Depan & Belakang)
// ─────────────────────────────────────────────────────────

function createBodyGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()

  const nx = 36 // resolusi horizontal
  const ny = 32 // resolusi vertikal

  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  // Helper lebar badan pada tinggi v (0 = kelim bawah, 1 = bahu atas)
  function getHalfWidth(v: number): number {
    if (v < 0.35) {
      // Kelim ke pinggang (sedikit meramping atletis)
      const f = v / 0.35
      return 0.285 - 0.02 * Math.sin(f * (Math.PI / 2)) // 0.285 -> 0.265
    } else if (v < 0.70) {
      // Pinggang ke ketiak/dada (melebar atletis)
      const f = (v - 0.35) / 0.35
      return 0.265 + 0.035 * Math.sin(f * (Math.PI / 2)) // 0.265 -> 0.300
    } else {
      // Ketiak ke ujung bahu
      const f = (v - 0.70) / 0.30
      return 0.300 + 0.075 * f // 0.300 -> 0.375
    }
  }

  // --- A. PANEL DEPAN ---
  const frontOffset = 0

  for (let iy = 0; iy <= ny; iy++) {
    const v = iy / ny
    const hw = getHalfWidth(v)

    for (let ix = 0; ix <= nx; ix++) {
      const u = ix / nx
      const t = (u - 0.5) * 2 // -1 (kiri) sampai +1 (kanan)
      const absT = Math.abs(t)

      // X: posisi horizontal
      let px: number
      if (v < 0.78) {
        px = t * hw
      } else {
        // Area bahu & leher
        const neckCutoutRadius = 0.36
        if (absT <= neckCutoutRadius) {
          px = (t / neckCutoutRadius) * 0.125
        } else {
          const f = (absT - neckCutoutRadius) / (1.0 - neckCutoutRadius)
          px = Math.sign(t) * (0.125 + f * (0.375 - 0.125))
        }
      }

      // Y: KUNCI AGAR MOTIF TIDAK BENGKOK/U-SHAPE:
      // Dari kelim bawah (v=0) hingga dada atas (v=0.78), py dibuat LURUS & SERAGAM!
      let py: number
      if (v <= 0.78) {
        // Garis lurus horizontal, hanya sedikit lengkungan halus di kelim bawah paling bawah (v < 0.08)
        const hemCurve = v < 0.08 ? (0.015 * (1.0 - t * t) * (1.0 - v / 0.08)) : 0
        py = -0.52 + v * 0.88 - hemCurve
      } else {
        // Hanya 22% paling atas (area bahu dan kerah leher) yang melandai
        const vTop = (v - 0.78) / 0.22
        const yBase = -0.52 + 0.78 * 0.88 // y di garis dada atas ~ 0.166

        const neckCutoutRadius = 0.36
        let targetY: number
        if (absT <= neckCutoutRadius) {
          // Kerah depan melengkung turun secara proporsional
          const neckFrac = absT / neckCutoutRadius
          targetY = 0.30 + 0.10 * (neckFrac * neckFrac)
        } else {
          // Garis bahu melandai ke samping
          const f = (absT - neckCutoutRadius) / (1.0 - neckCutoutRadius)
          targetY = 0.40 - 0.05 * f
        }

        py = yBase + vTop * (targetY - yBase)
      }

      // Z: Kontur dada atletis yang rata dan alami (BUKAN benjolan bola)
      const zBase = 0.082
      const chestFullness = (v >= 0.35 && v <= 0.75) ? 0.012 * Math.sin(((v - 0.35) / 0.40) * Math.PI) : 0
      const zCenter = zBase + chestFullness

      // Penampang dada lebar dan rata, melengkung halus di pinggir
      const pz = zCenter * Math.max(0, 1.0 - t * t * 0.96)

      positions.push(px, py, pz)
      normals.push(0, 0, 1)

      // UV Panel Depan: lurus dan rata, berpusat di u = 0.25
      const uvX = 0.02 + 0.46 * u
      const uvY = 0.02 + 0.96 * v
      uvs.push(uvX, uvY)
    }
  }

  // Segitiga panel depan
  for (let iy = 0; iy < ny; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      const a = frontOffset + iy * (nx + 1) + ix
      const b = frontOffset + (iy + 1) * (nx + 1) + ix
      const c = frontOffset + (iy + 1) * (nx + 1) + (ix + 1)
      const d = frontOffset + iy * (nx + 1) + (ix + 1)

      indices.push(a, b, d)
      indices.push(b, c, d)
    }
  }

  // --- B. PANEL BELAKANG ---
  const backOffset = positions.length / 3

  for (let iy = 0; iy <= ny; iy++) {
    const v = iy / ny
    const hw = getHalfWidth(v)

    for (let ix = 0; ix <= nx; ix++) {
      const u = ix / nx
      const t = (u - 0.5) * 2
      const absT = Math.abs(t)

      let px: number
      if (v < 0.78) {
        px = t * hw
      } else {
        const neckCutoutRadius = 0.36
        if (absT <= neckCutoutRadius) {
          px = (t / neckCutoutRadius) * 0.125
        } else {
          const f = (absT - neckCutoutRadius) / (1.0 - neckCutoutRadius)
          px = Math.sign(t) * (0.125 + f * (0.375 - 0.125))
        }
      }

      let py: number
      if (v <= 0.78) {
        const hemCurve = v < 0.08 ? (0.015 * (1.0 - t * t) * (1.0 - v / 0.08)) : 0
        py = -0.52 + v * 0.88 - hemCurve
      } else {
        const vTop = (v - 0.78) / 0.22
        const yBase = -0.52 + 0.78 * 0.88

        const neckCutoutRadius = 0.36
        let targetY: number
        if (absT <= neckCutoutRadius) {
          const neckFrac = absT / neckCutoutRadius
          targetY = 0.38 + 0.02 * (neckFrac * neckFrac)
        } else {
          const f = (absT - neckCutoutRadius) / (1.0 - neckCutoutRadius)
          targetY = 0.40 - 0.05 * f
        }

        py = yBase + vTop * (targetY - yBase)
      }

      const zBaseBack = -0.075
      const backFullness = (v >= 0.45 && v <= 0.78) ? -0.008 * Math.sin(((v - 0.45) / 0.33) * Math.PI) : 0
      const zCenterBack = zBaseBack + backFullness

      const pz = zCenterBack * Math.max(0, 1.0 - t * t * 0.96)

      positions.push(px, py, pz)
      normals.push(0, 0, -1)

      // UV Panel Belakang: berpusat di u = 0.75
      const uvX = 0.52 + 0.46 * (1.0 - u)
      const uvY = 0.02 + 0.96 * v
      uvs.push(uvX, uvY)
    }
  }

  // Segitiga panel belakang
  for (let iy = 0; iy < ny; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      const a = backOffset + iy * (nx + 1) + ix
      const b = backOffset + (iy + 1) * (nx + 1) + ix
      const c = backOffset + (iy + 1) * (nx + 1) + (ix + 1)
      const d = backOffset + iy * (nx + 1) + (ix + 1)

      indices.push(a, d, b)
      indices.push(b, d, c)
    }
  }

  // --- C. JAHITAN SAMPING (SIDE SEAMS) ---
  const armpitRow = Math.floor(ny * 0.68)

  // Sisi kiri
  for (let iy = 0; iy < armpitRow; iy++) {
    const fA = frontOffset + iy * (nx + 1) + 0
    const fB = frontOffset + (iy + 1) * (nx + 1) + 0
    const bA = backOffset + iy * (nx + 1) + 0
    const bB = backOffset + (iy + 1) * (nx + 1) + 0

    indices.push(fA, bA, fB)
    indices.push(fB, bA, bB)
  }

  // Sisi kanan
  for (let iy = 0; iy < armpitRow; iy++) {
    const fA = frontOffset + iy * (nx + 1) + nx
    const fB = frontOffset + (iy + 1) * (nx + 1) + nx
    const bA = backOffset + iy * (nx + 1) + nx
    const bB = backOffset + (iy + 1) * (nx + 1) + nx

    indices.push(fA, fB, bA)
    indices.push(fB, bB, bA)
  }

  // --- D. JAHITAN BAHU ATAS (SHOULDER SEAMS) ---
  const neckCutoutCols = Math.floor(nx * 0.36)
  const leftShoulderStart = 0
  const leftShoulderEnd = Math.floor((nx - neckCutoutCols) / 2)
  const rightShoulderStart = Math.ceil((nx + neckCutoutCols) / 2)
  const rightShoulderEnd = nx

  for (let ix = leftShoulderStart; ix < leftShoulderEnd; ix++) {
    const fA = frontOffset + ny * (nx + 1) + ix
    const fB = frontOffset + ny * (nx + 1) + (ix + 1)
    const bA = backOffset + ny * (nx + 1) + ix
    const bB = backOffset + ny * (nx + 1) + (ix + 1)

    indices.push(fA, bA, fB)
    indices.push(fB, bA, bB)
  }

  for (let ix = rightShoulderStart; ix < rightShoulderEnd; ix++) {
    const fA = frontOffset + ny * (nx + 1) + ix
    const fB = frontOffset + ny * (nx + 1) + (ix + 1)
    const bA = backOffset + ny * (nx + 1) + ix
    const bB = backOffset + ny * (nx + 1) + (ix + 1)

    indices.push(fA, bA, fB)
    indices.push(fB, bA, bB)
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()

  return geo
}

// ─────────────────────────────────────────────────────────
// 2. Geometri Lengan Jersey (Menggantung Santai ~45° ke Bawah)
// ─────────────────────────────────────────────────────────

function createSleeveGeometry(isLeft: boolean, isLong = false): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()

  const radialSegs = 24
  const lengthSegs = isLong ? 16 : 8
  const length = isLong ? 0.52 : 0.22 // panjang lengan pendek / panjang natural

  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  const sign = isLeft ? -1 : 1
  // Pangkal lengan di sambungan bahu
  const shoulderBase = new THREE.Vector3(sign * 0.34, 0.26, 0.0)

  // Vektor arah lengan: menggantung rileks ke bawah samping (~48° ke bawah)
  const dir = new THREE.Vector3(sign * 0.68, -0.73, 0.04).normalize()
  const upVec = new THREE.Vector3(0, 1, 0)
  const sideVec = new THREE.Vector3().crossVectors(dir, upVec).normalize()
  const trueUpVec = new THREE.Vector3().crossVectors(sideVec, dir).normalize()

  for (let iL = 0; iL <= lengthSegs; iL++) {
    const frac = iL / lengthSegs
    const ringCenter = shoulderBase.clone().add(dir.clone().multiplyScalar(frac * length))

    // Radius pangkal pas dengan lingkar ketiak/bahu, ujung mengecil halus
    const rY = 0.092 - 0.016 * frac
    const rZ = 0.075 - 0.012 * frac

    for (let iR = 0; iR <= radialSegs; iR++) {
      const u = iR / radialSegs
      const theta = u * Math.PI * 2

      const cosT = Math.cos(theta)
      const sinT = Math.sin(theta)

      const px = ringCenter.x + trueUpVec.x * (rY * cosT) + sideVec.x * (rZ * sinT)
      const py = ringCenter.y + trueUpVec.y * (rY * cosT) + sideVec.y * (rZ * sinT)
      const pz = ringCenter.z + trueUpVec.z * (rY * cosT) + sideVec.z * (rZ * sinT)

      positions.push(px, py, pz)
      normals.push(
        trueUpVec.x * cosT + sideVec.x * sinT,
        trueUpVec.y * cosT + sideVec.y * sinT,
        trueUpVec.z * cosT + sideVec.z * sinT,
      )

      // UV Lengan
      const baseU = isLeft ? 0.02 : 0.78
      const uvX = baseU + 0.18 * u
      const uvY = 0.70 + 0.26 * (1.0 - frac)
      uvs.push(uvX, uvY)
    }
  }

  for (let iL = 0; iL < lengthSegs; iL++) {
    for (let iR = 0; iR < radialSegs; iR++) {
      const a = iL * (radialSegs + 1) + iR
      const b = (iL + 1) * (radialSegs + 1) + iR
      const c = (iL + 1) * (radialSegs + 1) + (iR + 1)
      const d = iL * (radialSegs + 1) + (iR + 1)

      if (isLeft) {
        indices.push(a, b, d)
        indices.push(b, c, d)
      } else {
        indices.push(a, d, b)
        indices.push(b, d, c)
      }
    }
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()

  return geo
}

// ─────────────────────────────────────────────────────────
// 3. Geometri Kerah Leher (Rib Collar Ramping & Presisi)
// ─────────────────────────────────────────────────────────

function createCollarGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()

  const radialSegs = 36
  const tubeSegs = 8
  const ribHeight = 0.016 // lebih ramping dan rapi
  const ribThickness = 0.010

  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  function getNeckPoint(theta: number): THREE.Vector3 {
    const sinT = Math.sin(theta)
    const cosT = Math.cos(theta)

    const px = 0.125 * sinT
    let py: number
    let pz: number

    if (cosT >= 0) {
      pz = 0.080 * cosT
      py = 0.305 + 0.095 * (1.0 - cosT)
    } else {
      pz = 0.065 * cosT
      py = 0.380 + 0.020 * (1.0 + cosT)
    }

    return new THREE.Vector3(px, py, pz)
  }

  for (let iR = 0; iR <= radialSegs; iR++) {
    const theta = (iR / radialSegs) * Math.PI * 2
    const center = getNeckPoint(theta)

    const nextCenter = getNeckPoint(theta + 0.05)
    const tangent = nextCenter.clone().sub(center).normalize()
    const normalOut = new THREE.Vector3(center.x, 0, center.z).normalize()
    const upRib = new THREE.Vector3().crossVectors(tangent, normalOut).normalize()

    for (let iT = 0; iT <= tubeSegs; iT++) {
      const phi = (iT / tubeSegs) * Math.PI * 2
      const offsetOut = normalOut.clone().multiplyScalar(Math.cos(phi) * ribThickness)
      const offsetUp = upRib.clone().multiplyScalar(Math.sin(phi) * ribHeight)

      const pos = center.clone().add(offsetOut).add(offsetUp)
      positions.push(pos.x, pos.y, pos.z)
      normals.push(offsetOut.x, offsetUp.y, offsetOut.z)
      uvs.push(iR / radialSegs, iT / tubeSegs)
    }
  }

  for (let iR = 0; iR < radialSegs; iR++) {
    for (let iT = 0; iT < tubeSegs; iT++) {
      const a = iR * (tubeSegs + 1) + iT
      const b = (iR + 1) * (tubeSegs + 1) + iT
      const c = (iR + 1) * (tubeSegs + 1) + (iT + 1)
      const d = iR * (tubeSegs + 1) + (iT + 1)

      indices.push(a, b, d)
      indices.push(b, c, d)
    }
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()

  return geo
}

// ─────────────────────────────────────────────────────────
// Main Factory Export
// ─────────────────────────────────────────────────────────

export function createPlaceholderJersey(): JerseyMeshes {
  const group = new THREE.Group()
  group.name = 'jersey-placeholder'

  const bodyMat = () =>
    new THREE.MeshPhysicalMaterial({
      color: 0x1b2a41,
      roughness: 0.85,
      metalness: 0.0,
      clearcoat: 0.0,
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
    })

  // 1. Badan Jersey
  const bodyGeo = createBodyGeometry()
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat())
  bodyMesh.name = 'body'
  bodyMesh.castShadow = true
  bodyMesh.receiveShadow = true
  group.add(bodyMesh)

  // 2. Lengan Kiri (Pendek & Panjang)
  const sleeveGeoL = createSleeveGeometry(true, false)
  const sleeveL = new THREE.Mesh(sleeveGeoL, bodyMat())
  sleeveL.name = 'sleeve_l'
  sleeveL.castShadow = true
  sleeveL.receiveShadow = true
  group.add(sleeveL)

  const sleeveGeoLLong = createSleeveGeometry(true, true)
  const sleeveLLong = new THREE.Mesh(sleeveGeoLLong, bodyMat())
  sleeveLLong.name = 'sleeve_l_long'
  sleeveLLong.castShadow = true
  sleeveLLong.receiveShadow = true
  sleeveLLong.visible = false
  group.add(sleeveLLong)

  // 3. Lengan Kanan (Pendek & Panjang)
  const sleeveGeoR = createSleeveGeometry(false, false)
  const sleeveR = new THREE.Mesh(sleeveGeoR, bodyMat())
  sleeveR.name = 'sleeve_r'
  sleeveR.castShadow = true
  sleeveR.receiveShadow = true
  group.add(sleeveR)

  const sleeveGeoRLong = createSleeveGeometry(false, true)
  const sleeveRLong = new THREE.Mesh(sleeveGeoRLong, bodyMat())
  sleeveRLong.name = 'sleeve_r_long'
  sleeveRLong.castShadow = true
  sleeveRLong.receiveShadow = true
  sleeveRLong.visible = false
  group.add(sleeveRLong)

  // 4. Kerah Leher
  const collarGeo = createCollarGeometry()
  const collar = new THREE.Mesh(
    collarGeo,
    new THREE.MeshStandardMaterial({
      color: 0x0d1520,
      roughness: 0.92,
      metalness: 0.0,
      side: THREE.DoubleSide,
    }),
  )
  collar.name = 'collar'
  collar.castShadow = true
  collar.receiveShadow = true
  group.add(collar)

  // Posisikan jersey pas di tengah pandangan kamera
  group.position.y = -0.04
  group.rotation.y = 0.0

  return {
    body: bodyMesh,
    sleeve_l: sleeveL,
    sleeve_r: sleeveR,
    sleeve_l_long: sleeveLLong,
    sleeve_r_long: sleeveRLong,
    collar,
    group,
  }
}

/**
 * Cari mesh berdasarkan nama dari grup/scene yang di-load dari GLB.
 */
export function findJerseyMeshes(
  object: THREE.Object3D,
): Partial<JerseyMeshes> & { group: THREE.Group } {
  const group = new THREE.Group()
  group.add(object)

  const result: Partial<JerseyMeshes> & { group: THREE.Group } = { group }
  const expected: Array<keyof Omit<JerseyMeshes, 'group'>> = [
    'body',
    'sleeve_l',
    'sleeve_r',
    'collar',
  ]

  for (const name of expected) {
    const mesh = object.getObjectByName(name) as THREE.Mesh | undefined
    if (mesh) {
      result[name] = mesh
    }
  }

  return result
}

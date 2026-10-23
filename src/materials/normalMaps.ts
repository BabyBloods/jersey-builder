/**
 * materials/normalMaps.ts — Generator Normal Map Procedural
 * Menghasilkan tekstur normal map dari canvas murni tanpa dependensi eksternal.
 * Sesuai spesifikasi BRIEF:
 * - Milano: matte, tekstur rajut halus merata (rajutan mikro)
 * - Emboss: pola timbul yang jelas (geometric relief dengan kekuatan teratur)
 * - Microcool: pola lubang mikro rapat (perforasi hexagonal + sheen)
 */

import * as THREE from 'three'

export type BahanType = 'milano' | 'emboss' | 'microcool'

const TEX_SIZE = 256

/**
 * Konversi fungsi heightmap 2D f(u, v) menjadi Canvas Normal Map (tangent space).
 * Menggunakan diferensiasi periodik (seamless tiling) agar repeat tidak berpatahan.
 */
function createNormalCanvas(
  heightFn: (u: number, v: number) => number,
  size: number = TEX_SIZE,
  bumpScale: number = 2.0,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const imgData = ctx.createImageData(size, size)
  const data = imgData.data

  // Buat grid heightmap periodik
  const heights = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    const v = y / size
    for (let x = 0; x < size; x++) {
      const u = x / size
      heights[y * size + x] = heightFn(u, v)
    }
  }

  // Hitung gradien Sobel periodik
  for (let y = 0; y < size; y++) {
    const yPrev = (y - 1 + size) % size
    const yNext = (y + 1) % size

    for (let x = 0; x < size; x++) {
      const xPrev = (x - 1 + size) % size
      const xNext = (x + 1) % size

      // Sobel kernel horizontal (dX)
      const tl = heights[yPrev * size + xPrev]
      const l = heights[y * size + xPrev]
      const bl = heights[yNext * size + xPrev]
      const tr = heights[yPrev * size + xNext]
      const r = heights[y * size + xNext]
      const br = heights[yNext * size + xNext]

      const dx = (tr + 2 * r + br) - (tl + 2 * l + bl)

      // Sobel kernel vertikal (dY)
      const t = heights[yPrev * size + x]
      const b = heights[yNext * size + x]
      const dy = (bl + 2 * b + br) - (tl + 2 * t + tr)

      // Vektor normal tangent space: (-dx * bumpScale, -dy * bumpScale, 1)
      let nx = -dx * bumpScale
      let ny = -dy * bumpScale
      let nz = 1.0

      // Normalisasi
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
      nx /= len
      ny /= len
      nz /= len

      // Encode normal [-1, 1] ke RGB [0, 255]
      const idx = (y * size + x) * 4
      data[idx] = Math.round((nx * 0.5 + 0.5) * 255)     // R
      data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255) // G
      data[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255) // B
      data[idx + 3] = 255                               // A
    }
  }

  ctx.putImageData(imgData, 0, 0)
  return canvas
}

/**
 * Heightmap Milano (Foto Referensi 3):
 * Pola rajutan Dri-Fit Chevron / Herringbone zig-zag khas Milano Indonesia.
 * Garis-garis zig-zag horizontal /\/\/\/\ berulang rapat dengan tekstur serat benang.
 */
function milanoHeight(u: number, v: number): number {
  const rows = 32
  const cols = 22
  // Pola chevron segitiga horizontal
  const xPeriod = (u * cols) % 1
  const tri = Math.abs(xPeriod - 0.5) * 2.0 // 0 -> 1 -> 0
  // Geser fase baris berdasarkan segitiga x menghasilkan gelombang zig-zag
  const rowPhase = ((v * rows) + tri * 0.48) % 1
  // Bentuk puncak chevron tajam
  const chevron = Math.abs(rowPhase - 0.5) * 2.0
  // Serat rajutan mikro benang melintang
  const microStitch =
    Math.sin(u * cols * 6 * Math.PI) * 0.10 +
    Math.cos(v * rows * 4 * Math.PI) * 0.06

  return (1.0 - chevron) * 0.85 + microStitch
}

/**
 * Heightmap Emboss (Pola Kain Drifit Emboss Asli):
 * Pola geometris belah ketupat / diamond 3D timbul elegan (heat-pressed athletic pattern).
 * Timbul dengan kilau subtle dan kedalaman yang proporsional (tidak over/kasar).
 */
function embossHeight(u: number, v: number): number {
  const cols = 4
  const rows = 4
  const cu = (u * cols) % 1
  const cv = (v * rows) % 1
  // Jarak manhattan dari tengah menghasilkan piramida belah ketupat (diamond prism)
  const d = Math.abs(cu - 0.5) + Math.abs(cv - 0.5)
  const pyramid = Math.max(0, 1.0 - d * 1.8)
  // Serat rajut mikro di bawah permukaan emboss
  const micro = Math.sin(u * 60 * Math.PI) * Math.cos(v * 60 * Math.PI) * 0.06

  return pyramid * 0.65 + micro
}

/**
 * Heightmap Microcool / Microlite (Foto Referensi 5):
 * Perforasi mikro ventilasi titik jarum (diamond / hexagonal pinholes).
 * Pori-pori sirkulasi udara mikro cekung beraturan dengan rajutan halus di sekelilingnya.
 */
function microcoolHeight(u: number, v: number): number {
  const cols = 28
  const rows = 44
  const row = Math.floor(v * rows)
  const shift = row % 2 === 0 ? 0 : 0.5
  const cu = ((u * cols) + shift) % 1
  const cv = (v * rows) % 1

  // Jarak radial ke pusat pori mikro
  const dx = (cu - 0.5) * 2.0
  const dy = (cv - 0.5) * 2.0
  const dist2 = dx * dx + dy * dy
  const rHole2 = 0.28

  let h = 0.88
  if (dist2 < rHole2) {
    // Cekungan pori-pori titik jarum halus
    const factor = 1.0 - (dist2 / rHole2)
    h -= factor * 0.55
  }
  // Serat mikro horizontal kain athletic
  h += Math.sin(v * rows * 3 * Math.PI) * 0.04
  return h
}

// Cache canvas texture agar hemat alokasi memori
const textureCache = new Map<string, THREE.CanvasTexture>()

/**
 * Buat atau ambil dari cache THREE.CanvasTexture untuk jenis bahan tertentu.
 */
export function getBahanNormalTexture(type: BahanType): THREE.CanvasTexture {
  const cacheKey = `normal_${type}`
  const cached = textureCache.get(cacheKey)
  if (cached) return cached

  let canvas: HTMLCanvasElement

  switch (type) {
    case 'milano':
      canvas = createNormalCanvas(milanoHeight, 512, 1.8)
      break
    case 'emboss':
      canvas = createNormalCanvas(embossHeight, 512, 1.2)
      break
    case 'microcool':
      canvas = createNormalCanvas(microcoolHeight, 512, 1.5)
      break
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.NoColorSpace // Normal map adalah data linear, bukan sRGB
  texture.generateMipmaps = true
  texture.needsUpdate = true

  textureCache.set(cacheKey, texture)
  return texture
}

/**
 * Parameter visual khas tiap bahan
 */
export interface BahanProperties {
  roughness: number
  metalness: number
  normalScale: number
  defaultRepeat: [number, number]
  clearcoat?: number
}

export const BAHAN_SPECS: Record<BahanType, BahanProperties> = {
  milano: {
    // Matte, pola rajut chevron zig-zag halus khas Dri-Fit Milano
    roughness: 0.82,
    metalness: 0.0,
    normalScale: 0.55,
    defaultRepeat: [36, 36],
  },
  emboss: {
    // Motif heat-pressed geometris diamond timbul halus & mewah (tidak over)
    roughness: 0.58,
    metalness: 0.04,
    normalScale: 0.40,
    defaultRepeat: [36, 36],
  },
  microcool: {
    // Pinhole perforasi mikro athletic breathable dengan kilau sporty halus
    roughness: 0.60,
    metalness: 0.05,
    normalScale: 0.45,
    defaultRepeat: [44, 44],
    clearcoat: 0.15,
  },
}


/**
 * engine/background.ts — Pengelola Latar (Background) Custom
 * Sesuai spesifikasi BRIEF bagian 5.3:
 * - Pilihan: warna polos, gradasi 2 warna (atur sudut), gambar upload, dan transparan
 * - Berlaku untuk live preview dan seluruh hasil export
 */

import * as THREE from 'three'

export type LatarTipe = 'polos' | 'gradasi' | 'gambar' | 'transparan'

export interface LatarConfig {
  tipe: LatarTipe
  warna1: string
  warna2: string
  sudut: number // derajat (0 - 360)
  gambar: HTMLImageElement | null
}

export const DEFAULT_LATAR_CONFIG: LatarConfig = {
  tipe: 'gradasi',
  warna1: '#1E2330',
  warna2: '#0D0F12',
  sudut: 90,
  gambar: null,
}

let gradCanvas: HTMLCanvasElement | null = null
let gradTexture: THREE.CanvasTexture | null = null
let imgTexture: THREE.Texture | null = null

/**
 * Terapkan konfigurasi latar ke scene Three.js
 */
export function applyBackground(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  config: LatarConfig,
) {
  if (config.tipe === 'transparan') {
    scene.background = null
    renderer.setClearColor(0x000000, 0)
    return
  }

  if (config.tipe === 'polos') {
    scene.background = new THREE.Color(config.warna1)
    renderer.setClearColor(config.warna1, 1)
    return
  }

  if (config.tipe === 'gradasi') {
    if (!gradCanvas) {
      gradCanvas = document.createElement('canvas')
      gradCanvas.width = 512
      gradCanvas.height = 512
      gradTexture = new THREE.CanvasTexture(gradCanvas)
      gradTexture.colorSpace = THREE.SRGBColorSpace
    }

    const ctx = gradCanvas.getContext('2d')
    if (ctx && gradTexture) {
      const w = 512
      const h = 512
      const rad = (config.sudut * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)

      const cx = w / 2
      const cy = h / 2
      const len = Math.sqrt(w * w + h * h) / 2

      const x0 = cx - cos * len
      const y0 = cy - sin * len
      const x1 = cx + cos * len
      const y1 = cy + sin * len

      const grad = ctx.createLinearGradient(x0, y0, x1, y1)
      grad.addColorStop(0, config.warna1)
      grad.addColorStop(1, config.warna2)

      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      gradTexture.needsUpdate = true
      scene.background = gradTexture
      renderer.setClearColor(0x000000, 1)
    }
    return
  }

  if (config.tipe === 'gambar' && config.gambar) {
    if (!imgTexture) {
      imgTexture = new THREE.Texture(config.gambar)
      imgTexture.colorSpace = THREE.SRGBColorSpace
    } else {
      imgTexture.image = config.gambar
    }
    imgTexture.needsUpdate = true
    scene.background = imgTexture
    renderer.setClearColor(0x000000, 1)
  }
}

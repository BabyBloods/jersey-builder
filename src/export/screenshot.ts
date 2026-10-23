/**
 * export/screenshot.ts — Pengambil Screenshot PNG Beresolusi Tinggi
 * Sesuai spesifikasi BRIEF bagian 5.8:
 * - Screenshot PNG pilihan resolusi: 1024, 2048, atau 3000 px
 * - Latar mengikuti pengaturan scene (polos, gradasi, gambar, atau transparan)
 */

import * as THREE from 'three'
import { triggerDownload } from './zip'

export type ScreenshotResolution = 1024 | 2048 | 3000

/**
 * Tangkap frame 3D beresolusi tinggi tanpa merusak canvas viewport saat ini
 */
export async function captureScreenshot(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  resolution: ScreenshotResolution = 2048,
): Promise<Blob> {
  // Simpan konfigurasi renderer & kamera asli
  const origSize = new THREE.Vector2()
  renderer.getSize(origSize)
  const origPixelRatio = renderer.getPixelRatio()
  const origAspect = camera.aspect

  // Set ukuran render sesuai resolusi yang diminta (rasio 1:1 persegi standar marketplace)
  renderer.setPixelRatio(1)
  renderer.setSize(resolution, resolution, false)
  camera.aspect = 1
  camera.updateProjectionMatrix()

  // Render satu frame offscreen
  renderer.render(scene, camera)

  // Tangkap canvas ke Blob PNG
  const blob = await new Promise<Blob>((resolve, reject) => {
    renderer.domElement.toBlob((b) => {
      if (b) resolve(b)
      else reject(new Error('Gagal menangkap canvas ke Blob PNG'))
    }, 'image/png')
  })

  // Pulihkan ukuran renderer dan rasio kamera asli
  renderer.setPixelRatio(origPixelRatio)
  renderer.setSize(origSize.x, origSize.y, false)
  camera.aspect = origAspect
  camera.updateProjectionMatrix()
  renderer.render(scene, camera)

  return blob
}

/**
 * Tangkap dan download langsung screenshot PNG
 */
export async function downloadScreenshot(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  filename: string,
  resolution: ScreenshotResolution = 2048,
) {
  const blob = await captureScreenshot(renderer, scene, camera, resolution)
  triggerDownload(blob, filename)
}

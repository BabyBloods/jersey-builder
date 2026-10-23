/**
 * export/turntableVideo.ts — Perekam Video 360° Turntable (WebM/MP4)
 * Sesuai spesifikasi BRIEF Bagian 5.9:
 * - Merekam animasi putar 360 derajat produk jersey
 * - Menggunakan Canvas captureStream() dan MediaRecorder API browser murni
 * - Pilihan resolusi:
 *   1. 1080x1080 (Square — Instagram Feed, Marketplace)
 *   2. 1080x1920 (Portrait — TikTok, Reels, Shorts)
 *   3. 1920x1080 (Landscape — YouTube, Presentation)
 *   4. 720x720 (Compact — Preview Cepat)
 * - Durasi kustom (3s, 5s, 8s, 10s) dan FPS (30 atau 60)
 * - Output otomatis terunduh sebagai file video .webm
 */

import * as THREE from 'three'
import { triggerDownload } from './zip'

export type VideoResolutionPreset = '1080x1080' | '1080x1920' | '1920x1080' | '720x720'

export interface TurntableVideoOptions {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  designId: string
  resolusi: VideoResolutionPreset
  durasiDetik?: number // default 5 detik
  fps?: number         // default 30 fps
  onProgress?: (status: string, percent: number) => void
}

const RESOLUTION_MAP: Record<VideoResolutionPreset, { width: number; height: number }> = {
  '1080x1080': { width: 1080, height: 1080 },
  '1080x1920': { width: 1080, height: 1920 },
  '1920x1080': { width: 1920, height: 1080 },
  '720x720':   { width: 720, height: 720 },
}

/**
 * Cek format video yang didukung oleh browser saat ini
 */
function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ]

  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }

  return 'video/webm'
}

/**
 * Rekam animasi 360° turntable jersey dan unduh file video
 */
export async function exportTurntableVideo(
  options: TurntableVideoOptions,
): Promise<Blob> {
  const {
    renderer,
    scene,
    camera,
    designId,
    resolusi,
    durasiDetik = 5,
    fps = 30,
    onProgress,
  } = options

  const targetDim = RESOLUTION_MAP[resolusi] || RESOLUTION_MAP['1080x1080']
  const targetW = targetDim.width
  const targetH = targetDim.height
  const totalFrames = Math.round(durasiDetik * fps)

  onProgress?.('Menyiapkan perekaman video 360°...', 5)

  // 1. Simpan konfigurasi renderer & kamera saat ini agar bisa dipulihkan
  const origSize = new THREE.Vector2()
  renderer.getSize(origSize)
  const origPixelRatio = renderer.getPixelRatio()
  const origAspect = camera.aspect
  const origCamPos = camera.position.clone()
  const origCamRot = camera.rotation.clone()

  const jerseyObj = scene.getObjectByName('jersey-gltf') || scene.getObjectByName('jersey-placeholder') || scene
  const origJerseyRotY = jerseyObj.rotation.y

  // 2. Buat kanvas 2D perantara perekaman untuk menjamin fps dan resolusi stabil
  const recordCanvas = document.createElement('canvas')
  recordCanvas.width = targetW
  recordCanvas.height = targetH
  const recordCtx = recordCanvas.getContext('2d')
  if (!recordCtx) {
    throw new Error('Gagal menginisialisasi 2D context untuk perekaman video')
  }

  // 3. Setup MediaRecorder
  const mimeType = getSupportedMimeType()
  const stream = recordCanvas.captureStream(fps)
  const chunks: Blob[] = []

  let mediaRecorder: MediaRecorder
  try {
    mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8000000, // 8 Mbps untuk kualitas tinggi
    })
  } catch (err) {
    console.warn('[Nemesis3D] Fallback ke MediaRecorder default tanpa opsi bitrate:', err)
    mediaRecorder = new MediaRecorder(stream)
  }

  const recordingPromise = new Promise<Blob>((resolve, reject) => {
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType.split(';')[0] })
      resolve(blob)
    }

    mediaRecorder.onerror = (e) => {
      reject(new Error(`Perekaman video gagal: ${e.error?.message || 'Error tak dikenal'}`))
    }
  })

  // 4. Sesuaikan renderer Three.js ke resolusi video
  renderer.setPixelRatio(1)
  renderer.setSize(targetW, targetH, false)
  camera.aspect = targetW / targetH
  camera.updateProjectionMatrix()

  // Pastikan posisi kamera pas untuk tampilan 360
  camera.position.set(0, 0.05, 1.85)
  camera.lookAt(0, -0.06, 0)

  // Mulai perekaman
  mediaRecorder.start()

  const frameIntervalMs = 1000 / fps

  try {
    // 5. Render frame demi frame putaran 360 derajat penuh
    for (let f = 0; f < totalFrames; f++) {
      const progressRatio = f / totalFrames
      // Rotasi 360 derajat (2 * PI)
      const currentAngle = progressRatio * Math.PI * 2
      jerseyObj.rotation.y = currentAngle

      // Render scene
      renderer.render(scene, camera)

      // Salin frame webgl ke record canvas
      recordCtx.clearRect(0, 0, targetW, targetH)
      recordCtx.drawImage(renderer.domElement, 0, 0, targetW, targetH)

      const percent = 10 + Math.round(progressRatio * 80)
      onProgress?.(
        `Merender frame video 360°: ${f + 1}/${totalFrames} (${Math.round(progressRatio * 100)}%)`,
        percent,
      )

      // Delay teratur agar stream mendapatkan frame secara konsisten
      await new Promise((resolve) => setTimeout(resolve, Math.max(10, frameIntervalMs * 0.8)))
    }

    onProgress?.('Menyelesaikan encoding video...', 95)
    mediaRecorder.stop()

    const videoBlob = await recordingPromise

    // Otomatis unduh file video
    const extension = mimeType.includes('mp4') ? 'mp4' : 'webm'
    const fileName = `${designId || 'jersey'}_360_${resolusi}.${extension}`
    triggerDownload(videoBlob, fileName)

    onProgress?.('Video 360° siap!', 100)
    return videoBlob
  } finally {
    // 6. Pulihkan konfigurasi renderer, kamera, dan rotasi model semula
    jerseyObj.rotation.y = origJerseyRotY
    renderer.setPixelRatio(origPixelRatio)
    renderer.setSize(origSize.x, origSize.y, false)
    camera.aspect = origAspect
    camera.position.copy(origCamPos)
    camera.rotation.copy(origCamRot)
    camera.updateProjectionMatrix()
    renderer.render(scene, camera)
  }
}

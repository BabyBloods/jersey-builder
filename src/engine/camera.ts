/**
 * engine/camera.ts — Setup kamera dan OrbitControls
 * Mendukung preset kamera (Depan, Belakang, Samping, Detail Bahan)
 * dengan transisi halus menggunakan lerp.
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export type CameraPreset = 'depan' | 'belakang' | 'samping-kiri' | 'samping-kanan' | 'detail-bahan'

// Definisi posisi dan target tiap preset kamera
export const PRESET_CONFIG: Record<CameraPreset, { position: THREE.Vector3; target: THREE.Vector3 }> = {
  depan: {
    position: new THREE.Vector3(0, 0.03, 1.5),
    target: new THREE.Vector3(0, -0.04, 0),
  },
  belakang: {
    position: new THREE.Vector3(0, 0.03, -1.5),
    target: new THREE.Vector3(0, -0.04, 0),
  },
  'samping-kiri': {
    position: new THREE.Vector3(-1.5, 0.03, 0),
    target: new THREE.Vector3(0, -0.04, 0),
  },
  'samping-kanan': {
    position: new THREE.Vector3(1.5, 0.03, 0),
    target: new THREE.Vector3(0, -0.04, 0),
  },
  'detail-bahan': {
    position: new THREE.Vector3(0.05, 0.08, 0.42),
    target: new THREE.Vector3(0.02, 0.02, 0),
  },
}

export interface CameraContext {
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  /** Pindah ke preset kamera dengan transisi halus */
  goToPreset: (preset: CameraPreset, reduced?: boolean) => void
  /** Aktifkan atau nonaktifkan putaran 360° otomatis (Turntable) */
  setTurntable: (active: boolean, speed?: number) => void
  /** Cek apakah mode turntable sedang aktif */
  isTurntableActive: () => boolean
  /** Perlu dipanggil di render loop agar transisi kamera berjalan */
  update: () => void
  dispose: () => void
}

export function initCamera(canvas: HTMLCanvasElement, _scene?: THREE.Scene): CameraContext {
  const w = canvas.clientWidth
  const h = canvas.clientHeight

  const camera = new THREE.PerspectiveCamera(40, w / h, 0.01, 100)
  camera.position.copy(PRESET_CONFIG.depan.position)
  camera.lookAt(PRESET_CONFIG.depan.target)

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 0.5
  controls.maxDistance = 6
  controls.maxPolarAngle = Math.PI * 0.85
  controls.target.copy(PRESET_CONFIG.depan.target)
  controls.autoRotate = false
  controls.autoRotateSpeed = 3.2
  controls.update()

  // State transisi kamera
  let targetPos: THREE.Vector3 | null = null
  let targetLook: THREE.Vector3 | null = null
  let animating = false

  function goToPreset(preset: CameraPreset, reduced = false) {
    // Matikan turntable saat berpindah ke preset
    controls.autoRotate = false
    const cfg = PRESET_CONFIG[preset]
    if (reduced) {
      // prefers-reduced-motion: pindah langsung tanpa animasi
      camera.position.copy(cfg.position)
      controls.target.copy(cfg.target)
      controls.update()
    } else {
      targetPos = cfg.position.clone()
      targetLook = cfg.target.clone()
      animating = true
    }
  }

  function setTurntable(active: boolean, speed = 3.2) {
    controls.autoRotate = active
    controls.autoRotateSpeed = speed
  }

  function isTurntableActive() {
    return controls.autoRotate
  }

  function update() {
    if (animating && targetPos && targetLook) {
      camera.position.lerp(targetPos, 0.08)
      controls.target.lerp(targetLook, 0.08)

      // Hentikan animasi saat sudah cukup dekat
      if (camera.position.distanceTo(targetPos) < 0.001) {
        camera.position.copy(targetPos)
        controls.target.copy(targetLook)
        animating = false
        targetPos = null
        targetLook = null
      }
    }
    controls.update()
  }

  function dispose() {
    controls.dispose()
  }

  return { camera, controls, goToPreset, setTurntable, isTurntableActive, update, dispose }
}

/** Update aspect ratio kamera saat canvas di-resize */
export function updateCameraAspect(camera: THREE.PerspectiveCamera, w: number, h: number) {
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}

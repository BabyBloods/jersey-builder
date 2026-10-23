/**
 * engine/scene.ts — Inisialisasi scene Three.js
 * Bertanggung jawab atas: renderer, scene, resize handler, dan fungsi render.
 * Engine ini sengaja dipisah dari React agar bisa dipakai headless di mode batch.
 */

import * as THREE from 'three'

export interface SceneContext {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  canvas: HTMLCanvasElement
  dispose: () => void
}

/**
 * Inisialisasi renderer dan scene ke canvas yang diberikan.
 * Caller bertanggung jawab memanggil dispose() saat unmount.
 */
export function initScene(canvas: HTMLCanvasElement): SceneContext {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2

  const scene = new THREE.Scene()
  // Latar scene dikontrol via latar custom pengguna, bukan warna scene
  scene.background = new THREE.Color(0x0d0f12)

  // Handler resize agar canvas tidak blur
  function handleResize() {
    const { clientWidth: w, clientHeight: h } = canvas
    renderer.setSize(w, h)
  }

  const resizeObserver = new ResizeObserver(handleResize)
  resizeObserver.observe(canvas.parentElement ?? canvas)

  function dispose() {
    resizeObserver.disconnect()
    renderer.dispose()
  }

  return { renderer, scene, canvas, dispose }
}

/**
 * Update ukuran renderer dan kamera agar sesuai ukuran canvas saat ini.
 */
export function syncRendererSize(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement,
) {
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  if (renderer.domElement.width !== w || renderer.domElement.height !== h) {
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
}

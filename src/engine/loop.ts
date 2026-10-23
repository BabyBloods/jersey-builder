/**
 * engine/loop.ts — Render loop utama (requestAnimationFrame)
 * Terpisah dari React agar bisa dipakai di mode batch/headless tanpa UI.
 * Mendukung pause/resume dan cleanup.
 */

import * as THREE from 'three'
import type { CameraContext } from './camera'
import { syncRendererSize } from './scene'

export interface RenderLoop {
  /** Mulai render loop */
  start: () => void
  /** Hentikan render loop */
  stop: () => void
  /** Apakah loop sedang berjalan */
  isRunning: () => boolean
  /** Render satu frame saja (untuk export/batch) */
  renderOnce: () => void
}

export function createRenderLoop(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  cameraCtx: CameraContext,
  canvas: HTMLCanvasElement,
): RenderLoop {
  let rafId: number | null = null
  let running = false

  function tick() {
    if (!running) return

    // Sync ukuran renderer dengan ukuran canvas aktual
    syncRendererSize(renderer, cameraCtx.camera, canvas)

    // Update kamera (termasuk transisi preset & OrbitControls damping)
    cameraCtx.update()

    // Render scene
    renderer.render(scene, cameraCtx.camera)

    rafId = requestAnimationFrame(tick)
  }

  function start() {
    if (running) return
    running = true
    rafId = requestAnimationFrame(tick)
  }

  function stop() {
    running = false
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function isRunning() {
    return running
  }

  function renderOnce() {
    syncRendererSize(renderer, cameraCtx.camera, canvas)
    cameraCtx.update()
    renderer.render(scene, cameraCtx.camera)
  }

  return { start, stop, isRunning, renderOnce }
}

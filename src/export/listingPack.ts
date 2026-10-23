/**
 * export/listingPack.ts — Pengemas Paket Listing Marketplace (ZIP)
 * Sesuai spesifikasi BRIEF bagian 5.8:
 * - Menghasilkan 5 gambar standar dengan penamaan baku:
 *   1. {id}_depan.png
 *   2. {id}_belakang.png
 *   3. {id}_depan-belakang.png (dua sisi berdampingan 2-up)
 *   4. {id}_detail-{bahan}.png (zoom ke kain)
 *   5. {id}_texture.png (texture polos hasil motif)
 * - Dikemas otomatis ke dalam file .zip untuk upload ke Shopee/TikTok/Lazada
 */

import * as THREE from 'three'
import { PRESET_CONFIG } from '../engine/camera'
import { captureScreenshot } from './screenshot'
import { createZipBlob, triggerDownload, type ZipEntry } from './zip'

export interface ListingPackOptions {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  designId: string
  bahan: string
  diffuseCanvas: HTMLCanvasElement
  onProgress?: (stepDesc: string, percent: number) => void
}

/**
 * Konversi Blob ke Uint8Array untuk dikemas ke ZIP
 */
async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const buf = await blob.arrayBuffer()
  return new Uint8Array(buf)
}

/**
 * Buat gambar 2-sisi berdampingan (depan & belakang)
 */
async function createSideBySideBlob(
  depanBlob: Blob,
  belakangBlob: Blob,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 4096
  canvas.height = 2048
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Gagal membuat 2D context untuk gambar depan-belakang')

  const imgDepan = await createImageBitmap(depanBlob)
  const imgBelakang = await createImageBitmap(belakangBlob)

  // Sisi kiri: Depan
  ctx.drawImage(imgDepan, 0, 0, 2048, 2048)
  // Sisi kanan: Belakang
  ctx.drawImage(imgBelakang, 2048, 0, 2048, 2048)

  // Garis pemisah subtle di tengah
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(2048, 0)
  ctx.lineTo(2048, 2048)
  ctx.stroke()

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b)
      else reject(new Error('Gagal export depan-belakang blob'))
    }, 'image/png')
  })
}

/**
 * Eksekusi render 5 gambar listing dan kemas ke file .zip
 */
export async function exportListingPack({
  renderer,
  scene,
  camera,
  designId,
  bahan,
  diffuseCanvas,
  onProgress = () => {},
}: ListingPackOptions) {
  const cleanId = designId.trim() || 'nemesis-jersey'
  const entries: ZipEntry[] = []

  // Simpan posisi & rotasi kamera awal
  const origPos = camera.position.clone()

  try {
    // 1. Gambar Depan
    onProgress('Merender tampak depan...', 15)
    camera.position.copy(PRESET_CONFIG.depan.position)
    camera.lookAt(PRESET_CONFIG.depan.target)
    const depanBlob = await captureScreenshot(renderer, scene, camera, 2048)
    entries.push({
      name: `${cleanId}_depan.png`,
      data: await blobToUint8Array(depanBlob),
    })

    // 2. Gambar Belakang
    onProgress('Merender tampak belakang...', 35)
    camera.position.copy(PRESET_CONFIG.belakang.position)
    camera.lookAt(PRESET_CONFIG.belakang.target)
    const belakangBlob = await captureScreenshot(renderer, scene, camera, 2048)
    entries.push({
      name: `${cleanId}_belakang.png`,
      data: await blobToUint8Array(belakangBlob),
    })

    // 3. Gambar Depan-Belakang Berdampingan
    onProgress('Menggabungkan tampak depan & belakang...', 55)
    const sideBySideBlob = await createSideBySideBlob(depanBlob, belakangBlob)
    entries.push({
      name: `${cleanId}_depan-belakang.png`,
      data: await blobToUint8Array(sideBySideBlob),
    })

    // 4. Gambar Detail Bahan
    onProgress('Merender detail tekstur kain...', 75)
    camera.position.copy(PRESET_CONFIG['detail-bahan'].position)
    camera.lookAt(PRESET_CONFIG['detail-bahan'].target)
    const detailBlob = await captureScreenshot(renderer, scene, camera, 2048)
    entries.push({
      name: `${cleanId}_detail-${bahan}.png`,
      data: await blobToUint8Array(detailBlob),
    })

    // 5. Gambar Tekstur Polos Hasil Motif (Canvas Diffuse)
    onProgress('Mengekspor tekstur pola UV...', 90)
    const textureBlob = await new Promise<Blob>((resolve, reject) => {
      diffuseCanvas.toBlob((b) => {
        if (b) resolve(b)
        else reject(new Error('Gagal mengekspor kanvas tekstur'))
      }, 'image/png')
    })
    entries.push({
      name: `${cleanId}_texture.png`,
      data: await blobToUint8Array(textureBlob),
    })

    // 6. Kemas seluruh file ke ZIP
    onProgress('Mengompres file ke ZIP...', 95)
    const zipBlob = createZipBlob(entries)
    triggerDownload(zipBlob, `${cleanId}_listing_pack.zip`)

    onProgress('Selesai!', 100)
  } finally {
    // Pulihkan posisi kamera awal
    camera.position.copy(origPos)
    camera.lookAt(PRESET_CONFIG.depan.target)
    renderer.render(scene, camera)
  }
}

/**
 * batch/batchProcessor.ts — Pemroses & Pengekspor Desain Massal (Batch Processing)
 * Sesuai spesifikasi BRIEF Bagian 6 & 7:
 * - Memproses banyak desain jersey sekaligus (dari file JSON atau variasi template preset)
 * - Merender paket gambar lengkap untuk setiap desain:
 *   1. {id}_depan.png
 *   2. {id}_belakang.png
 *   3. {id}_depan-belakang.png (2-up)
 *   4. {id}_detail-{bahan}.png
 *   5. {id}_texture.png
 *   6. {id}_desain.json
 * - Mengemas semua folder desain ke dalam satu file Master ZIP
 * - Mendukung pelaporan progress real-time dan pembatalan
 */

import * as THREE from 'three'
import { PRESET_CONFIG } from '../engine/camera'
import { captureScreenshot } from '../export/screenshot'
import { createZipBlob, triggerDownload, type ZipEntry } from '../export/zip'
import type { JerseyMaterialManager } from '../materials/jerseyMaterial'
import { TEMPLATE_PRESETS } from '../ui/TemplateGallery'
import { TextureCompositor } from '../texture/textureCompositor'
import type { JerseyDesignSchema } from '../state/schema'

export interface BatchItemProgress {
  currentIndex: number
  totalItems: number
  currentDesignName: string
  stepDescription: string
  percent: number
}

export interface BatchProcessorOptions {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  materialManager: JerseyMaterialManager
  designs: JerseyDesignSchema[]
  onProgress?: (progress: BatchItemProgress) => void
  isCancelled?: () => boolean
}

/**
 * Buat gambar gabungan 2 sisi berdampingan (Depan & Belakang)
 */
async function createSideBySideComposite(
  depanBlob: Blob,
  belakangBlob: Blob,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 4096
  canvas.height = 2048
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Gagal membuat 2D context untuk gambar 2-sisi')

  const imgDepan = await createImageBitmap(depanBlob)
  const imgBelakang = await createImageBitmap(belakangBlob)

  // Sisi kiri: Depan
  ctx.drawImage(imgDepan, 0, 0, 2048, 2048)
  // Sisi kanan: Belakang
  ctx.drawImage(imgBelakang, 2048, 0, 2048, 2048)

  // Garis pemisah
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(2048, 0)
  ctx.lineTo(2048, 2048)
  ctx.stroke()

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Gagal export kanvas 2-sisi'))
    }, 'image/png')
  })
}

/**
 * Konversi Blob ke Uint8Array
 */
async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  const buf = await blob.arrayBuffer()
  return new Uint8Array(buf)
}

/**
 * Jalankan proses batch untuk seluruh daftar desain
 */
export async function runBatchProcessing(
  options: BatchProcessorOptions,
): Promise<{ zipBlob: Blob; totalFiles: number }> {
  const {
    renderer,
    scene,
    camera,
    materialManager,
    designs,
    onProgress,
    isCancelled,
  } = options

  if (!designs || designs.length === 0) {
    throw new Error('Tidak ada desain yang dipilih untuk diproses secara massal.')
  }

  const allZipEntries: ZipEntry[] = []
  const totalItems = designs.length
  const textEncoder = new TextEncoder()

  // Simpan posisi awal kamera
  const initialCamPos = camera.position.clone()
  const initialCamTarget = new THREE.Vector3(0, -0.06, 0)

  // Ringkasan manifest
  const manifestItems: Array<{
    id: string
    nama: string
    template: string
    bahan: string
    warna: string
    fileCount: number
  }> = []

  try {
    for (let i = 0; i < designs.length; i++) {
      if (isCancelled?.()) {
        throw new Error('Proses batch dibatalkan oleh pengguna.')
      }

      const design = designs[i]
      const folderPrefix = `${design.id}/`

      const updateProgress = (stepDesc: string, stepPercent: number) => {
        const overallPercent = Math.round(
          ((i + stepPercent / 100) / totalItems) * 100,
        )
        onProgress?.({
          currentIndex: i + 1,
          totalItems,
          currentDesignName: design.nama_desain || design.id,
          stepDescription: stepDesc,
          percent: overallPercent,
        })
      }

      updateProgress(`Menyiapkan tekstur (${design.nama_desain})...`, 5)

      // 1. Buat kompositor tekstur untuk desain ini
      const compositor = new TextureCompositor({
        mode: design.mode_tekstur || 'template',
        warnaDasar: design.warna_dasar,
        layers: design.layers || [],
        importedImage: null,
        imageTransform: design.transform_gambar || {
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
          mirror: false,
        },
        logo: design.logo
          ? {
              image: null,
              posisi: design.logo.posisi,
              ukuran: design.logo.ukuran,
              offset: design.logo.offset,
            }
          : null,
        showUvGuide: false,
        resolution: 2048,
      })

      // Update material 3D
      materialManager.updateOptions({
        bahan: design.bahan,
        diffuseMap: compositor.getTexture(),
        kerahVisible: design.kerah ?? true,
        embossStrength: 1.2,
        textureScale: 1.0,
      })

      // Tunggu Three.js mengunggah tekstur ke GPU
      await new Promise((r) => setTimeout(r, 80))

      // 2. Render Tampak Depan
      updateProgress('Merender tampak depan...', 20)
      camera.position.copy(PRESET_CONFIG.depan.position)
      camera.lookAt(PRESET_CONFIG.depan.target)
      const depanBlob = await captureScreenshot(renderer, scene, camera, 2048)
      allZipEntries.push({
        name: `${folderPrefix}${design.id}_depan.png`,
        data: await blobToBytes(depanBlob),
      })

      // 3. Render Tampak Belakang
      updateProgress('Merender tampak belakang...', 40)
      camera.position.copy(PRESET_CONFIG.belakang.position)
      camera.lookAt(PRESET_CONFIG.belakang.target)
      const belakangBlob = await captureScreenshot(renderer, scene, camera, 2048)
      allZipEntries.push({
        name: `${folderPrefix}${design.id}_belakang.png`,
        data: await blobToBytes(belakangBlob),
      })

      // 4. Render Tampak 2-Sisi Berdampingan (Depan & Belakang)
      updateProgress('Menyusun gambar 2-sisi...', 60)
      const sideBySideBlob = await createSideBySideComposite(depanBlob, belakangBlob)
      allZipEntries.push({
        name: `${folderPrefix}${design.id}_depan-belakang.png`,
        data: await blobToBytes(sideBySideBlob),
      })

      // 5. Render Detail Zoom Bahan
      updateProgress('Merender detail bahan...', 75)
      camera.position.copy(PRESET_CONFIG['detail-bahan'].position)
      camera.lookAt(PRESET_CONFIG['detail-bahan'].target)
      const detailBlob = await captureScreenshot(renderer, scene, camera, 2048)
      allZipEntries.push({
        name: `${folderPrefix}${design.id}_detail-${design.bahan}.png`,
        data: await blobToBytes(detailBlob),
      })

      // 6. Simpan File Tekstur Diffuse Polos
      updateProgress('Menyimpan file tekstur motif...', 90)
      const textureBlob = await new Promise<Blob>((resolve, reject) => {
        compositor.getCanvas().toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Gagal mengekspor kanvas tekstur'))
        }, 'image/png')
      })
      allZipEntries.push({
        name: `${folderPrefix}${design.id}_texture.png`,
        data: await blobToBytes(textureBlob),
      })

      // 7. Simpan file spesifikasi JSON desain
      const jsonContent = JSON.stringify(design, null, 2)
      allZipEntries.push({
        name: `${folderPrefix}${design.id}_desain.json`,
        data: textEncoder.encode(jsonContent),
      })

      manifestItems.push({
        id: design.id,
        nama: design.nama_desain,
        template: design.template_id,
        bahan: design.bahan,
        warna: design.warna_dasar,
        fileCount: 6,
      })

      // Bersihkan instance compositor per item
      compositor.dispose()
    }

    // 8. Buat file MANIFEST ringkasan batch
    const nowIso = new Date().toISOString()
    const manifestText = [
      '====================================================',
      '        NEMESIS 3D — LAPORAN BATCH EXPORT           ',
      '====================================================',
      `Tanggal Export : ${nowIso}`,
      `Total Desain   : ${designs.length}`,
      `Total File     : ${allZipEntries.length}`,
      '',
      'DAFTAR DESAIN YANG DIEKSPOR:',
      '----------------------------------------------------',
      ...manifestItems.map(
        (m, idx) =>
          `[${idx + 1}] ID: ${m.id}\n    Nama: ${m.nama}\n    Template: ${m.template} | Bahan: ${m.bahan} | Warna: ${m.warna}\n    Files: 6 file aset marketplace`,
      ),
      '',
      '====================================================',
      'Siap diunggah langsung ke etalase Shopee, TikTok Shop, & Tokopedia.',
    ].join('\n')

    allZipEntries.push({
      name: 'BATCH_MANIFEST.txt',
      data: textEncoder.encode(manifestText),
    })

    onProgress?.({
      currentIndex: totalItems,
      totalItems,
      currentDesignName: 'Selesai',
      stepDescription: 'Mengompresi ke file Master ZIP...',
      percent: 98,
    })

    // Buat file ZIP tunggal
    const masterZipBlob = createZipBlob(allZipEntries)

    // Trigger download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const zipFilename = `Nemesis3D_Batch_Export_${timestamp}.zip`
    triggerDownload(masterZipBlob, zipFilename)

    onProgress?.({
      currentIndex: totalItems,
      totalItems,
      currentDesignName: 'Selesai',
      stepDescription: 'Download berhasil dimulai!',
      percent: 100,
    })

    return {
      zipBlob: masterZipBlob,
      totalFiles: allZipEntries.length,
    }
  } finally {
    // Kembalikan posisi kamera
    camera.position.copy(initialCamPos)
    camera.lookAt(initialCamTarget)
    renderer.render(scene, camera)
  }
}

/**
 * Helper untuk membuat daftar desain dari seluruh Template Presets
 */
export function createDesignsFromTemplates(): JerseyDesignSchema[] {
  return TEMPLATE_PRESETS.map((tmpl) => ({
    id: `batch_${tmpl.id}_${Date.now()}`,
    template_id: tmpl.id,
    nama_desain: tmpl.nama,
    bahan: 'milano',
    kerah: true,
    warna_dasar: tmpl.warna_dasar,
    layers: tmpl.layers,
    mode_tekstur: 'template',
    gambar_import: null,
    transform_gambar: { scale: 1, offsetX: 0, offsetY: 0, rotation: 0, mirror: false },
    logo: null,
    latar: {
      tipe: 'gradasi',
      warna1: '#0F172A',
      warna2: '#1E293B',
      sudut: 135,
    },
  }))
}

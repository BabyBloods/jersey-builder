/**
 * state/schema.ts — Skema Desain JSON & Validasi Nemesis 3D
 * Sesuai spesifikasi BRIEF Bagian 7.
 * Satu desain = satu objek JSON yang kompatibel antara mode manual, batch, dan link bagikan.
 */

import type { LatarConfig } from '../engine/background'
import type { BahanType } from '../materials/normalMaps'
import type { LayerParams } from '../patterns/generators'
import type { LogoPosisi } from '../texture/logoLayer'
import type { ImageTransform, TextureMode } from '../texture/textureCompositor'

export interface VideoConfig {
  aktif: boolean
  durasi: number // detik
  fps: number
  resolusi: '1080x1080' | '1080x1920' | '1920x1080' | '720x720'
  angin: number // 0 - 1.0 (kekuatan gerak kain)
}

export interface JerseyDesignSchema {
  id: string
  template_id: string
  nama_desain: string
  bahan: BahanType
  kerah: boolean
  tipe_kerah?: 'ribbon' | 'vneck'
  lengan_panjang?: boolean
  warna_dasar: string
  layers: LayerParams[]
  mode_tekstur?: TextureMode
  gambar_import: string | null // data URL base64 atau path file
  transform_gambar?: ImageTransform
  logo: {
    dataUrl?: string | null
    file?: string | null
    posisi: LogoPosisi
    ukuran: number
    offset: [number, number]
  } | null
  latar: {
    tipe: 'polos' | 'gradasi' | 'gambar' | 'transparan'
    warna1: string
    warna2: string
    sudut: number
    gambarDataUrl?: string | null
  }
  video?: VideoConfig
  output?: {
    resolusi: number
  }
}

export const DEFAULT_DESIGN: JerseyDesignSchema = {
  id: '2026-10-23_stardust-meteor',
  template_id: 'stardust-vneck-01',
  nama_desain: 'Stardust Meteor',
  bahan: 'milano',
  kerah: true,
  tipe_kerah: 'vneck',
  lengan_panjang: false,
  warna_dasar: '#141C2B',
  layers: [
    {
      id: 'layer-1',
      motif: 'meteor-shower',
      warna: '#FFFFFF',
      seed: 101,
      kerapatan: 1.15,
      sudut: 0,
      skala: 1.0,
      opacity: 0.95,
    },
  ],
  mode_tekstur: 'template',
  gambar_import: null,
  transform_gambar: { scale: 1.0, offsetX: 0, offsetY: 0, rotation: 0, mirror: false },
  logo: null,
  latar: {
    tipe: 'gradasi',
    warna1: '#1F2937',
    warna2: '#0F172A',
    sudut: 135,
  },
  video: {
    aktif: true,
    durasi: 6,
    fps: 30,
    resolusi: '1080x1080',
    angin: 0,
  },
  output: {
    resolusi: 2048,
  },
}

/**
 * Validasi objek JSON mentah terhadap skema desain Jersey Nemesis
 */
export function validateDesignJson(raw: unknown): {
  valid: boolean
  data?: JerseyDesignSchema
  error?: string
} {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'Data JSON harus berupa objek valid.' }
  }

  const obj = raw as Record<string, unknown>

  // Cek field penting
  if (typeof obj.warna_dasar !== 'string' || !obj.warna_dasar.startsWith('#')) {
    return { valid: false, error: 'Format warna_dasar tidak valid (harus hex #RRGGBB).' }
  }

  const validBahan = ['milano', 'emboss', 'microcool']
  if (obj.bahan && !validBahan.includes(String(obj.bahan))) {
    return { valid: false, error: `Bahan tidak dikenal: ${obj.bahan}` }
  }

  // Sanitasi & berikan nilai default jika ada field opsional yang kosong
  const sanitized: JerseyDesignSchema = {
    id: typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : `design-${Date.now()}`,
    template_id: typeof obj.template_id === 'string' ? obj.template_id : 'custom',
    nama_desain: typeof obj.nama_desain === 'string' ? obj.nama_desain : 'Desain Tanpa Judul',
    bahan: (obj.bahan as BahanType) || 'milano',
    kerah: typeof obj.kerah === 'boolean' ? obj.kerah : true,
    tipe_kerah: obj.tipe_kerah === 'vneck' ? 'vneck' : 'ribbon',
    lengan_panjang: typeof obj.lengan_panjang === 'boolean' ? obj.lengan_panjang : false,
    warna_dasar: obj.warna_dasar,
    layers: Array.isArray(obj.layers)
      ? (obj.layers as LayerParams[]).map((l, i) => ({
          id: l.id || `layer-${i + 1}`,
          motif: l.motif || 'contour-peak',
          warna: l.warna || '#FFFFFF',
          seed: typeof l.seed === 'number' ? l.seed : 42,
          kerapatan: typeof l.kerapatan === 'number' ? l.kerapatan : 1.0,
          sudut: typeof l.sudut === 'number' ? l.sudut : 0,
          skala: typeof l.skala === 'number' ? l.skala : 1.0,
          opacity: typeof l.opacity === 'number' ? l.opacity : 1.0,
        }))
      : [],
    mode_tekstur: obj.mode_tekstur === 'import' ? 'import' : 'template',
    gambar_import: typeof obj.gambar_import === 'string' ? obj.gambar_import : null,
    transform_gambar: (obj.transform_gambar as ImageTransform) || {
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      mirror: false,
    },
    logo: obj.logo && typeof obj.logo === 'object'
      ? {
          dataUrl: (obj.logo as Record<string, unknown>).dataUrl as string | undefined,
          file: (obj.logo as Record<string, unknown>).file as string | undefined,
          posisi: ((obj.logo as Record<string, unknown>).posisi as LogoPosisi) || 'dada-kiri',
          ukuran: typeof (obj.logo as Record<string, unknown>).ukuran === 'number'
            ? ((obj.logo as Record<string, unknown>).ukuran as number)
            : 0.15,
          offset: Array.isArray((obj.logo as Record<string, unknown>).offset)
            ? ((obj.logo as Record<string, unknown>).offset as [number, number])
            : [0, 0],
        }
      : null,
    latar: obj.latar && typeof obj.latar === 'object'
      ? {
          tipe: ((obj.latar as Record<string, unknown>).tipe as LatarConfig['tipe']) || 'gradasi',
          warna1: typeof (obj.latar as Record<string, unknown>).warna1 === 'string'
            ? ((obj.latar as Record<string, unknown>).warna1 as string)
            : '#1E2330',
          warna2: typeof (obj.latar as Record<string, unknown>).warna2 === 'string'
            ? ((obj.latar as Record<string, unknown>).warna2 as string)
            : '#0D0F12',
          sudut: typeof (obj.latar as Record<string, unknown>).sudut === 'number'
            ? ((obj.latar as Record<string, unknown>).sudut as number)
            : 90,
          gambarDataUrl: (obj.latar as Record<string, unknown>).gambarDataUrl as string | undefined,
        }
      : DEFAULT_DESIGN.latar,
    video: (obj.video as VideoConfig) || DEFAULT_DESIGN.video,
    output: (obj.output as { resolusi: number }) || DEFAULT_DESIGN.output,
  }

  return { valid: true, data: sanitized }
}

/**
 * Muat URL gambar ke elemen HTMLImageElement
 */
export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (err) => reject(err)
    img.src = url
  })
}

/**
 * Konversi HTMLImageElement atau canvas ke data URL base64
 */
export function imageToDataUrl(img: HTMLImageElement | HTMLCanvasElement): string {
  try {
    if (img instanceof HTMLCanvasElement) {
      return img.toDataURL('image/png')
    }
    const canvas = document.createElement('canvas')
    const w = img.naturalWidth || img.width
    const h = img.naturalHeight || img.height
    if (!w || !h) return ''
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    ctx.drawImage(img, 0, 0)
    return canvas.toDataURL('image/png')
  } catch (err) {
    console.warn('[imageToDataUrl] Gagal konversi gambar ke data URL:', err)
    return ''
  }
}

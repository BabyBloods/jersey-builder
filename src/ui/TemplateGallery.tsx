/**
 * ui/TemplateGallery.tsx — Galeri Template Jersey untuk Langkah 1 Stepper
 *
 * Menampilkan grid template preset yang bisa dipilih pengguna sebelum masuk
 * ke tahap kustomisasi. Setiap template memiliki preview canvas mini + metadata.
 *
 * Fitur:
 * - Grid 3 kolom dengan preview kanvas procedural (150×200px per kartu)
 * - Filter berdasarkan kategori (Semua, Sport, Premium, Nasional)
 * - Tombol "Gunakan Template" → terapkan ke state desain
 * - Tombol "Variasi Warna" → generate 5 variasi palet harmonis
 * - Badge "BARU" pada template tertentu
 * - Animasi hover & selected ring dengan color accent
 */

import { useEffect, useRef, useState } from 'react'
import { generateHarmoniousPalette } from '../state/shareLink'
import type { JerseyDesignSchema } from '../state/schema'
import type { LayerParams } from '../patterns/generators'

// ─────────────────────────────────────────────────────────────
// Template Presets Data
// ─────────────────────────────────────────────────────────────

interface TemplatePreset {
  id: string
  nama: string
  kategori: 'sport' | 'premium' | 'nasional'
  isNew?: boolean
  lengan_panjang?: boolean
  tipe_kerah?: 'ribbon' | 'vneck'
  warna_dasar: string
  bahan: JerseyDesignSchema['bahan']
  kerah: boolean
  layers: LayerParams[]
  latar: JerseyDesignSchema['latar']
  accentColor: string // warna representatif untuk preview swatch
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'stardust-vneck-01',
    nama: 'Stardust Meteor (V-Neck)',
    kategori: 'premium',
    isNew: true,
    lengan_panjang: false,
    tipe_kerah: 'vneck',
    warna_dasar: '#141C2B',
    bahan: 'milano',
    kerah: true,
    accentColor: '#38BDF8',
    latar: { tipe: 'gradasi', warna1: '#1F2937', warna2: '#0F172A', sudut: 135 },
    layers: [
      { id: 'l1', motif: 'meteor-shower', warna: '#FFFFFF', seed: 101, kerapatan: 1.15, sudut: 0, skala: 1.0, opacity: 0.95 },
    ],
  },
  {
    id: 'stardust-round-01',
    nama: 'Stardust Meteor (Round Neck)',
    kategori: 'premium',
    isNew: true,
    lengan_panjang: false,
    tipe_kerah: 'ribbon',
    warna_dasar: '#141C2B',
    bahan: 'milano',
    kerah: true,
    accentColor: '#38BDF8',
    latar: { tipe: 'gradasi', warna1: '#1F2937', warna2: '#0F172A', sudut: 135 },
    layers: [
      { id: 'l1', motif: 'meteor-shower', warna: '#FFFFFF', seed: 101, kerapatan: 1.15, sudut: 0, skala: 1.0, opacity: 0.95 },
    ],
  },
  {
    id: 'stardust-long-01',
    nama: 'Stardust Meteor (Lengan Panjang)',
    kategori: 'premium',
    isNew: true,
    lengan_panjang: true,
    tipe_kerah: 'vneck',
    warna_dasar: '#141C2B',
    bahan: 'milano',
    kerah: true,
    accentColor: '#38BDF8',
    latar: { tipe: 'gradasi', warna1: '#1F2937', warna2: '#0F172A', sudut: 135 },
    layers: [
      { id: 'l1', motif: 'meteor-shower', warna: '#FFFFFF', seed: 101, kerapatan: 1.15, sudut: 0, skala: 1.0, opacity: 0.95 },
    ],
  },
  {
    id: 'fuji-ridge-01',
    nama: 'Fuji Ridge (Pendek)',
    kategori: 'premium',
    lengan_panjang: false,
    tipe_kerah: 'ribbon',
    warna_dasar: '#1B2A41',
    bahan: 'milano',
    kerah: true,
    accentColor: '#F2F2F2',
    latar: { tipe: 'gradasi', warna1: '#1E2330', warna2: '#0D0F12', sudut: 90 },
    layers: [
      { id: 'l1', motif: 'fuji-ridge', warna: '#F2F2F2', seed: 42, kerapatan: 0.8, sudut: 15, skala: 1.0, opacity: 0.85 },
      { id: 'l2', motif: 'contour-peak', warna: '#E63946', seed: 7, kerapatan: 0.5, sudut: 0, skala: 1.3, opacity: 0.6 },
    ],
  },
  {
    id: 'fuji-ridge-polo-01',
    nama: 'Fuji Ridge Polo (Pendek)',
    kategori: 'premium',
    isNew: true,
    lengan_panjang: false,
    tipe_kerah: 'vneck',
    warna_dasar: '#1B2A41',
    bahan: 'milano',
    kerah: true,
    accentColor: '#E63946',
    latar: { tipe: 'gradasi', warna1: '#1E2330', warna2: '#0D0F12', sudut: 90 },
    layers: [
      { id: 'l1', motif: 'fuji-ridge', warna: '#F2F2F2', seed: 42, kerapatan: 0.8, sudut: 15, skala: 1.0, opacity: 0.85 },
      { id: 'l2', motif: 'contour-peak', warna: '#E63946', seed: 7, kerapatan: 0.5, sudut: 0, skala: 1.3, opacity: 0.6 },
    ],
  },
  {
    id: 'fuji-ridge-long-01',
    nama: 'Fuji Ridge Pro (Panjang)',
    kategori: 'premium',
    isNew: true,
    lengan_panjang: true,
    tipe_kerah: 'vneck',
    warna_dasar: '#1B2A41',
    bahan: 'milano',
    kerah: true,
    accentColor: '#F2F2F2',
    latar: { tipe: 'gradasi', warna1: '#1E2330', warna2: '#0D0F12', sudut: 90 },
    layers: [
      { id: 'l1', motif: 'fuji-ridge', warna: '#F2F2F2', seed: 42, kerapatan: 0.8, sudut: 15, skala: 1.0, opacity: 0.85 },
      { id: 'l2', motif: 'contour-peak', warna: '#E63946', seed: 7, kerapatan: 0.5, sudut: 0, skala: 1.3, opacity: 0.6 },
    ],
  },
  {
    id: 'contour-peak-01',
    nama: 'Contour Peak (Pendek)',
    kategori: 'sport',
    lengan_panjang: false,
    tipe_kerah: 'ribbon',
    warna_dasar: '#0A1628',
    bahan: 'microcool',
    kerah: true,
    accentColor: '#00E5FF',
    latar: { tipe: 'gradasi', warna1: '#0A1628', warna2: '#051020', sudut: 135 },
    layers: [
      { id: 'l1', motif: 'contour-peak', warna: '#00E5FF', seed: 13, kerapatan: 1.2, sudut: 30, skala: 1.2, opacity: 0.9 },
      { id: 'l2', motif: 'contour-peak', warna: '#0077FF', seed: 99, kerapatan: 0.7, sudut: -15, skala: 0.8, opacity: 0.5 },
    ],
  },
  {
    id: 'contour-peak-polo-01',
    nama: 'Contour Velocity Polo',
    kategori: 'sport',
    isNew: true,
    lengan_panjang: false,
    tipe_kerah: 'vneck',
    warna_dasar: '#0A1628',
    bahan: 'microcool',
    kerah: true,
    accentColor: '#00E5FF',
    latar: { tipe: 'gradasi', warna1: '#0A1628', warna2: '#051020', sudut: 135 },
    layers: [
      { id: 'l1', motif: 'contour-peak', warna: '#00E5FF', seed: 13, kerapatan: 1.2, sudut: 30, skala: 1.2, opacity: 0.9 },
      { id: 'l2', motif: 'contour-peak', warna: '#0077FF', seed: 99, kerapatan: 0.7, sudut: -15, skala: 0.8, opacity: 0.5 },
    ],
  },
  {
    id: 'contour-peak-long-01',
    nama: 'Contour Peak Elite (Panjang)',
    kategori: 'sport',
    isNew: true,
    lengan_panjang: true,
    tipe_kerah: 'vneck',
    warna_dasar: '#0A1628',
    bahan: 'microcool',
    kerah: true,
    accentColor: '#00E5FF',
    latar: { tipe: 'gradasi', warna1: '#0A1628', warna2: '#051020', sudut: 135 },
    layers: [
      { id: 'l1', motif: 'contour-peak', warna: '#00E5FF', seed: 13, kerapatan: 1.2, sudut: 30, skala: 1.2, opacity: 0.9 },
      { id: 'l2', motif: 'contour-peak', warna: '#0077FF', seed: 99, kerapatan: 0.7, sudut: -15, skala: 0.8, opacity: 0.5 },
    ],
  },
  {
    id: 'mocha-dust-01',
    nama: 'Mocha Dust (Pendek)',
    kategori: 'premium',
    lengan_panjang: false,
    tipe_kerah: 'ribbon',
    warna_dasar: '#3B2414',
    bahan: 'emboss',
    kerah: true,
    accentColor: '#C49A6C',
    latar: { tipe: 'gradasi', warna1: '#2C1A0E', warna2: '#1A0E08', sudut: 45 },
    layers: [
      { id: 'l1', motif: 'mocha-dust', warna: '#C49A6C', seed: 55, kerapatan: 1.5, sudut: 0, skala: 1.4, opacity: 0.8 },
      { id: 'l2', motif: 'moss-strata', warna: '#8B6914', seed: 77, kerapatan: 0.4, sudut: 10, skala: 0.9, opacity: 0.45 },
    ],
  },
  {
    id: 'mocha-dust-long-01',
    nama: 'Mocha Dust Edition (Panjang)',
    kategori: 'premium',
    isNew: true,
    lengan_panjang: true,
    tipe_kerah: 'vneck',
    warna_dasar: '#3B2414',
    bahan: 'emboss',
    kerah: true,
    accentColor: '#C49A6C',
    latar: { tipe: 'gradasi', warna1: '#2C1A0E', warna2: '#1A0E08', sudut: 45 },
    layers: [
      { id: 'l1', motif: 'mocha-dust', warna: '#C49A6C', seed: 55, kerapatan: 1.5, sudut: 0, skala: 1.4, opacity: 0.8 },
      { id: 'l2', motif: 'moss-strata', warna: '#8B6914', seed: 77, kerapatan: 0.4, sudut: 10, skala: 0.9, opacity: 0.45 },
    ],
  },
  {
    id: 'moss-strata-01',
    nama: 'Moss Strata (Pendek)',
    kategori: 'sport',
    lengan_panjang: false,
    tipe_kerah: 'ribbon',
    warna_dasar: '#14321A',
    bahan: 'microcool',
    kerah: false,
    accentColor: '#4ADE80',
    latar: { tipe: 'gradasi', warna1: '#0D1F10', warna2: '#060F09', sudut: 120 },
    layers: [
      { id: 'l1', motif: 'moss-strata', warna: '#4ADE80', seed: 31, kerapatan: 1.0, sudut: 5, skala: 1.1, opacity: 0.85 },
      { id: 'l2', motif: 'fuji-ridge', warna: '#2D9E50', seed: 22, kerapatan: 0.6, sudut: 20, skala: 0.7, opacity: 0.5 },
    ],
  },
  {
    id: 'merah-putih-01',
    nama: 'Merah Putih (Pendek)',
    kategori: 'nasional',
    isNew: true,
    lengan_panjang: false,
    tipe_kerah: 'ribbon',
    warna_dasar: '#CC0000',
    bahan: 'milano',
    kerah: true,
    accentColor: '#FFFFFF',
    latar: { tipe: 'gradasi', warna1: '#8B0000', warna2: '#3D0000', sudut: 90 },
    layers: [
      { id: 'l1', motif: 'merah-putih-ridge', warna: '#FFFFFF', seed: 17, kerapatan: 1.0, sudut: 0, skala: 1.0, opacity: 0.9 },
      { id: 'l2', motif: 'contour-peak', warna: '#FFD700', seed: 5, kerapatan: 0.3, sudut: 45, skala: 1.5, opacity: 0.4 },
    ],
  },
  {
    id: 'merah-putih-long-01',
    nama: 'Garuda Warrior (Panjang)',
    kategori: 'nasional',
    isNew: true,
    lengan_panjang: true,
    tipe_kerah: 'vneck',
    warna_dasar: '#CC0000',
    bahan: 'milano',
    kerah: true,
    accentColor: '#FFFFFF',
    latar: { tipe: 'gradasi', warna1: '#8B0000', warna2: '#3D0000', sudut: 90 },
    layers: [
      { id: 'l1', motif: 'merah-putih-ridge', warna: '#FFFFFF', seed: 17, kerapatan: 1.0, sudut: 0, skala: 1.0, opacity: 0.9 },
      { id: 'l2', motif: 'contour-peak', warna: '#FFD700', seed: 5, kerapatan: 0.3, sudut: 45, skala: 1.5, opacity: 0.4 },
    ],
  },
  {
    id: 'void-strike-01',
    nama: 'Void Strike (Pendek)',
    kategori: 'premium',
    lengan_panjang: false,
    tipe_kerah: 'vneck',
    warna_dasar: '#0D0D0D',
    bahan: 'emboss',
    kerah: false,
    accentColor: '#9D4EDD',
    latar: { tipe: 'gradasi', warna1: '#120824', warna2: '#000000', sudut: 180 },
    layers: [
      { id: 'l1', motif: 'fuji-ridge', warna: '#9D4EDD', seed: 88, kerapatan: 0.9, sudut: -20, skala: 1.3, opacity: 0.75 },
      { id: 'l2', motif: 'contour-peak', warna: '#C77DFF', seed: 44, kerapatan: 0.5, sudut: 30, skala: 0.6, opacity: 0.55 },
    ],
  },
]

// ─────────────────────────────────────────────────────────────
// Mini Preview Canvas (renders color swatch + stripes)
// ─────────────────────────────────────────────────────────────

function TemplatePreviewCanvas({
  template,
  isSelected,
}: {
  template: TemplatePreset
  isSelected: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height

    // Background gradient
    const grd = ctx.createLinearGradient(0, 0, 0, H)
    grd.addColorStop(0, template.latar.warna1)
    grd.addColorStop(1, template.latar.warna2)
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, W, H)

    // Warna dasar overlay (jersey silhouette hint)
    ctx.globalAlpha = 0.6
    ctx.fillStyle = template.warna_dasar
    ctx.beginPath()

    const isLong = !!template.lengan_panjang
    if (isLong) {
      // Silhouette jersey lengan panjang
      ctx.moveTo(W * 0.25, 0)
      ctx.lineTo(W * 0.75, 0)
      ctx.lineTo(W * 0.88, H * 0.22)
      ctx.lineTo(W * 0.96, H * 0.62) // Pergelangan tangan panjang
      ctx.lineTo(W * 0.86, H * 0.64)
      ctx.lineTo(W * 0.78, H * 0.32)
      ctx.lineTo(W * 0.78, H)
      ctx.lineTo(W * 0.22, H)
      ctx.lineTo(W * 0.22, H * 0.32)
      ctx.lineTo(W * 0.14, H * 0.64)
      ctx.lineTo(W * 0.04, H * 0.62) // Pergelangan tangan panjang
      ctx.lineTo(W * 0.12, H * 0.22)
    } else {
      // Silhouette jersey lengan pendek
      ctx.moveTo(W * 0.2, 0)
      ctx.lineTo(W * 0.8, 0)
      ctx.lineTo(W * 0.9, H * 0.25)
      ctx.lineTo(W, H * 0.2)
      ctx.lineTo(W, H)
      ctx.lineTo(0, H)
      ctx.lineTo(0, H * 0.2)
      ctx.lineTo(W * 0.1, H * 0.25)
    }
    ctx.closePath()
    ctx.fill()

    if (template.layers[0]?.motif === 'meteor-shower') {
      // ── Render Khusus Meteor Shower / Stardust pada Thumbnail (Gambar 3 - 5) ──
      ctx.save()
      const rng = (seed: number) => {
        let s = seed
        return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
      }
      const r = rng(101)

      // Meteor trails vertikal
      for (let i = 0; i < 22; i++) {
        const x = W * (0.20 + r() * 0.60)
        const y1 = H * (0.15 + r() * 0.25)
        const len = H * (0.25 + r() * 0.40)
        const y2 = Math.min(H * 0.88, y1 + len)
        const isCyan = r() > 0.6

        ctx.strokeStyle = isCyan ? 'rgba(125, 211, 252, 0.85)' : 'rgba(255, 255, 255, 0.90)'
        ctx.lineWidth = 1.2 + r() * 1.5
        ctx.beginPath()
        ctx.moveTo(x, y1)
        ctx.lineTo(x, y2)
        ctx.stroke()

        // Glowing dot di kepala meteor
        ctx.fillStyle = isCyan ? '#BAE6FD' : '#FFFFFF'
        ctx.beginPath()
        ctx.arc(x, y2, ctx.lineWidth * 1.2, 0, Math.PI * 2)
        ctx.fill()
      }

      // Sparkles ✦
      ctx.fillStyle = '#FFFFFF'
      for (let i = 0; i < 14; i++) {
        const sx = W * (0.22 + r() * 0.56)
        const sy = H * (0.18 + r() * 0.35)
        const sz = 2.5 + r() * 3.5
        ctx.beginPath()
        ctx.moveTo(sx, sy - sz)
        ctx.quadraticCurveTo(sx, sy, sx + sz, sy)
        ctx.quadraticCurveTo(sx, sy, sx, sy + sz)
        ctx.quadraticCurveTo(sx, sy, sx - sz, sy)
        ctx.quadraticCurveTo(sx, sy, sx, sy - sz)
        ctx.fill()
      }
      ctx.restore()
    } else {
      // Accent stripes standar dari layer[0]
      ctx.globalAlpha = 0.7
      ctx.strokeStyle = template.accentColor
      ctx.lineWidth = 2
      const angleRad = ((template.layers[0]?.sudut || 15) * Math.PI) / 180
      const step = 12
      for (let i = -H; i < W + H; i += step) {
        ctx.beginPath()
        ctx.moveTo(i + Math.cos(angleRad) * H, 0)
        ctx.lineTo(i - Math.cos(angleRad) * H, H)
        ctx.stroke()
      }

      // Layer 2 accent jika ada
      if (template.layers[1]) {
        ctx.globalAlpha = 0.4
        ctx.strokeStyle = template.layers[1].warna
        ctx.lineWidth = 1
        const step2 = 28
        for (let i = -H; i < W + H; i += step2) {
          ctx.beginPath()
          ctx.moveTo(i + Math.sin(angleRad + 0.8) * H, 0)
          ctx.lineTo(i - Math.sin(angleRad + 0.8) * H, H)
          ctx.stroke()
        }
      }
    }

    // ── Render Kerah Visual pada Thumbnail ──
    if (template.kerah) {
      ctx.globalAlpha = 0.95
      ctx.fillStyle = template.accentColor
      if (template.tipe_kerah === 'vneck') {
        // Kerah polo V-neck: bukaan V atletis + daun kerah lipat
        ctx.beginPath()
        ctx.moveTo(W * 0.38, 0)
        ctx.lineTo(W * 0.50, H * 0.16) // Ujung V di dada
        ctx.lineTo(W * 0.62, 0)
        ctx.lineTo(W * 0.57, 0)
        ctx.lineTo(W * 0.50, H * 0.12)
        ctx.lineTo(W * 0.43, 0)
        ctx.closePath()
        ctx.fill()

        // Daun kerah kiri & kanan
        ctx.beginPath()
        ctx.moveTo(W * 0.36, 0)
        ctx.lineTo(W * 0.44, H * 0.13)
        ctx.lineTo(W * 0.39, H * 0.14)
        ctx.closePath()
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(W * 0.64, 0)
        ctx.lineTo(W * 0.56, H * 0.13)
        ctx.lineTo(W * 0.61, H * 0.14)
        ctx.closePath()
        ctx.fill()
      } else {
        // Kerah ribbon bulat: lingkar rib rapat
        ctx.beginPath()
        ctx.arc(W * 0.50, 0, W * 0.14, 0, Math.PI)
        ctx.lineWidth = 3.5
        ctx.strokeStyle = template.accentColor
        ctx.stroke()
      }
    }

    // Bahan & Model badge bottom
    ctx.globalAlpha = 0.88
    ctx.fillStyle = 'rgba(0,0,0,0.65)'
    ctx.fillRect(0, H - 24, W, 24)

    ctx.globalAlpha = 1
    ctx.fillStyle = isSelected ? template.accentColor : '#CBD5E1'
    ctx.font = 'bold 8px "Inter", system-ui'
    ctx.textAlign = 'center'
    const cutText = isLong ? 'PANJANG' : 'PENDEK'
    const collarText = template.tipe_kerah === 'vneck' ? 'POLO' : 'RIBBON'
    ctx.fillText(`${template.bahan.toUpperCase()} • ${cutText} • ${collarText}`, W / 2, H - 8)

    // Selected ring
    if (isSelected) {
      ctx.strokeStyle = template.accentColor
      ctx.lineWidth = 3
      ctx.globalAlpha = 1
      ctx.strokeRect(1.5, 1.5, W - 3, H - 3)
    }
  }, [template, isSelected])

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={160}
      style={{
        display: 'block',
        borderRadius: '8px 8px 0 0',
        width: '100%',
        height: '160px',
        objectFit: 'cover',
      }}
    />
  )
}

// ─────────────────────────────────────────────────────────────
// Color Variation Swatches
// ─────────────────────────────────────────────────────────────

function ColorVariationRow({
  templateId,
  baseColor,
  onSelectVariant,
}: {
  templateId: string
  baseColor: string
  onSelectVariant: (color: string) => void
}) {
  const palette = generateHarmoniousPalette(baseColor, 'triadic', 5)

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        justifyContent: 'center',
        padding: '6px 8px',
        background: 'rgba(0,0,0,0.3)',
      }}
    >
      {palette.map((c, i) => (
        <button
          key={`${templateId}-var-${i}`}
          id={`color-var-${templateId}-${i}`}
          title={`Varian ${i + 1}: ${c}`}
          onClick={(e) => {
            e.stopPropagation()
            onSelectVariant(c)
          }}
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: c,
            border: '1.5px solid rgba(255,255,255,0.3)',
            cursor: 'pointer',
            transition: 'transform 0.15s, border-color 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.35)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = c
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.3)'
          }}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main TemplateGallery Component
// ─────────────────────────────────────────────────────────────

type Kategori = 'semua' | 'pendek' | 'panjang' | 'polo' | 'sport' | 'premium' | 'nasional'

interface TemplateGalleryProps {
  selectedTemplateId: string
  onSelectTemplate: (schema: Partial<JerseyDesignSchema> & { template_id: string }) => void
  onProceed: () => void
}

export function TemplateGallery({
  selectedTemplateId,
  onSelectTemplate,
  onProceed,
}: TemplateGalleryProps) {
  const [filter, setFilter] = useState<Kategori>('semua')
  const [variantOverrides, setVariantOverrides] = useState<Record<string, string>>({})

  const KATEGORI_LIST: { id: Kategori; label: string }[] = [
    { id: 'semua', label: '🌟 Semua' },
    { id: 'pendek', label: '👕 Lengan Pendek' },
    { id: 'panjang', label: '🥼 Lengan Panjang' },
    { id: 'polo', label: '👔 Kerah Polo' },
    { id: 'sport', label: '⚡ Sport' },
    { id: 'premium', label: '✦ Premium' },
    { id: 'nasional', label: '🇮🇩 Nasional' },
  ]

  const filtered =
    filter === 'semua'
      ? TEMPLATE_PRESETS
      : filter === 'pendek'
      ? TEMPLATE_PRESETS.filter((t) => !t.lengan_panjang)
      : filter === 'panjang'
      ? TEMPLATE_PRESETS.filter((t) => !!t.lengan_panjang)
      : filter === 'polo'
      ? TEMPLATE_PRESETS.filter((t) => t.tipe_kerah === 'vneck')
      : TEMPLATE_PRESETS.filter((t) => t.kategori === filter)

  function handleSelectTemplate(tmpl: TemplatePreset) {
    const warnaOverride = variantOverrides[tmpl.id]
    const finalWarna = warnaOverride ?? tmpl.warna_dasar

    // Update layer warna if variant selected
    const finalLayers = warnaOverride
      ? tmpl.layers.map((l, i) =>
          i === 0
            ? { ...l, warna: warnaOverride }
            : l
        )
      : tmpl.layers

    onSelectTemplate({
      template_id: tmpl.id,
      nama_desain: tmpl.nama,
      bahan: tmpl.bahan,
      kerah: tmpl.kerah,
      tipe_kerah: tmpl.tipe_kerah ?? 'ribbon',
      lengan_panjang: tmpl.lengan_panjang ?? false,
      warna_dasar: finalWarna,
      layers: finalLayers,
      mode_tekstur: 'template',
      gambar_import: null,
      latar: tmpl.latar,
    })
  }

  return (
    <div
      id="template-gallery"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header galeri */}
      <div
        style={{
          padding: '16px 20px 12px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: 4,
          }}
        >
          Pilih Template
        </h2>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 12 }}>
          Mulai dari template preset atau kustomisasi sepenuhnya di langkah berikutnya.
        </p>

        {/* Filter tabs */}
        <div
          id="template-filter-tabs"
          role="tablist"
          aria-label="Filter kategori template"
          style={{ display: 'flex', gap: 6 }}
        >
          {KATEGORI_LIST.map((k) => (
            <button
              key={k.id}
              id={`filter-tab-${k.id}`}
              role="tab"
              aria-selected={filter === k.id}
              onClick={() => setFilter(k.id)}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: filter === k.id ? 'var(--color-accent)' : 'var(--color-border)',
                background: filter === k.id ? 'var(--color-accent-muted)' : 'transparent',
                color: filter === k.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                fontSize: 'var(--text-xs)',
                fontWeight: filter === k.id ? 600 : 400,
                cursor: 'pointer',
                transition: 'all var(--duration-fast) var(--ease-standard)',
              }}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div
        id="template-grid"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 12,
          alignContent: 'start',
        }}
      >
        {filtered.map((tmpl) => {
          const isSelected = selectedTemplateId === tmpl.id
          const variantColor = variantOverrides[tmpl.id]
          const displayAccent = variantColor ?? tmpl.accentColor

          return (
            <div
              key={tmpl.id}
              id={`template-card-${tmpl.id}`}
              role="option"
              aria-selected={isSelected}
              onClick={() => handleSelectTemplate(tmpl)}
              style={{
                borderRadius: 10,
                overflow: 'hidden',
                border: '2px solid',
                borderColor: isSelected ? displayAccent : 'var(--color-border)',
                cursor: 'pointer',
                transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
                boxShadow: isSelected
                  ? `0 0 0 3px ${displayAccent}44, 0 8px 24px rgba(0,0,0,0.4)`
                  : '0 2px 8px rgba(0,0,0,0.25)',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                background: 'var(--color-surface-2)',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = displayAccent + '88'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'none'
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)'
                }
              }}
            >
              {/* Badge BARU */}
              {tmpl.isNew && (
                <span
                  style={{
                    position: 'absolute',
                    top: 7,
                    left: 7,
                    zIndex: 2,
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    background: 'var(--color-accent)',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  BARU
                </span>
              )}

              {/* Badge Selected */}
              {isSelected && (
                <span
                  aria-label="Template terpilih"
                  style={{
                    position: 'absolute',
                    top: 7,
                    right: 7,
                    zIndex: 2,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: displayAccent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#000',
                  }}
                >
                  ✓
                </span>
              )}

              {/* Canvas Preview */}
              <TemplatePreviewCanvas template={tmpl} isSelected={isSelected} />

              {/* Color variation row */}
              <ColorVariationRow
                templateId={tmpl.id}
                baseColor={tmpl.warna_dasar}
                onSelectVariant={(c) => {
                  setVariantOverrides((prev) => ({ ...prev, [tmpl.id]: c }))
                  // Jika ini template yang sedang dipilih, update langsung
                  if (isSelected) {
                    handleSelectTemplate({ ...tmpl, warna_dasar: c })
                  }
                }}
              />

              {/* Nama template */}
              <div
                style={{
                  padding: '6px 8px',
                  background: 'var(--color-surface-2)',
                  borderTop: '1px solid var(--color-border)',
                }}
              >
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? displayAccent : 'var(--color-text-primary)',
                    textAlign: 'center',
                    lineHeight: 1.3,
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {tmpl.nama}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    marginTop: 4,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 600,
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.06)',
                      color: tmpl.lengan_panjang ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {tmpl.lengan_panjang ? '🥼 Panjang' : '👕 Pendek'}
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 600,
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.06)',
                      color: tmpl.tipe_kerah === 'vneck' ? '#00E5FF' : 'var(--color-text-secondary)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {tmpl.tipe_kerah === 'vneck' ? '👔 Polo' : '🔘 Ribbon'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer CTA */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: 'var(--color-surface-1)',
        }}
      >
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
          {selectedTemplateId
            ? `Template: ${TEMPLATE_PRESETS.find((t) => t.id === selectedTemplateId)?.nama || selectedTemplateId}`
            : 'Belum ada template dipilih'}
        </p>
        <button
          id="btn-proceed-step2"
          className="btn-primary"
          onClick={onProceed}
          disabled={!selectedTemplateId}
          style={{ opacity: selectedTemplateId ? 1 : 0.5 }}
        >
          Sesuaikan →
        </button>
      </div>
    </div>
  )
}

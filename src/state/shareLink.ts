/**
 * state/shareLink.ts — URL Sharing untuk Desain Jersey Nemesis3D
 *
 * Encode/decode state desain ringkas (tanpa data URL gambar/logo yang besar)
 * ke dalam URL hash (#d=...) menggunakan Base64URL + gzip-like kompresi sederhana.
 *
 * Format: #d=<base64url(JSON)>
 * JSON yang di-share hanya menyimpan parameter "serializable" non-binary:
 *   id, template_id, nama_desain, bahan, kerah, warna_dasar, layers,
 *   mode_tekstur, transform_gambar, latar (tanpa gambar)
 */

import type { JerseyDesignSchema } from './schema'

/** Subset state yang aman di-share via URL (tanpa data URL binary) */
export interface ShareableDesign {
  id: string
  template_id: string
  nama_desain: string
  bahan: string
  kerah: boolean
  tipe_kerah?: 'ribbon' | 'vneck'
  lengan_panjang?: boolean
  warna_dasar: string
  layers: JerseyDesignSchema['layers']
  mode_tekstur?: string
  transform_gambar?: JerseyDesignSchema['transform_gambar']
  latar: {
    tipe: string
    warna1: string
    warna2: string
    sudut: number
  }
}

/**
 * Encode state desain ke string URL-safe (Base64URL)
 */
export function encodeDesignToShareUrl(design: JerseyDesignSchema): string {
  const shareable: ShareableDesign = {
    id: design.id,
    template_id: design.template_id,
    nama_desain: design.nama_desain,
    bahan: design.bahan,
    kerah: design.kerah,
    tipe_kerah: design.tipe_kerah,
    lengan_panjang: design.lengan_panjang,
    warna_dasar: design.warna_dasar,
    layers: design.layers,
    mode_tekstur: design.mode_tekstur,
    transform_gambar: design.transform_gambar,
    latar: {
      tipe: design.latar.tipe,
      warna1: design.latar.warna1,
      warna2: design.latar.warna2,
      sudut: design.latar.sudut,
    },
  }

  const json = JSON.stringify(shareable)
  // Encode ke Base64URL
  const b64 = btoa(unescape(encodeURIComponent(json)))
  const b64url = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const url = new URL(window.location.href)
  url.hash = `d=${b64url}`
  return url.toString()
}

/**
 * Decode URL hash (#d=...) menjadi ShareableDesign
 * Returns null jika hash tidak ada atau tidak valid
 */
export function decodeShareUrlToDesign(hash?: string): ShareableDesign | null {
  try {
    const h = hash || window.location.hash
    if (!h || !h.includes('d=')) return null

    const b64url = h.split('d=')[1]?.split('&')[0]
    if (!b64url) return null

    // Decode Base64URL ke JSON
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    const json = decodeURIComponent(escape(atob(padded)))
    const parsed = JSON.parse(json) as ShareableDesign

    // Validasi minimal
    if (!parsed.warna_dasar || !parsed.bahan) return null

    return parsed
  } catch {
    return null
  }
}

/**
 * Salin link ke clipboard dan return URL
 */
export async function copyShareLink(design: JerseyDesignSchema): Promise<string> {
  const url = encodeDesignToShareUrl(design)
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    // fallback: buat textarea sementara
    const ta = document.createElement('textarea')
    ta.value = url
    ta.style.cssText = 'position:fixed;left:-9999px'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  return url
}

/**
 * Generator palet warna harmonis (Complementary / Triadic / Analogous)
 * Digunakan untuk fitur "Variasi Warna Otomatis"
 */
export function generateHarmoniousPalette(
  baseHex: string,
  scheme: 'complementary' | 'triadic' | 'analogous' | 'split-complementary' = 'triadic',
  count = 5,
): string[] {
  // Parse hex ke HSL
  const r = parseInt(baseHex.slice(1, 3), 16) / 255
  const g = parseInt(baseHex.slice(3, 5), 16) / 255
  const b = parseInt(baseHex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  const hDeg = Math.round(h * 360)
  const sPct = Math.round(s * 100)
  const lPct = Math.round(l * 100)

  // Tentukan hue offsets berdasarkan scheme
  let offsets: number[]
  switch (scheme) {
    case 'complementary':
      offsets = [0, 180, 30, 210, 330]
      break
    case 'triadic':
      offsets = [0, 120, 240, 60, 300]
      break
    case 'analogous':
      offsets = [0, 30, 60, -30, -60]
      break
    case 'split-complementary':
      offsets = [0, 150, 210, 75, 285]
      break
    default:
      offsets = [0, 120, 240, 60, 180]
  }

  // Konversi HSL kembali ke hex
  function hslToHex(hh: number, ss: number, ll: number): string {
    const hNorm = ((hh % 360) + 360) % 360
    const sNorm = ss / 100
    const lNorm = ll / 100

    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
    const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1))
    const m = lNorm - c / 2

    let rr = 0, gg = 0, bb = 0
    if (hNorm < 60) { rr = c; gg = x }
    else if (hNorm < 120) { rr = x; gg = c }
    else if (hNorm < 180) { gg = c; bb = x }
    else if (hNorm < 240) { gg = x; bb = c }
    else if (hNorm < 300) { rr = x; bb = c }
    else { rr = c; bb = x }

    const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
    return `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`
  }

  return offsets.slice(0, count).map((offset) =>
    hslToHex(hDeg + offset, Math.max(20, sPct), Math.min(75, Math.max(25, lPct)))
  )
}

/**
 * texture/logoLayer.ts — Logika Penempatan Logo pada Tekstur Jersey
 * Sesuai spesifikasi BRIEF bagian 5.7:
 * - Posisi preset: dada-kiri, dada-tengah, punggung-atas, punggung-tengah, lengan
 * - Slider ukuran dan offset X/Y
 * - Logo ikut di-bake ke dalam tekstur akhir
 */

export type LogoPosisi =
  | 'dada-kiri'
  | 'dada-tengah'
  | 'punggung-atas'
  | 'punggung-tengah'
  | 'lengan'

export interface LogoConfig {
  image: HTMLImageElement | HTMLCanvasElement | null
  posisi: LogoPosisi
  ukuran: number // 0.05 - 0.40, default 0.15
  offset: [number, number] // [offsetX, offsetY] (-0.2 sampai 0.2)
}

/**
 * Koordinat UV dasar untuk setiap posisi preset logo
 * Disesuaikan dengan UV layout shirt_baked.glb:
 * - Dada depan: u ≈ 0.18–0.34, v ≈ 0.18–0.43 (pusat ~0.26, 0.27)
 * - Punggung: u ≈ 0.66–0.83, v ≈ 0.16–0.41 (pusat ~0.75, 0.26)
 * - Lengan: u ≈ 0.15–0.49, v ≈ 0.60–0.95 (sleeve area bawah UV)
 */
export const LOGO_PRESET_COORDS: Record<LogoPosisi, { u: number; v: number; label: string }> = {
  'dada-kiri': {
    u: 0.30,
    v: 0.28,
    label: 'Dada Kiri',
  },
  'dada-tengah': {
    u: 0.26,
    v: 0.30,
    label: 'Dada Tengah',
  },
  'punggung-atas': {
    u: 0.75,
    v: 0.25,
    label: 'Punggung Atas',
  },
  'punggung-tengah': {
    u: 0.75,
    v: 0.42,
    label: 'Punggung Tengah',
  },
  'lengan': {
    u: 0.25,
    v: 0.72,
    label: 'Lengan',
  },
}

/**
 * Render logo transparan ke kanvas tekstur diffuse
 */
export function renderLogoToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: LogoConfig,
) {
  if (!config.image) return

  const preset = LOGO_PRESET_COORDS[config.posisi] || LOGO_PRESET_COORDS['dada-kiri']
  const targetU = preset.u + config.offset[0]
  const targetV = preset.v + config.offset[1]

  const posX = targetU * width
  const posY = targetV * height

  const img = config.image
  const imgRatio = img.width / img.height

  // Hitung dimensi render logo
  const logoWidth = width * config.ukuran
  const logoHeight = logoWidth / imgRatio

  ctx.save()
  // Gambar logo terpusat pada titik koordinat
  ctx.drawImage(
    img,
    posX - logoWidth / 2,
    posY - logoHeight / 2,
    logoWidth,
    logoHeight,
  )
  ctx.restore()
}

/**
 * patterns/generators.ts — 5 Generator Motif Procedural Nemesis Sport
 * Sesuai spesifikasi BRIEF bagian 5.6:
 * 1. Contour Peak: garis kontur topografi
 * 2. Fuji Ridge: punggungan gunung bergaris
 * 3. Mocha Dust: gradasi bertekstur debu
 * 4. Moss Strata: lapisan tanah bergelombang
 * 5. Merah Putih Ridge: punggungan palet merah putih
 *
 * Parameter tiap layer: seed, kerapatan, sudut, skala, opacity.
 * Dihitung murni di Canvas 2D tanpa aset eksternal.
 */

export type MotifType =
  | 'contour-peak'
  | 'fuji-ridge'
  | 'mocha-dust'
  | 'moss-strata'
  | 'merah-putih-ridge'

export interface LayerParams {
  id: string
  motif: MotifType
  warna: string
  seed: number
  kerapatan: number // 0.2 - 2.5
  sudut: number     // 0 - 360 deg
  skala: number     // 0.5 - 3.0
  opacity: number   // 0.0 - 1.0
}

/**
 * Pseudo-random number generator berbasis seed (Linear Congruential Generator)
 */
function createRng(seed: number) {
  let s = Math.abs(Math.floor(seed)) || 1
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

/**
 * 1. CONTOUR PEAK: Garis kontur topografi gunung (elevation iso-lines).
 * Garis-garis kontur mulus berliku yang merepresentasikan peta topografi trail.
 */
export function renderContourPeak(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: LayerParams,
) {
  const { seed, kerapatan, sudut, skala, warna, opacity } = params
  const rad = (sudut * Math.PI) / 180

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.strokeStyle = warna
  ctx.lineWidth = Math.max(2, 4 * skala)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Rotasi canvas ke sudut yang ditentukan
  ctx.translate(width / 2, height / 2)
  ctx.rotate(rad)
  ctx.translate(-width / 2, -height / 2)

  const rng = createRng(seed)
  const baseFreq = 0.003 / skala
  const numBands = Math.floor(18 * kerapatan)
  const stepY = (height * 1.4) / numBands

  const p1 = rng() * 100
  const p2 = rng() * 100

  for (let i = -numBands / 4; i < numBands * 1.3; i++) {
    const yCenter = i * stepY
    ctx.beginPath()

    const stepX = 16
    let first = true

    for (let x = -width * 0.3; x <= width * 1.3; x += stepX) {
      // Formula matematis elevasi topografi gabungan harmonik
      const wave1 = Math.sin((x + p1) * baseFreq) * 60 * skala
      const wave2 = Math.cos((x * 1.8 + p2) * baseFreq) * 35 * skala
      const wave3 = Math.sin((x * 3.1 + i * 20) * baseFreq) * 15 * skala

      const y = yCenter + wave1 + wave2 + wave3

      if (first) {
        ctx.moveTo(x, y)
        first = false
      } else {
        ctx.lineTo(x, y)
      }
    }

    // Index tertentu dibuat garis tebal (index contour line seperti di peta topografi asli)
    if (Math.abs(Math.floor(i)) % 5 === 0) {
      ctx.lineWidth = Math.max(3.5, 7 * skala)
      ctx.stroke()
      ctx.lineWidth = Math.max(2, 4 * skala)
    } else {
      ctx.stroke()
    }
  }

  ctx.restore()
}

/**
 * 2. FUJI RIDGE: Punggungan gunung bergaris (alpine ridge lines).
 * Siluet sudut punggungan diagonal tegas dengan arsiran elevasi khas jersey trail.
 */
export function renderFujiRidge(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: LayerParams,
) {
  const { seed, kerapatan, sudut, skala, warna, opacity } = params
  const rad = (sudut * Math.PI) / 180

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = warna
  ctx.strokeStyle = warna

  ctx.translate(width / 2, height / 2)
  ctx.rotate(rad)
  ctx.translate(-width / 2, -height / 2)

  const rng = createRng(seed)
  const numRidges = Math.max(3, Math.floor(6 * kerapatan))
  const spacing = (height * 1.2) / numRidges

  for (let r = 0; r < numRidges; r++) {
    const baseY = r * spacing - height * 0.1
    const peakX = width * (0.3 + rng() * 0.4)
    const peakY = baseY - (180 + rng() * 120) * skala

    // Gambar siluet punggungan
    ctx.beginPath()
    ctx.moveTo(-width * 0.3, baseY + 200 * skala)
    ctx.lineTo(peakX, peakY)
    ctx.lineTo(width * 1.3, baseY + 180 * skala)
    ctx.lineTo(width * 1.3, baseY + 300 * skala)
    ctx.lineTo(-width * 0.3, baseY + 300 * skala)
    ctx.closePath()

    ctx.save()
    ctx.globalAlpha = opacity * 0.25
    ctx.fill()
    ctx.restore()

    // Garis crest tegas di puncak punggungan
    ctx.lineWidth = Math.max(3, 6 * skala)
    ctx.beginPath()
    ctx.moveTo(-width * 0.3, baseY + 200 * skala)
    ctx.lineTo(peakX, peakY)
    ctx.lineTo(width * 1.3, baseY + 180 * skala)
    ctx.stroke()

    // Arsiran sudut (hatching lines) di bawah lereng
    const numHatches = Math.floor(15 * kerapatan)
    ctx.lineWidth = Math.max(1.5, 2.5 * skala)

    for (let h = 0; h < numHatches; h++) {
      const t = h / numHatches
      const xStart = peakX + (width * 1.3 - peakX) * t
      const yStart = peakY + (baseY + 180 * skala - peakY) * t
      const hatchLen = (40 + (1 - t) * 80) * skala

      ctx.beginPath()
      ctx.moveTo(xStart, yStart)
      ctx.lineTo(xStart - hatchLen * 0.7, yStart + hatchLen)
      ctx.stroke()
    }
  }

  ctx.restore()
}

/**
 * 3. MOCHA DUST: Gradasi bertekstur debu lintasan trail (particulate trail dust spray).
 * Sebaran debu organik halus yang melandai secara vertikal/diagonal.
 */
export function renderMochaDust(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: LayerParams,
) {
  const { seed, kerapatan, sudut, skala, warna, opacity } = params
  const rad = (sudut * Math.PI) / 180

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = warna

  ctx.translate(width / 2, height / 2)
  ctx.rotate(rad)
  ctx.translate(-width / 2, -height / 2)

  const rng = createRng(seed)
  const numParticles = Math.floor(4000 * kerapatan)

  // Gradasi densitas partikel dari bawah ke atas
  for (let i = 0; i < numParticles; i++) {
    const rx = rng()
    const ry = rng()

    // Probabilitas kemunculan partikel terkonsentrasi di bagian tertentu (debu menyembur)
    const densityFalloff = Math.pow(ry, 1.8)
    if (rng() > densityFalloff) continue

    const x = rx * width * 1.2 - width * 0.1
    const y = ry * height * 1.2 - height * 0.1
    const size = (1.5 + rng() * 4.5) * skala

    ctx.save()
    // Variasi alpha per butir debu
    ctx.globalAlpha = opacity * (0.3 + rng() * 0.7)
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // Tambahkan semburan garis halus serpihan debu
  const streaks = Math.floor(30 * kerapatan)
  ctx.lineWidth = Math.max(1, 2 * skala)
  for (let s = 0; s < streaks; s++) {
    const sx = rng() * width
    const sy = height * (0.4 + rng() * 0.5)
    const len = (30 + rng() * 90) * skala

    ctx.save()
    ctx.globalAlpha = opacity * (0.2 + rng() * 0.5)
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(sx + len * 0.6, sy - len)
    ctx.strokeStyle = warna
    ctx.stroke()
    ctx.restore()
  }

  ctx.restore()
}

/**
 * 4. MOSS STRATA: Lapisan tanah bergelombang (wavy organic earth strata).
 * Gelombang pita horizontal/diagonal yang meliuk dinamis seperti lapisan geologi.
 */
export function renderMossStrata(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: LayerParams,
) {
  const { seed, kerapatan, sudut, skala, warna, opacity } = params
  const rad = (sudut * Math.PI) / 180

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = warna

  ctx.translate(width / 2, height / 2)
  ctx.rotate(rad)
  ctx.translate(-width / 2, -height / 2)

  const rng = createRng(seed)
  const numStrata = Math.max(3, Math.floor(7 * kerapatan))
  const stepY = (height * 1.3) / numStrata

  const phaseA = rng() * 50
  const phaseB = rng() * 50

  for (let s = 0; s < numStrata; s++) {
    const topY = s * stepY - height * 0.15
    const thickness = (30 + rng() * 60) * skala
    const botY = topY + thickness

    ctx.beginPath()
    const stepX = 20

    // Jalur atas strata
    for (let x = -width * 0.2; x <= width * 1.2; x += stepX) {
      const wave =
        Math.sin((x * 0.004 + phaseA + s * 1.5)) * 40 * skala +
        Math.cos((x * 0.008 + phaseB)) * 20 * skala
      if (x === -width * 0.2) {
        ctx.moveTo(x, topY + wave)
      } else {
        ctx.lineTo(x, topY + wave)
      }
    }

    // Jalur bawah strata (dibalik agar membentuk poligon tertutup)
    for (let x = width * 1.2; x >= -width * 0.2; x -= stepX) {
      const wave =
        Math.sin((x * 0.004 + phaseA + s * 1.5 + 0.3)) * 40 * skala +
        Math.cos((x * 0.008 + phaseB + 0.2)) * 20 * skala
      ctx.lineTo(x, botY + wave)
    }

    ctx.closePath()
    ctx.fill()
  }

  ctx.restore()
}

/**
 * 5. MERAH PUTIH RIDGE: Punggungan palet merah putih (Indonesian trail running crests).
 * Chevron sudut aerodinamis ganda dengan aksen putih kontras pada punggungan merah.
 */
export function renderMerahPutihRidge(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: LayerParams,
) {
  const { seed, kerapatan, sudut, skala, warna, opacity } = params
  const rad = (sudut * Math.PI) / 180

  ctx.save()
  ctx.translate(width / 2, height / 2)
  ctx.rotate(rad)
  ctx.translate(-width / 2, -height / 2)

  const rng = createRng(seed)
  const numBands = Math.max(3, Math.floor(6 * kerapatan))
  const spacing = (height * 1.2) / numBands

  const whiteColor = '#FFFFFF'
  const redColor = warna || '#E63946'

  for (let b = 0; b < numBands; b++) {
    const baseY = b * spacing - height * 0.1
    const chevronHeight = (70 + rng() * 40) * skala
    const thickness = (35 + rng() * 30) * skala

    // Pita Merah
    ctx.save()
    ctx.globalAlpha = opacity * 0.95
    ctx.fillStyle = redColor
    ctx.beginPath()
    ctx.moveTo(-width * 0.2, baseY)
    ctx.lineTo(width * 0.5, baseY - chevronHeight)
    ctx.lineTo(width * 1.2, baseY)
    ctx.lineTo(width * 1.2, baseY + thickness)
    ctx.lineTo(width * 0.5, baseY - chevronHeight + thickness)
    ctx.lineTo(-width * 0.2, baseY + thickness)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // Garis Aksen Putih di sepanjang tepi punggungan
    ctx.save()
    ctx.globalAlpha = opacity * 0.95
    ctx.strokeStyle = whiteColor
    ctx.lineWidth = Math.max(3, 6 * skala)
    ctx.beginPath()
    ctx.moveTo(-width * 0.2, baseY - 4)
    ctx.lineTo(width * 0.5, baseY - chevronHeight - 4)
    ctx.lineTo(width * 1.2, baseY - 4)
    ctx.stroke()
    ctx.restore()
  }

  ctx.restore()
}

/**
 * Panggil generator motif yang sesuai
 */
export function renderMotifLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  layer: LayerParams,
) {
  switch (layer.motif) {
    case 'contour-peak':
      renderContourPeak(ctx, width, height, layer)
      break
    case 'fuji-ridge':
      renderFujiRidge(ctx, width, height, layer)
      break
    case 'mocha-dust':
      renderMochaDust(ctx, width, height, layer)
      break
    case 'moss-strata':
      renderMossStrata(ctx, width, height, layer)
      break
    case 'merah-putih-ridge':
      renderMerahPutihRidge(ctx, width, height, layer)
      break
  }
}

/**
 * texture/uvGuide.ts — Garis panduan panel jersey (UV Guide)
 * Digunakan pada Mode B (Import Gambar) untuk membantu penataan posisi motif dan logo.
 * Koordinat disesuaikan dengan UV layout shirt_baked.glb:
 *   - Dada depan: u ≈ 0.18–0.34, v ≈ 0.18–0.43 → area atas-kiri kuadran kiri
 *   - Punggung:   u ≈ 0.66–0.83, v ≈ 0.16–0.41 → area atas kuadran kanan
 *   - Lengan kiri: u ≈ 0.14–0.41, v ≈ 0.06–0.94 → kuadran kiri bawah
 *   - Lengan kanan: u ≈ 0.49–0.63, v ≈ 0.06–0.94 → kuadran kanan bawah
 */

export function renderUvGuide(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  ctx.save()

  // Styling garis guide
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.80)' // Cyan kontras tinggi
  ctx.lineWidth = Math.max(2, width / 1024 * 2)
  ctx.setLineDash([12, 8])
  ctx.fillStyle = 'rgba(0, 229, 255, 0.9)'
  ctx.font = `600 ${Math.max(14, Math.floor(width / 72))}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // ── 1. Dada Depan / Front Panel ──
  // UV: u=0.18..0.34, v=0.18..0.43 → canvas area: x=0.18W..0.34W, y=0.18H..0.43H
  const frontX = width * 0.18
  const frontY = height * 0.18
  const frontW = width * (0.34 - 0.18)
  const frontH = height * (0.43 - 0.18)
  ctx.strokeRect(frontX, frontY, frontW, frontH)
  ctx.fillText('DADA DEPAN', frontX + frontW / 2, frontY + 14)

  // Crosshair pusat dada (u=0.26, v=0.30)
  const cxFront = width * 0.26
  const cyFront = height * 0.30
  ctx.beginPath()
  ctx.moveTo(cxFront, cyFront - 20)
  ctx.lineTo(cxFront, cyFront + 20)
  ctx.moveTo(cxFront - 20, cyFront)
  ctx.lineTo(cxFront + 20, cyFront)
  ctx.stroke()
  ctx.fillText('Logo', cxFront, cyFront + 30)

  // ── 2. Punggung Belakang / Back Panel ──
  // UV: u=0.66..0.83, v=0.16..0.41 → canvas area
  const backX = width * 0.66
  const backY = height * 0.16
  const backW = width * (0.83 - 0.66)
  const backH = height * (0.41 - 0.16)
  ctx.strokeRect(backX, backY, backW, backH)
  ctx.fillText('PUNGGUNG', backX + backW / 2, backY + 14)

  // Crosshair pusat punggung (u=0.75, v=0.26)
  const cxBack = width * 0.75
  const cyBack = height * 0.26
  ctx.beginPath()
  ctx.moveTo(cxBack, cyBack - 20)
  ctx.lineTo(cxBack, cyBack + 20)
  ctx.moveTo(cxBack - 20, cyBack)
  ctx.lineTo(cxBack + 20, cyBack)
  ctx.stroke()
  ctx.fillText('Punggung Atas', cxBack, cyBack + 30)

  // ── 3. Lengan Kiri (Left Sleeve) ──
  // UV: u=0.14..0.41, v=0.06..0.94
  const lSleeveX = width * 0.14
  const lSleeveY = height * 0.44   // tampilkan area representatif bagian atas lengan
  const lSleeveW = width * (0.41 - 0.14)
  const lSleeveH = height * 0.24
  ctx.strokeRect(lSleeveX, lSleeveY, lSleeveW, lSleeveH)
  ctx.fillText('Lengan Kiri', lSleeveX + lSleeveW / 2, lSleeveY + lSleeveH / 2)

  // ── 4. Lengan Kanan (Right Sleeve) ──
  // UV: u=0.49..0.63, v=0.06..0.94
  const rSleeveX = width * 0.49
  const rSleeveY = height * 0.44
  const rSleeveW = width * (0.63 - 0.49)
  const rSleeveH = height * 0.24
  ctx.strokeRect(rSleeveX, rSleeveY, rSleeveW, rSleeveH)
  ctx.fillText('Lengan Kanan', rSleeveX + rSleeveW / 2, rSleeveY + rSleeveH / 2)

  ctx.restore()
}

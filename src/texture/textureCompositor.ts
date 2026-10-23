/**
 * texture/textureCompositor.ts — Penggabung Layer Tekstur Akhir (2048x2048)
 * Menggabungkan warna dasar + layer-layer motif (Mode A) atau import gambar (Mode B)
 * menjadi satu CanvasTexture diffuse yang dipetakan langsung ke model jersey.
 */

import * as THREE from 'three'
import { renderMotifLayer, type LayerParams } from '../patterns/generators'
import { renderLogoToCanvas, type LogoConfig } from './logoLayer'
import { renderUvGuide } from './uvGuide'

export type TextureMode = 'template' | 'import'

export interface ImageTransform {
  scale: number
  offsetX: number
  offsetY: number
  rotation: number // derajat
  mirror: boolean
}

export interface CompositorOptions {
  mode: TextureMode
  warnaDasar: string
  layers: LayerParams[]
  importedImage: HTMLImageElement | HTMLCanvasElement | null
  imageTransform: ImageTransform
  logo?: LogoConfig | null
  showUvGuide: boolean
  resolution?: number // default 2048
}

export class TextureCompositor {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private texture: THREE.CanvasTexture
  private currentOptions: CompositorOptions

  constructor(initialOptions: CompositorOptions) {
    const size = initialOptions.resolution ?? 2048
    this.canvas = document.createElement('canvas')
    this.canvas.width = size
    this.canvas.height = size

    const context = this.canvas.getContext('2d')
    if (!context) {
      throw new Error('Gagal mendapatkan 2D context untuk TextureCompositor')
    }
    this.ctx = context
    this.currentOptions = initialOptions

    // Buat Three.js canvas texture
    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.colorSpace = THREE.SRGBColorSpace
    this.texture.wrapS = THREE.ClampToEdgeWrapping
    this.texture.wrapT = THREE.ClampToEdgeWrapping
    this.texture.generateMipmaps = true

    this.bake()
  }

  public getTexture(): THREE.CanvasTexture {
    return this.texture
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  public update(options: Partial<CompositorOptions>) {
    this.currentOptions = { ...this.currentOptions, ...options }
    this.bake()
  }

  /**
   * Render ulang seluruh layer ke dalam canvas tekstur
   */
  public bake() {
    const { width, height } = this.canvas
    const ctx = this.ctx

    // 1. Bersihkan dan isi latar dengan warna dasar
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = this.currentOptions.warnaDasar || '#1B2A41'
    ctx.fillRect(0, 0, width, height)

    // 2. Render sesuai mode aktif
    if (this.currentOptions.mode === 'template') {
      // MODE A: Render layer-layer motif berurutan dari bawah ke atas
      for (const layer of this.currentOptions.layers) {
        if (layer.opacity > 0) {
          renderMotifLayer(ctx, width, height, layer)
        }
      }
    } else if (this.currentOptions.mode === 'import') {
      // MODE B: Render gambar yang di-upload dengan transformasi
      const img = this.currentOptions.importedImage
      if (img) {
        const { scale, offsetX, offsetY, rotation, mirror } =
          this.currentOptions.imageTransform

        ctx.save()

        // Posisikan pivot di tengah canvas ditambah offset
        const centerX = width / 2 + offsetX * width
        const centerY = height / 2 + offsetY * height

        ctx.translate(centerX, centerY)
        ctx.rotate((rotation * Math.PI) / 180)

        if (mirror) {
          ctx.scale(-1, 1)
        }

        // Hitung dimensi render sesuai rasio asli gambar
        const imgRatio = img.width / img.height
        let drawW = width * scale
        let drawH = drawW / imgRatio

        if (drawH > height * scale * 2) {
          drawH = height * scale
          drawW = drawH * imgRatio
        }

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
        ctx.restore()
      }
    }

    // 3. Render Logo jika dikonfigurasi
    if (this.currentOptions.logo && this.currentOptions.logo.image) {
      renderLogoToCanvas(ctx, width, height, this.currentOptions.logo)
    }

    // 4. Render garis panduan panel UV Guide jika diaktifkan
    if (this.currentOptions.showUvGuide) {
      renderUvGuide(ctx, width, height)
    }

    // Beri sinyal ke Three.js untuk update GPU texture
    this.texture.needsUpdate = true
  }

  public dispose() {
    this.texture.dispose()
  }
}

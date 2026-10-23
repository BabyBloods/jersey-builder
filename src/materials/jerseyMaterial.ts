/**
 * materials/jerseyMaterial.ts — Pengelola Material Jersey
 * Menerapkan spesifikasi bahan (Milano, Emboss, Microcool) ke mesh jersey
 * dengan live-update normal map, roughness, metalness, dan normalScale.
 *
 * Dua mode operasi:
 * 1. Placeholder mode: applyToMeshes() — mengganti material dengan bodyMaterial custom
 * 2. GLB mode: trackGlbMaterial() — mempertahankan material GLB asli (dengan baked normal/AO)
 *    dan hanya meng-inject warna/diffuse/bahan ke slot yang relevan
 */

import * as THREE from 'three'
import type { JerseyMeshes } from '../model/placeholder'
import {
  BAHAN_SPECS,
  getBahanNormalTexture,
  type BahanType,
} from './normalMaps'

export interface MaterialOptions {
  bahan: BahanType
  baseColor?: string
  diffuseMap?: THREE.Texture | null
  embossStrength?: number // 0.1 - 3.0, default 1.0
  textureScale?: number   // 0.5 - 2.5, default 1.0
  kerahVisible?: boolean
  tipeKerah?: 'ribbon' | 'vneck'
  lenganPanjangVisible?: boolean
}

export interface JerseyMaterialManager {
  applyToMeshes: (meshes: JerseyMeshes) => void
  applyToMesh: (mesh: THREE.Mesh) => void
  /** Expose underlying MeshPhysicalMaterial untuk placeholder */
  getBodyMaterial: () => THREE.MeshPhysicalMaterial
  /** Expose collar material untuk sinkronisasi material kerah */
  getCollarMaterial: () => THREE.MeshStandardMaterial
  /**
   * Track mesh GLB dan material aslinya.
   * Dalam mode ini, hanya color/diffuse yang diinjeksi ke glbMat.
   * Normal map baked dan AO map GLB DIPERTAHANKAN.
   */
  trackActiveMesh: (mesh: THREE.Mesh) => void
  untrackActiveMesh: () => void
  updateOptions: (options: Partial<MaterialOptions>) => void
  dispose: () => void
}

/**
 * Buat instance pengelola material jersey
 */
export function createJerseyMaterialManager(initialOptions: MaterialOptions): JerseyMaterialManager {
  let currentOptions: MaterialOptions = {
    embossStrength: 1.0,
    textureScale: 1.0,
    kerahVisible: true,
    baseColor: '#1B2A41',
    ...initialOptions,
  }

  // Material untuk badan dan lengan (placeholder mode)
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(currentOptions.baseColor),
    roughness: 0.85,
    metalness: 0.0,
    clearcoat: 0.0,
    clearcoatRoughness: 0.2,
    side: THREE.DoubleSide,
    shadowSide: THREE.DoubleSide,
  })

  // Material khusus kerah (rib collar)
  const collarMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#0F1E30'),
    roughness: 0.92,
    metalness: 0.0,
    side: THREE.DoubleSide,
  })

  let targetMeshes: JerseyMeshes | null = null
  // GLB mode state
  let glbMat: THREE.MeshStandardMaterial | null = null

  function applyConfig() {
    const spec = BAHAN_SPECS[currentOptions.bahan]

    // ── Placeholder mode: update bodyMaterial ──
    if (currentOptions.diffuseMap) {
      bodyMaterial.map = currentOptions.diffuseMap
      bodyMaterial.color.set(0xffffff)
    } else {
      bodyMaterial.map = null
      bodyMaterial.color.set(currentOptions.baseColor ?? '#1B2A41')
    }
    bodyMaterial.roughness = spec.roughness
    bodyMaterial.metalness = spec.metalness
    bodyMaterial.clearcoat = spec.clearcoat ?? 0.0

    // Normal map untuk placeholder
    const normalTexture = getBahanNormalTexture(currentOptions.bahan)
    const scale = currentOptions.textureScale ?? 1.0
    normalTexture.repeat.set(spec.defaultRepeat[0] * scale, spec.defaultRepeat[1] * scale)
    const strengthMultiplier = currentOptions.bahan === 'emboss'
      ? (currentOptions.embossStrength ?? 1.0)
      : 1.0
    const finalStrength = spec.normalScale * strengthMultiplier
    bodyMaterial.normalMap = normalTexture
    bodyMaterial.normalScale.set(finalStrength, finalStrength)
    bodyMaterial.needsUpdate = true

    // Update visibilitas kerah & lengan di placeholder
    if (targetMeshes) {
      targetMeshes.collar.visible = currentOptions.kerahVisible ?? true
      const isLong = !!currentOptions.lenganPanjangVisible
      if (targetMeshes.sleeve_l_long && targetMeshes.sleeve_r_long) {
        targetMeshes.sleeve_l.visible = !isLong
        targetMeshes.sleeve_r.visible = !isLong
        targetMeshes.sleeve_l_long.visible = isLong
        targetMeshes.sleeve_r_long.visible = isLong
      }
    }

    // Kerah normal map & warna yang harmonis dengan jersey
    const collarNormal = getBahanNormalTexture('milano')
    collarNormal.repeat.set(30, 30)
    collarMaterial.normalMap = collarNormal
    collarMaterial.normalScale.set(0.8, 0.8)
    const baseCol = new THREE.Color(currentOptions.baseColor ?? '#1B2A41')
    if (currentOptions.tipeKerah === 'vneck') {
      // Kerah polo v-neck: warna rapi sedikit lebih kontras elegan
      baseCol.offsetHSL(0, 0.04, -0.05)
    } else {
      // Kerah ribbon bulat: rib elastis sedikit lebih pekat
      baseCol.offsetHSL(0, -0.04, -0.10)
    }
    collarMaterial.color.copy(baseCol)
    collarMaterial.roughness = spec.roughness
    collarMaterial.side = THREE.DoubleSide
    collarMaterial.needsUpdate = true

    // ── GLB mode: inject warna/diffuse ke material GLB asli ──
    if (glbMat) {
      if (currentOptions.diffuseMap) {
        glbMat.map = currentOptions.diffuseMap
        glbMat.color.set(0xffffff)
      } else {
        glbMat.map = null
        glbMat.color.set(currentOptions.baseColor ?? '#1B2A41')
      }
      // Sesuaikan roughness/metalness dan normal map sesuai bahan (Milano, Emboss, Microcool)
      glbMat.roughness = spec.roughness
      glbMat.metalness = spec.metalness
      glbMat.normalMap = normalTexture
      glbMat.normalScale.set(finalStrength, finalStrength)
      glbMat.needsUpdate = true
    }
  }

  // Jalankan konfigurasi awal
  applyConfig()

  return {
    applyToMeshes(meshes: JerseyMeshes) {
      targetMeshes = meshes

      meshes.body.material = bodyMaterial
      meshes.sleeve_l.material = bodyMaterial
      meshes.sleeve_r.material = bodyMaterial
      if (meshes.sleeve_l_long) meshes.sleeve_l_long.material = bodyMaterial
      if (meshes.sleeve_r_long) meshes.sleeve_r_long.material = bodyMaterial
      meshes.collar.material = collarMaterial

      applyConfig()
    },

    applyToMesh(mesh: THREE.Mesh) {
      mesh.material = bodyMaterial
      applyConfig()
    },

    getBodyMaterial() {
      return bodyMaterial
    },

    getCollarMaterial() {
      return collarMaterial
    },

    trackActiveMesh(mesh: THREE.Mesh) {
      targetMeshes = null // Nonaktifkan placeholder sepenuhnya saat GLB aktif
      // Ambil material GLB aslinya (MeshStandardMaterial dengan normal map baked)
      const mat = mesh.material
      if (!Array.isArray(mat) && (mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
        glbMat = mat as THREE.MeshStandardMaterial
        // JANGAN replace mesh.material — pertahankan material GLB asli
        applyConfig()
      } else {
        // Fallback: jika bukan MeshStandardMaterial, ganti dengan bodyMaterial kita
        mesh.material = bodyMaterial
        applyConfig()
      }
    },

    untrackActiveMesh() {
      glbMat = null
    },

    updateOptions(newOptions: Partial<MaterialOptions>) {
      currentOptions = { ...currentOptions, ...newOptions }
      applyConfig()
    },

    dispose() {
      bodyMaterial.dispose()
      collarMaterial.dispose()
      targetMeshes = null
      glbMat = null
    },
  }
}

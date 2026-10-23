/**
 * ui/Viewer.tsx — Komponen canvas 3D viewer
 * Mount engine Three.js ke canvas via useRef + useEffect.
 * Memuat shirt_baked.glb sebagai model utama dengan fallback ke placeholder.
 * Mengelola rendering material, environment map, latar custom, kerah, dan lengan panjang.
 */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import {
  applyBackground,
  DEFAULT_LATAR_CONFIG,
  type LatarConfig,
} from '../engine/background'
import { initCamera, type CameraContext, type CameraPreset } from '../engine/camera'
import { initLighting } from '../engine/lighting'
import { createRenderLoop } from '../engine/loop'
import { initScene } from '../engine/scene'
import {
  createJerseyMaterialManager,
  type JerseyMaterialManager,
} from '../materials/jerseyMaterial'
import type { BahanType } from '../materials/normalMaps'

export interface ViewerEngineExportContext {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  materialManager: JerseyMaterialManager
  cameraCtx: CameraContext
}

interface ViewerProps {
  /** Ref untuk memanggil goToPreset dari luar */
  onCameraReady?: (goTo: (preset: CameraPreset) => void) => void
  /** Expose engine context untuk screenshot, turntable, dan export paket listing */
  onEngineReady?: (ctx: ViewerEngineExportContext) => void
  /** Konfigurasi latar custom (polos, gradasi, gambar, transparan) */
  latarConfig?: LatarConfig
  /** Tekstur motif gabungan (diffuse map) */
  diffuseMap?: THREE.Texture | null
  /** Jenis bahan aktif (Milano, Emboss, Microcool) */
  bahan?: BahanType
  /** Kekuatan emboss (0.1 - 3.0) */
  embossStrength?: number
  /** Skala tekstur kain (0.5 - 2.5) */
  textureScale?: number
  /** Status kerah terpasang atau dilepas */
  kerah?: boolean
  /** Tipe kerah jersey: ribbon atau vneck */
  tipeKerah?: 'ribbon' | 'vneck'
  /** Status lengan panjang aktif atau pendek */
  lenganPanjang?: boolean
  /** Warna dasar jersey */
  baseColor?: string
  /** Status turntable aktif berputar 360° */
  isTurntableActive?: boolean
}

/**
 * Buat environment map studio dari scene kotak 6 sisi menggunakan PMREMGenerator.
 * Menghasilkan refleksi kain yang natural untuk PBR material.
 */
function createStudioEnvMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer)
  pmrem.compileEquirectangularShader()

  const envScene = new THREE.Scene()

  const makePanel = (color: number, pos: [number, number, number], rotX: number, rotY = 0) => {
    const geo = new THREE.PlaneGeometry(20, 20)
    const mat = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(...pos)
    mesh.rotation.x = rotX
    mesh.rotation.y = rotY
    envScene.add(mesh)
  }

  makePanel(0xfff8f0, [0, 8, 0], Math.PI / 2)        // Atas — warm white
  makePanel(0x232832, [0, -8, 0], -Math.PI / 2)       // Bawah — dark grey
  makePanel(0xd8e0f0, [0, 0, -8], 0)                  // Depan — cool light
  makePanel(0x3a4050, [0, 0, 8], Math.PI)             // Belakang — dark
  makePanel(0xc8d8f0, [-8, 0, 0], 0, Math.PI / 2)     // Kiri — cool blue
  makePanel(0x454e60, [8, 0, 0], 0, -Math.PI / 2)     // Kanan — slate

  const envRT = pmrem.fromScene(envScene)
  pmrem.dispose()
  return envRT.texture
}

interface LoadedModelInfo {
  root: THREE.Object3D
  shirtMesh: THREE.Mesh
  origPositions: THREE.BufferAttribute
  components: GlbComponents
}

interface GlbComponents {
  collarRib: Set<number>
}

/**
 * Klasifikasi komponen kerah rib bawaan GLB (421 vertex leher).
 */
function classifyGlbComponents(mesh: THREE.Mesh): GlbComponents {
  const geom = mesh.geometry
  const pos = geom.attributes.position
  const count = pos.count
  const index = geom.index
  if (!index) return { collarRib: new Set() }

  const indices = index.array
  const adj: number[][] = Array.from({ length: count }, () => [])
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i]
    const b = indices[i + 1]
    const c = indices[i + 2]
    adj[a].push(b, c)
    adj[b].push(a, c)
    adj[c].push(a, b)
  }

  const visited = new Set<number>()
  let collarComponent = new Set<number>()

  for (let i = 0; i < count; i++) {
    if (!visited.has(i)) {
      const comp = new Set<number>()
      const q = [i]
      visited.add(i)
      let isCollar = true
      while (q.length > 0) {
        const u = q.pop()!
        comp.add(u)
        const y = pos.getY(u)
        const x = pos.getX(u)
        if (y < 0.19 || Math.abs(x) > 0.09) isCollar = false
        for (const n of adj[u]) {
          if (!visited.has(n)) {
            visited.add(n)
            q.push(n)
          }
        }
      }
      if (isCollar && comp.size > 200 && comp.size < 600) {
        collarComponent = comp
        break
      }
    }
  }

  return { collarRib: collarComponent }
}

/**
 * Deformasi presisi pada mesh jersey asli:
 * - 'ribbon': Menggunakan kerah pita rib knit bulat bawaan GLB yang sempurna (tanpa celah/jahitan terpisah).
 * - 'vneck' : Membentuk bukaan kerah V-Neck atletis yang tajam dan rapi di dada depan
 *             secara mulus langsung pada geometri jersey tanpa celah/mesh terpisah.
 * - tanpa kerah: Meratakan pita rib mengikuti keliling leher polos.
 */
function applyJerseyDeformations(
  mesh: THREE.Mesh,
  origPos: THREE.BufferAttribute,
  components: GlbComponents,
  _isLong: boolean,
  kerah: boolean,
  tipeKerah: 'ribbon' | 'vneck',
) {
  const pos = mesh.geometry.attributes.position
  const count = pos.count

  for (let i = 0; i < count; i++) {
    let x = origPos.getX(i)
    let y = origPos.getY(i)
    let z = origPos.getZ(i)

    if (!kerah) {
      // Tanpa kerah: ratakan rib leher mengikuti keliling leher jersey polos
      if (components.collarRib.has(i)) {
        y = Math.min(y, 0.215)
      }
    } else if (tipeKerah === 'vneck') {
      // V-Neck atletis bersih (Gambar 3): lekukan V rapi hanya pada rim kerah & bibir leher depan,
      // TANPA merusak atau membuat kawah/dent pada kain dada
      if (z > 0.048 && Math.abs(x) < 0.050 && y >= 0.198 && y < 0.235) {
        const vFactor = Math.max(0, 1.0 - Math.abs(x) / 0.048)
        const dip = Math.pow(vFactor, 1.1) * 0.013 // Dip anggun 1.3cm di pusat
        y -= dip
        z -= vFactor * 0.003
      }
    }

    pos.setXYZ(i, x, y, z)
  }

  pos.needsUpdate = true
  mesh.geometry.computeVertexNormals()
}

export function Viewer({
  onCameraReady,
  onEngineReady,
  latarConfig = DEFAULT_LATAR_CONFIG,
  diffuseMap,
  bahan = 'milano',
  embossStrength = 1.0,
  textureScale = 1.0,
  kerah = true,
  tipeKerah = 'ribbon',
  lenganPanjang = false,
  baseColor,
  isTurntableActive = false,
}: ViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const materialManagerRef = useRef<JerseyMaterialManager | null>(null)
  const activeCameraCtxRef = useRef<CameraContext | null>(null)
  const shirtMeshRef = useRef<THREE.Mesh | null>(null)
  const origPositionsRef = useRef<THREE.BufferAttribute | null>(null)
  const glbComponentsRef = useRef<GlbComponents | null>(null)
  const isMountedRef = useRef<boolean>(true)
  const envMapRef = useRef<THREE.Texture | null>(null)

  // Cache 2 model GLB terpisah (Lengan Pendek: shirt_baked.glb & Lengan Panjang: shirt_long_sleeve.glb)
  const modelsCacheRef = useRef<Map<'short' | 'long', LoadedModelInfo>>(new Map())
  const activeModelKeyRef = useRef<'short' | 'long' | null>(null)

  // Ref props terkini agar loader asynchronous selalu mendapatkan state terbaru
  const propsRef = useRef({
    bahan,
    diffuseMap,
    embossStrength,
    textureScale,
    kerah,
    tipeKerah,
    lenganPanjang,
    baseColor,
  })
  propsRef.current = {
    bahan,
    diffuseMap,
    embossStrength,
    textureScale,
    kerah,
    tipeKerah,
    lenganPanjang,
    baseColor,
  }

  const engineRef = useRef<{
    dispose: () => void
    stopLoop: () => void
  } | null>(null)

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Fungsi ganti model 3D aktif (Lengan Pendek vs Lengan Panjang)
  const activateModel = (key: 'short' | 'long') => {
    const scene = sceneRef.current
    const matManager = materialManagerRef.current
    if (!scene || !matManager) return

    // Bersihkan SEMUA objek jersey & placeholder lama di scene agar tidak pernah bertabrakan
    const toRemove: THREE.Object3D[] = []
    scene.children.forEach((child) => {
      if (child.name && (child.name.startsWith('jersey-') || child.name === 'collar')) {
        toRemove.push(child)
      }
    })
    toRemove.forEach((child) => scene.remove(child))

    const model = modelsCacheRef.current.get(key)
    if (!model) return

    activeModelKeyRef.current = key
    scene.add(model.root)
    shirtMeshRef.current = model.shirtMesh
    origPositionsRef.current = model.origPositions
    glbComponentsRef.current = model.components

    matManager.trackActiveMesh(model.shirtMesh)

    applyJerseyDeformations(
      model.shirtMesh,
      model.origPositions,
      model.components,
      key === 'long',
      !!propsRef.current.kerah,
      propsRef.current.tipeKerah ?? 'ribbon',
    )
  }

  // Fungsi memuat file GLB ke dalam cache
  const loadAndCacheModel = (key: 'short' | 'long', onLoaded?: () => void) => {
    if (modelsCacheRef.current.has(key)) {
      onLoaded?.()
      return
    }

    const url = key === 'long' ? '/shirt_long_sleeve.glb' : '/shirt_baked.glb'
    const gltfLoader = new GLTFLoader()

    gltfLoader.load(
      url,
      (gltf) => {
        if (!isMountedRef.current) {
          gltf.scene.traverse((obj) => {
            if (obj instanceof THREE.Mesh) obj.geometry?.dispose()
          })
          return
        }

        const shirtMesh = (
          gltf.scene.getObjectByName('T_Shirt_male') ??
          gltf.scene.children.find((c) => c instanceof THREE.Mesh)
        ) as THREE.Mesh | undefined

        if (!shirtMesh || !(shirtMesh instanceof THREE.Mesh)) {
          console.warn(`[Viewer] Mesh utama tidak ditemukan di ${url}`)
          return
        }

        const origPos = shirtMesh.geometry.attributes.position.clone()
        const components = classifyGlbComponents(shirtMesh)

        // Setup material & environment map
        const glbMat = shirtMesh.material as THREE.MeshStandardMaterial
        if (glbMat && glbMat.isMeshStandardMaterial && envMapRef.current) {
          glbMat.envMap = envMapRef.current
          glbMat.envMapIntensity = 0.4
          glbMat.needsUpdate = true
        }

        gltf.scene.name = `jersey-root-${key}`
        gltf.scene.scale.set(1.55, 1.55, 1.55)
        gltf.scene.position.set(0, 0.07, 0)
        shirtMesh.castShadow = true
        shirtMesh.receiveShadow = true

        applyJerseyDeformations(
          shirtMesh,
          origPos,
          components,
          key === 'long',
          !!propsRef.current.kerah,
          propsRef.current.tipeKerah ?? 'ribbon',
        )

        const info: LoadedModelInfo = {
          root: gltf.scene,
          shirtMesh,
          origPositions: origPos,
          components,
        }

        modelsCacheRef.current.set(key, info)
        onLoaded?.()
      },
      undefined,
      (err) => {
        console.warn(`[Viewer] Gagal memuat ${url}:`, err)
      },
    )
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    isMountedRef.current = true

    // --- Inisialisasi engine ---
    const sceneCtx = initScene(canvas)
    sceneRef.current = sceneCtx.scene
    rendererRef.current = sceneCtx.renderer
    const cameraCtx = initCamera(canvas, sceneCtx.scene)
    initLighting(sceneCtx.scene)

    // ── Environment map studio untuk PBR refleksi realistis ──
    const envMap = createStudioEnvMap(sceneCtx.renderer)
    envMapRef.current = envMap
    sceneCtx.scene.environment = envMap

    // Terapkan latar awal
    applyBackground(sceneCtx.scene, sceneCtx.renderer, latarConfig)

    // ── Material manager (untuk update warna/bahan live) ──
    const matManager = createJerseyMaterialManager({
      bahan: propsRef.current.bahan,
      diffuseMap: propsRef.current.diffuseMap,
      embossStrength: propsRef.current.embossStrength,
      textureScale: propsRef.current.textureScale,
      kerahVisible: propsRef.current.kerah,
      tipeKerah: propsRef.current.tipeKerah,
      lenganPanjangVisible: propsRef.current.lenganPanjang,
      baseColor: propsRef.current.baseColor,
    })
    materialManagerRef.current = matManager

    // ── Load model awal (lengan pendek / lengan panjang sesuai props) ──
    const initialKey: 'short' | 'long' = propsRef.current.lenganPanjang ? 'long' : 'short'
    loadAndCacheModel(initialKey, () => {
      activateModel(initialKey)
    })

    // Preload model satunya di latar belakang agar pergantian lengan instan 0ms!
    const otherKey: 'short' | 'long' = initialKey === 'short' ? 'long' : 'short'
    loadAndCacheModel(otherKey)

    // Buat dan mulai render loop
    const loop = createRenderLoop(sceneCtx.renderer, sceneCtx.scene, cameraCtx, canvas)
    loop.start()

    onCameraReady?.((preset) => cameraCtx.goToPreset(preset, reducedMotion))
    activeCameraCtxRef.current = cameraCtx

    onEngineReady?.({
      renderer: sceneCtx.renderer,
      scene: sceneCtx.scene,
      camera: cameraCtx.camera,
      materialManager: matManager,
      cameraCtx,
    })

    engineRef.current = {
      dispose: () => {
        matManager.dispose()
        sceneCtx.dispose()
        cameraCtx.dispose()
        envMap.dispose()
      },
      stopLoop: loop.stop,
    }

    return () => {
      isMountedRef.current = false
      loop.stop()
      matManager.untrackActiveMesh()
      matManager.dispose()

      modelsCacheRef.current.forEach((model) => {
        sceneCtx.scene.remove(model.root)
        model.root.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose()
          }
        })
      })
      modelsCacheRef.current.clear()
      activeModelKeyRef.current = null

      sceneCtx.dispose()
      cameraCtx.dispose()
      envMap.dispose()
      activeCameraCtxRef.current = null
      shirtMeshRef.current = null
      origPositionsRef.current = null
      glbComponentsRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update turntable
  useEffect(() => {
    activeCameraCtxRef.current?.setTurntable(!!isTurntableActive)
  }, [isTurntableActive])

  // Update material & visibilitas live saat bahan/warna/diffuse/kerah/lengan berubah
  useEffect(() => {
    materialManagerRef.current?.updateOptions({
      bahan,
      diffuseMap,
      embossStrength,
      textureScale,
      kerahVisible: kerah,
      tipeKerah,
      lenganPanjangVisible: lenganPanjang,
      baseColor,
    })

    // Ganti model 3D antara Lengan Pendek vs Lengan Panjang jika berubah
    const targetKey: 'short' | 'long' = lenganPanjang ? 'long' : 'short'
    if (activeModelKeyRef.current !== targetKey) {
      if (modelsCacheRef.current.has(targetKey)) {
        activateModel(targetKey)
      } else {
        loadAndCacheModel(targetKey, () => {
          activateModel(targetKey)
        })
      }
    } else {
      if (shirtMeshRef.current && origPositionsRef.current && glbComponentsRef.current) {
        applyJerseyDeformations(
          shirtMeshRef.current,
          origPositionsRef.current,
          glbComponentsRef.current,
          targetKey === 'long',
          !!kerah,
          tipeKerah ?? 'ribbon',
        )
      }
    }
  }, [bahan, diffuseMap, embossStrength, textureScale, kerah, tipeKerah, lenganPanjang, baseColor])

  // Update latar
  useEffect(() => {
    if (sceneRef.current && rendererRef.current) {
      applyBackground(sceneRef.current, rendererRef.current, latarConfig)
    }
  }, [latarConfig])

  const isTransparent = latarConfig.tipe === 'transparan'

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundImage: isTransparent
          ? 'linear-gradient(45deg, #161a1f 25%, transparent 25%), linear-gradient(-45deg, #161a1f 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #161a1f 75%), linear-gradient(-45deg, transparent 75%, #161a1f 75%)'
          : 'none',
        backgroundSize: isTransparent ? '20px 20px' : 'auto',
        backgroundPosition: isTransparent ? '0 0, 0 10px, 10px -10px, -10px 0px' : 'auto',
        backgroundColor: isTransparent ? '#0d0f12' : 'transparent',
      }}
    >
      <canvas
        ref={canvasRef}
        id="viewer-canvas"
        aria-label="Preview jersey 3D. Gunakan mouse atau sentuhan untuk memutar, zoom, dan pan."
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      />
    </div>
  )
}

/**
 * App.tsx — Root aplikasi Nemesis3D
 * Layout utama: Header (atas) | ControlPanel (kiri) + Viewer + CameraPresets (tengah-kanan)
 * Mengelola state desain, Undo/Redo, IndexedDB autosave, dan simpan/muat JSON.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import './index.css'
import type { LatarConfig } from './engine/background'
import type { CameraPreset } from './engine/camera'
import { exportListingPack } from './export/listingPack'
import { downloadScreenshot, type ScreenshotResolution } from './export/screenshot'
import { triggerDownload } from './export/zip'
import type { BahanType } from './materials/normalMaps'
import type { LayerParams } from './patterns/generators'
import { HistoryStack } from './state/history'
import {
  deleteDraftFromDb,
  getAllDraftsFromDb,
  renameDraftInDb,
  saveDraftToDb,
  type DraftItem,
} from './state/indexedDb'
import {
  DEFAULT_DESIGN,
  imageToDataUrl,
  loadImageFromUrl,
  validateDesignJson,
  type JerseyDesignSchema,
} from './state/schema'
import type { LogoConfig } from './texture/logoLayer'
import {
  TextureCompositor,
  type ImageTransform,
  type TextureMode,
} from './texture/textureCompositor'
import { CameraPresets } from './ui/CameraPresets'
import { ControlPanel, type ExportProgressState } from './ui/ControlPanel'
import { DraftsModal } from './ui/DraftsModal'
import { Header, type Step } from './ui/Header'
import { TemplateGallery } from './ui/TemplateGallery'
import { ValidationPanel } from './ui/ValidationPanel'
import { Viewer, type ViewerEngineExportContext } from './ui/Viewer'
import { decodeShareUrlToDesign } from './state/shareLink'
import { exportTurntableVideo, type VideoResolutionPreset } from './export/turntableVideo'
import { runBatchProcessing, type BatchItemProgress } from './batch/batchProcessor'
import { BatchExportModal } from './ui/BatchExportModal'

export default function App() {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [activePreset, setActivePreset] = useState<CameraPreset>('depan')

  // State Identitas Desain
  const [designId, setDesignId] = useState<string>(DEFAULT_DESIGN.id)
  const [namaDesain, setNamaDesain] = useState<string>(DEFAULT_DESIGN.nama_desain)
  const [templateId, setTemplateId] = useState<string>(DEFAULT_DESIGN.template_id)

  // State Bahan & Model
  const [bahan, setBahan] = useState<BahanType>(DEFAULT_DESIGN.bahan)
  const [embossStrength, setEmbossStrength] = useState<number>(1.2)
  const [textureScale, setTextureScale] = useState<number>(1.0)
  const [kerah, setKerah] = useState<boolean>(DEFAULT_DESIGN.kerah)
  const [tipeKerah, setTipeKerah] = useState<'ribbon' | 'vneck'>(DEFAULT_DESIGN.tipe_kerah ?? 'ribbon')
  const [lenganPanjang, setLenganPanjang] = useState<boolean>(DEFAULT_DESIGN.lengan_panjang ?? false)

  // State Warna & Motif
  const [textureMode, setTextureMode] = useState<TextureMode>(DEFAULT_DESIGN.mode_tekstur || 'template')
  const [warnaDasar, setWarnaDasar] = useState<string>(DEFAULT_DESIGN.warna_dasar)
  const [layers, setLayers] = useState<LayerParams[]>(DEFAULT_DESIGN.layers)
  const [importedImage, setImportedImage] = useState<HTMLImageElement | null>(null)
  const [imageTransform, setImageTransform] = useState<ImageTransform>(
    DEFAULT_DESIGN.transform_gambar || { scale: 1.0, offsetX: 0, offsetY: 0, rotation: 0, mirror: false },
  )
  const [showUvGuide, setShowUvGuide] = useState<boolean>(false)

  // State Logo & Latar
  const [logoConfig, setLogoConfig] = useState<LogoConfig>({
    image: null,
    posisi: 'dada-kiri',
    ukuran: 0.15,
    offset: [0, 0],
  })
  const [latarConfig, setLatarConfig] = useState<LatarConfig>({
    tipe: DEFAULT_DESIGN.latar.tipe,
    warna1: DEFAULT_DESIGN.latar.warna1,
    warna2: DEFAULT_DESIGN.latar.warna2,
    sudut: DEFAULT_DESIGN.latar.sudut,
    gambar: null,
  })

  // State Modal & Export
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false)
  const [draftsList, setDraftsList] = useState<DraftItem[]>([])
  const [autosaveStatus, setAutosaveStatus] = useState<string>('')
  const [exportProgress, setExportProgress] = useState<ExportProgressState>({
    active: false,
    step: '',
    percent: 0,
  })

  // State Video 360 & Batch Processing (Tahap 7)
  const [isTurntableActive, setIsTurntableActive] = useState<boolean>(false)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false)
  const [batchProgress, setBatchProgress] = useState<BatchItemProgress | null>(null)
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false)
  const batchCancelRef = useRef<boolean>(false)
  const [videoExportProgress, setVideoExportProgress] = useState<{
    active: boolean
    status: string
    percent: number
  }>({
    active: false,
    status: '',
    percent: 0,
  })

  // Refs
  const jsonFileInputRef = useRef<HTMLInputElement>(null)
  const compositorRef = useRef<TextureCompositor | null>(null)
  const [diffuseMap, setDiffuseMap] = useState<THREE.Texture | null>(null)
  const goToPresetRef = useRef<((preset: CameraPreset) => void) | null>(null)
  const engineContextRef = useRef<ViewerEngineExportContext | null>(null)

  // History Stack untuk Undo/Redo
  const historyRef = useRef(new HistoryStack<JerseyDesignSchema>(30))
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const updateHistoryStatus = useCallback(() => {
    setCanUndo(historyRef.current.canUndo())
    setCanRedo(historyRef.current.canRedo())
  }, [])

  // Fungsi mengumpulkan snapshot state desain saat ini ke skema JSON
  const getCurrentDesignSnapshot = useCallback((): JerseyDesignSchema => {
    return {
      id: designId,
      template_id: templateId,
      nama_desain: namaDesain,
      bahan,
      kerah,
      tipe_kerah: tipeKerah,
      lengan_panjang: lenganPanjang,
      warna_dasar: warnaDasar,
      layers,
      mode_tekstur: textureMode,
      gambar_import: importedImage ? imageToDataUrl(importedImage) : null,
      transform_gambar: imageTransform,
      logo: logoConfig.image
        ? {
            dataUrl: imageToDataUrl(logoConfig.image),
            posisi: logoConfig.posisi,
            ukuran: logoConfig.ukuran,
            offset: logoConfig.offset,
          }
        : null,
      latar: {
        tipe: latarConfig.tipe,
        warna1: latarConfig.warna1,
        warna2: latarConfig.warna2,
        sudut: latarConfig.sudut,
        gambarDataUrl: latarConfig.gambar ? imageToDataUrl(latarConfig.gambar) : null,
      },
      output: { resolusi: 2048 },
    }
  }, [
    designId,
    templateId,
    namaDesain,
    bahan,
    kerah,
    tipeKerah,
    lenganPanjang,
    warnaDasar,
    layers,
    textureMode,
    importedImage,
    imageTransform,
    logoConfig,
    latarConfig,
  ])

  // Terapkan skema desain ke dalam state React
  const applyDesignSchema = useCallback(
    async (schema: JerseyDesignSchema, recordHistory = true) => {
      if (recordHistory) {
        historyRef.current.push(getCurrentDesignSnapshot())
        updateHistoryStatus()
      }

      setDesignId(schema.id)
      setTemplateId(schema.template_id)
      setNamaDesain(schema.nama_desain)
      setBahan(schema.bahan)
      setKerah(schema.kerah)
      setTipeKerah(schema.tipe_kerah ?? 'ribbon')
      setLenganPanjang(schema.lengan_panjang ?? false)
      setWarnaDasar(schema.warna_dasar)
      setLayers(schema.layers)
      setTextureMode(schema.mode_tekstur || 'template')
      if (schema.transform_gambar) setImageTransform(schema.transform_gambar)

      // Muat gambar import jika ada
      if (schema.gambar_import) {
        try {
          const img = await loadImageFromUrl(schema.gambar_import)
          setImportedImage(img)
        } catch {
          setImportedImage(null)
        }
      } else {
        setImportedImage(null)
      }

      // Muat logo jika ada
      if (schema.logo) {
        let logoImg: HTMLImageElement | null = null
        if (schema.logo.dataUrl) {
          try {
            logoImg = await loadImageFromUrl(schema.logo.dataUrl)
          } catch {
            logoImg = null
          }
        }
        setLogoConfig({
          image: logoImg,
          posisi: schema.logo.posisi || 'dada-kiri',
          ukuran: schema.logo.ukuran ?? 0.15,
          offset: schema.logo.offset || [0, 0],
        })
      } else {
        setLogoConfig({
          image: null,
          posisi: 'dada-kiri',
          ukuran: 0.15,
          offset: [0, 0],
        })
      }

      // Terapkan latar
      if (schema.latar) {
        let latarImg: HTMLImageElement | null = null
        if (schema.latar.gambarDataUrl) {
          try {
            latarImg = await loadImageFromUrl(schema.latar.gambarDataUrl)
          } catch {
            latarImg = null
          }
        }
        setLatarConfig({
          tipe: schema.latar.tipe,
          warna1: schema.latar.warna1,
          warna2: schema.latar.warna2,
          sudut: schema.latar.sudut,
          gambar: latarImg,
        })
      }
    },
    [getCurrentDesignSnapshot, updateHistoryStatus],
  )

  // Undo Handler
  const handleUndo = useCallback(() => {
    const current = getCurrentDesignSnapshot()
    const prev = historyRef.current.undo(current)
    if (prev) {
      applyDesignSchema(prev, false)
      updateHistoryStatus()
    }
  }, [getCurrentDesignSnapshot, applyDesignSchema, updateHistoryStatus])

  // Redo Handler
  const handleRedo = useCallback(() => {
    const current = getCurrentDesignSnapshot()
    const next = historyRef.current.redo(current)
    if (next) {
      applyDesignSchema(next, false)
      updateHistoryStatus()
    }
  }, [getCurrentDesignSnapshot, applyDesignSchema, updateHistoryStatus])

  // Keyboard shortcut listener (Ctrl+Z & Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
        e.preventDefault()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        handleRedo()
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  // Decode share link dari URL hash saat pertama mount
  useEffect(() => {
    const shared = decodeShareUrlToDesign()
    if (shared) {
      const merged: JerseyDesignSchema = {
        ...DEFAULT_DESIGN,
        id: shared.id || DEFAULT_DESIGN.id,
        template_id: shared.template_id || DEFAULT_DESIGN.template_id,
        nama_desain: shared.nama_desain || DEFAULT_DESIGN.nama_desain,
        bahan: (shared.bahan as JerseyDesignSchema['bahan']) || DEFAULT_DESIGN.bahan,
        kerah: typeof shared.kerah === 'boolean' ? shared.kerah : DEFAULT_DESIGN.kerah,
        warna_dasar: shared.warna_dasar || DEFAULT_DESIGN.warna_dasar,
        layers: shared.layers || DEFAULT_DESIGN.layers,
        mode_tekstur: (shared.mode_tekstur as JerseyDesignSchema['mode_tekstur']) || 'template',
        transform_gambar: shared.transform_gambar || DEFAULT_DESIGN.transform_gambar,
        gambar_import: null,
        logo: null,
        latar: {
          tipe: (shared.latar?.tipe as JerseyDesignSchema['latar']['tipe']) || 'gradasi',
          warna1: shared.latar?.warna1 || DEFAULT_DESIGN.latar.warna1,
          warna2: shared.latar?.warna2 || DEFAULT_DESIGN.latar.warna2,
          sudut: shared.latar?.sudut ?? DEFAULT_DESIGN.latar.sudut,
        },
      }
      applyDesignSchema(merged, false)
      setCurrentStep(2)
      // Hapus hash dari URL setelah di-decode
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Inisialisasi dan refresh daftar draft dari IndexedDB
  const refreshDrafts = useCallback(async () => {
    try {
      const list = await getAllDraftsFromDb()
      setDraftsList(list)
    } catch (e) {
      console.warn('Gagal memuat drafts dari IndexedDB', e)
    }
  }, [])

  useEffect(() => {
    let active = true
    getAllDraftsFromDb()
      .then((list) => {
        if (active) setDraftsList(list)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  // Autosave ke IndexedDB berkala (Debounced 1500ms)
  useEffect(() => {
    const timer = setTimeout(async () => {
      const snapshot = getCurrentDesignSnapshot()
      try {
        await saveDraftToDb({
          id: snapshot.id || 'autosave_latest',
          template_id: snapshot.template_id,
          nama_desain: snapshot.nama_desain,
          updatedAt: Date.now(),
          design: snapshot,
        })
        const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        setAutosaveStatus(`Draft tersimpan ${timeStr}`)
        refreshDrafts()
      } catch (e) {
        console.warn('Gagal autosave ke IndexedDB', e)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [getCurrentDesignSnapshot, refreshDrafts])

  // Update Three.js compositor texture setiap kali parameter visual berubah
  useEffect(() => {
    if (!compositorRef.current) {
      compositorRef.current = new TextureCompositor({
        mode: textureMode,
        warnaDasar,
        layers,
        importedImage,
        imageTransform,
        logo: logoConfig,
        showUvGuide,
        resolution: 2048,
      })
      setDiffuseMap(compositorRef.current.getTexture())
    } else {
      compositorRef.current.update({
        mode: textureMode,
        warnaDasar,
        layers,
        importedImage,
        imageTransform,
        logo: logoConfig,
        showUvGuide,
      })
      setDiffuseMap(compositorRef.current.getTexture())
    }
  }, [textureMode, warnaDasar, layers, importedImage, imageTransform, logoConfig, showUvGuide])

  // Handler Desain Baru / Reset
  const handleNewDesign = () => {
    if (confirm('Mulai desain baru dari awal? Pengaturan saat ini yang belum tersimpan akan diganti.')) {
      historyRef.current.push(getCurrentDesignSnapshot())
      applyDesignSchema(DEFAULT_DESIGN, false)
      updateHistoryStatus()
    }
  }

  // Handler Simpan JSON & Draft Manual
  const handleSaveDesign = async () => {
    const snapshot = getCurrentDesignSnapshot()

    // Ambil thumbnail dari Three.js renderer jika tersedia
    let thumbDataUrl: string | undefined
    if (engineContextRef.current) {
      try {
        const { renderer, scene, camera } = engineContextRef.current
        renderer.render(scene, camera)
        thumbDataUrl = renderer.domElement.toDataURL('image/jpeg', 0.7)
      } catch {
        thumbDataUrl = undefined
      }
    }

    // 1. Simpan ke IndexedDB
    await saveDraftToDb({
      id: snapshot.id,
      template_id: snapshot.template_id,
      nama_desain: snapshot.nama_desain,
      updatedAt: Date.now(),
      thumbnail: thumbDataUrl,
      design: snapshot,
    })
    await refreshDrafts()

    // 2. Download berkas .json
    const jsonStr = JSON.stringify(snapshot, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    triggerDownload(blob, `${snapshot.id}.json`)
    setAutosaveStatus('Tersimpan & Diunduh!')
  }

  // Handler Muat File JSON dari Komputer
  const handleJsonFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        const result = validateDesignJson(parsed)
        if (result.valid && result.data) {
          await applyDesignSchema(result.data, true)
          alert(`Desain "${result.data.nama_desain}" berhasil dimuat!`)
        } else {
          alert(`File JSON tidak valid: ${result.error}`)
        }
      } catch {
        alert('Gagal membaca file JSON. Pastikan format berkas valid.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Handler Screenshot & Export Listing Pack
  const handleCaptureScreenshot = async (res: ScreenshotResolution) => {
    const ctx = engineContextRef.current
    if (!ctx) return
    await downloadScreenshot(
      ctx.renderer,
      ctx.scene,
      ctx.camera,
      `${designId}_screenshot_${res}px.png`,
      res,
    )
  }

  const handleExportListingPack = async () => {
    const ctx = engineContextRef.current
    const comp = compositorRef.current
    if (!ctx || !comp) return

    setExportProgress({ active: true, step: 'Memulai export paket listing...', percent: 5 })
    try {
      await exportListingPack({
        renderer: ctx.renderer,
        scene: ctx.scene,
        camera: ctx.camera,
        designId,
        bahan,
        diffuseCanvas: comp.getCanvas(),
        onProgress: (step, percent) => {
          setExportProgress({ active: true, step, percent })
        },
      })
    } finally {
      setTimeout(() => {
        setExportProgress({ active: false, step: '', percent: 0 })
      }, 1200)
    }
  }

  // Handler Video 360° Turntable (Tahap 7)
  const handleExportTurntableVideo = async (
    resolusi: VideoResolutionPreset,
    durasi: number,
  ) => {
    const ctx = engineContextRef.current
    if (!ctx) return

    setVideoExportProgress({
      active: true,
      status: 'Menyiapkan perekam video 360°...',
      percent: 5,
    })

    try {
      await exportTurntableVideo({
        renderer: ctx.renderer,
        scene: ctx.scene,
        camera: ctx.camera,
        designId,
        resolusi,
        durasiDetik: durasi,
        fps: 30,
        onProgress: (status, percent) => {
          setVideoExportProgress({ active: true, status, percent })
        },
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error tidak dikenal'
      alert(`Gagal membuat video 360°: ${msg}`)
    } finally {
      setTimeout(() => {
        setVideoExportProgress({ active: false, status: '', percent: 0 })
      }, 1200)
    }
  }

  // Handler Batch Processing Massal (Tahap 7)
  const handleRunBatch = async (designs: JerseyDesignSchema[]) => {
    const ctx = engineContextRef.current
    if (!ctx || !ctx.materialManager) return

    setIsBatchRunning(true)
    batchCancelRef.current = false

    try {
      await runBatchProcessing({
        renderer: ctx.renderer,
        scene: ctx.scene,
        camera: ctx.camera,
        materialManager: ctx.materialManager,
        designs,
        onProgress: (p) => {
          setBatchProgress(p)
        },
        isCancelled: () => batchCancelRef.current,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error tidak dikenal'
      if (msg.includes('dibatalkan')) {
        alert('Batch export dibatalkan.')
      } else {
        alert(`Batch processing gagal: ${msg}`)
      }
    } finally {
      setIsBatchRunning(false)
      setTimeout(() => {
        setBatchProgress(null)
        setIsBatchModalOpen(false)
      }, 1500)
    }
  }

  // Toggle Turntable live auto-rotate
  const handleToggleTurntable = () => {
    setIsTurntableActive((prev) => !prev)
  }

  // Handler apply template dari TemplateGallery
  const handleApplyTemplate = useCallback(
    (partial: Partial<JerseyDesignSchema> & { template_id: string }) => {
      historyRef.current.push(getCurrentDesignSnapshot())
      const next: JerseyDesignSchema = {
        ...DEFAULT_DESIGN,
        ...partial,
        id: designId,
        gambar_import: null,
        logo: null,
      }
      applyDesignSchema(next, false)
      updateHistoryStatus()
    },
    [getCurrentDesignSnapshot, applyDesignSchema, updateHistoryStatus, designId],
  )

  return (
    <div
      id="app-root"
      style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}
    >
      {/* Hidden file input untuk import JSON */}
      <input
        ref={jsonFileInputRef}
        type="file"
        accept=".json"
        onChange={handleJsonFileSelect}
        style={{ display: 'none' }}
      />

      {/* Header dengan stepper, undo/redo, autosave status, dan actions */}
      <Header
        currentStep={currentStep}
        onStepClick={setCurrentStep}
        onExportClick={handleExportListingPack}
        onNewClick={handleNewDesign}
        onLoadClick={() => setIsDraftsModalOpen(true)}
        onSaveClick={handleSaveDesign}
        onUndoClick={handleUndo}
        onRedoClick={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        autosaveStatus={autosaveStatus}
      />

      {/* Body: Step-based layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Langkah 1: Galeri Template (Kiri) ── */}
        {currentStep === 1 && (
          <div
            id="step-1-gallery"
            style={{
              width: 380,
              flexShrink: 0,
              borderRight: '1px solid var(--color-border)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <TemplateGallery
              selectedTemplateId={templateId}
              onSelectTemplate={(partial) => {
                handleApplyTemplate(partial as Partial<JerseyDesignSchema> & { template_id: string })
              }}
              onProceed={() => setCurrentStep(2)}
            />
          </div>
        )}

        {/* ── Langkah 2: Sesuaikan (Panel Kontrol Kiri) ── */}
        {currentStep === 2 && (
          <ControlPanel
            bahan={bahan}
            onBahanChange={(b) => {
              historyRef.current.push(getCurrentDesignSnapshot())
              setBahan(b)
              updateHistoryStatus()
            }}
            embossStrength={embossStrength}
            onEmbossStrengthChange={setEmbossStrength}
            textureScale={textureScale}
            onTextureScaleChange={setTextureScale}
            kerah={kerah}
            onKerahChange={(k) => {
              historyRef.current.push(getCurrentDesignSnapshot())
              setKerah(k)
              updateHistoryStatus()
            }}
            tipeKerah={tipeKerah}
            onTipeKerahChange={(tk) => {
              historyRef.current.push(getCurrentDesignSnapshot())
              setTipeKerah(tk)
              updateHistoryStatus()
            }}
            lenganPanjang={lenganPanjang}
            onLenganPanjangChange={(lp) => {
              historyRef.current.push(getCurrentDesignSnapshot())
              setLenganPanjang(lp)
              updateHistoryStatus()
            }}
            textureMode={textureMode}
            onTextureModeChange={(m) => {
              historyRef.current.push(getCurrentDesignSnapshot())
              setTextureMode(m)
              updateHistoryStatus()
            }}
            warnaDasar={warnaDasar}
            onWarnaDasarChange={(w) => { setWarnaDasar(w) }}
            layers={layers}
            onLayersChange={(l) => { setLayers(l) }}
            importedImage={importedImage}
            onImportedImageChange={setImportedImage}
            imageTransform={imageTransform}
            onImageTransformChange={setImageTransform}
            showUvGuide={showUvGuide}
            onShowUvGuideChange={setShowUvGuide}
            logoConfig={logoConfig}
            onLogoConfigChange={setLogoConfig}
            latarConfig={latarConfig}
            onLatarConfigChange={setLatarConfig}
            designId={designId}
            onDesignIdChange={setDesignId}
            onCaptureScreenshot={handleCaptureScreenshot}
            onExportListingPack={handleExportListingPack}
            onExportTurntableVideo={handleExportTurntableVideo}
            onOpenBatchModal={() => setIsBatchModalOpen(true)}
            exportProgress={exportProgress}
            videoExportProgress={videoExportProgress}
          />
        )}

        {/* ── Langkah 3: Pratinjau & Validasi (Kiri) ── */}
        {currentStep === 3 && (
          <div
            id="step-3-validation"
            style={{
              width: 340,
              flexShrink: 0,
              borderRight: '1px solid var(--color-border)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <ValidationPanel
              design={getCurrentDesignSnapshot()}
              logoConfig={logoConfig}
              onProceedExport={() => setCurrentStep(4)}
            />
          </div>
        )}

        {/* ── Langkah 4: Export (Panel Export Kiri) ── */}
        {currentStep === 4 && (
          <ControlPanel
            bahan={bahan}
            onBahanChange={(b) => { historyRef.current.push(getCurrentDesignSnapshot()); setBahan(b); updateHistoryStatus() }}
            embossStrength={embossStrength}
            onEmbossStrengthChange={setEmbossStrength}
            textureScale={textureScale}
            onTextureScaleChange={setTextureScale}
            kerah={kerah}
            onKerahChange={(k) => { historyRef.current.push(getCurrentDesignSnapshot()); setKerah(k); updateHistoryStatus() }}
            tipeKerah={tipeKerah}
            onTipeKerahChange={(tk) => { historyRef.current.push(getCurrentDesignSnapshot()); setTipeKerah(tk); updateHistoryStatus() }}
            lenganPanjang={lenganPanjang}
            onLenganPanjangChange={(lp) => { historyRef.current.push(getCurrentDesignSnapshot()); setLenganPanjang(lp); updateHistoryStatus() }}
            textureMode={textureMode}
            onTextureModeChange={(m) => { historyRef.current.push(getCurrentDesignSnapshot()); setTextureMode(m); updateHistoryStatus() }}
            warnaDasar={warnaDasar}
            onWarnaDasarChange={setWarnaDasar}
            layers={layers}
            onLayersChange={setLayers}
            importedImage={importedImage}
            onImportedImageChange={setImportedImage}
            imageTransform={imageTransform}
            onImageTransformChange={setImageTransform}
            showUvGuide={showUvGuide}
            onShowUvGuideChange={setShowUvGuide}
            logoConfig={logoConfig}
            onLogoConfigChange={setLogoConfig}
            latarConfig={latarConfig}
            onLatarConfigChange={setLatarConfig}
            designId={designId}
            onDesignIdChange={setDesignId}
            onCaptureScreenshot={handleCaptureScreenshot}
            onExportListingPack={handleExportListingPack}
            onExportTurntableVideo={handleExportTurntableVideo}
            onOpenBatchModal={() => setIsBatchModalOpen(true)}
            exportProgress={exportProgress}
            videoExportProgress={videoExportProgress}
            defaultTab="export"
          />
        )}

        {/* ── 3D VIEWER PERSISTEN DI KANAN (TIDAK PERNAH DI-UNMOUNT) ── */}
        <main
          id="viewer-area"
          aria-label="Area preview jersey 3D"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Viewer
              bahan={bahan}
              diffuseMap={diffuseMap}
              latarConfig={latarConfig}
              embossStrength={embossStrength}
              textureScale={textureScale}
              kerah={kerah}
              tipeKerah={tipeKerah}
              lenganPanjang={lenganPanjang}
              baseColor={warnaDasar}
              isTurntableActive={isTurntableActive}
              onCameraReady={(goTo) => { goToPresetRef.current = goTo }}
              onEngineReady={(ctx) => { engineContextRef.current = ctx }}
            />
          </div>
          <CameraPresets
            onPreset={(preset) => { setActivePreset(preset); goToPresetRef.current?.(preset) }}
            activePreset={activePreset}
            isTurntableActive={isTurntableActive}
            onToggleTurntable={handleToggleTurntable}
          />
        </main>
      </div>

      {/* Modal Daftar Draft Tersimpan */}
      <DraftsModal
        isOpen={isDraftsModalOpen}
        onClose={() => setIsDraftsModalOpen(false)}
        drafts={draftsList}
        onOpenDraft={(draft) => applyDesignSchema(draft.design, true)}
        onDeleteDraft={async (id) => {
          await deleteDraftFromDb(id)
          await refreshDrafts()
        }}
        onRenameDraft={async (id, newName) => {
          await renameDraftInDb(id, newName)
          await refreshDrafts()
        }}
      />

      {/* Modal Batch Processing (Tahap 7) */}
      <BatchExportModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onRunBatch={handleRunBatch}
        progress={batchProgress}
        isProcessing={isBatchRunning}
        onCancel={() => {
          batchCancelRef.current = true
        }}
      />
    </div>
  )
}

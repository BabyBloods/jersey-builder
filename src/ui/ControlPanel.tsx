/**
 * ui/ControlPanel.tsx — Panel kontrol kiri Nemesis3D
 * Tab: Bahan | Warna & Motif | Logo | Latar | Export
 * Mengikuti token design system nemesis3d/MASTER.md
 */

import {
  Camera,
  CheckCircle2,
  Dices,
  Download,
  Film,
  FlipHorizontal,
  FolderArchive,
  Image as ImageIcon,
  Layers,
  PackageCheck,
  Palette,
  Plus,
  RotateCw,
  Settings,
  Sliders,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  Video,
} from 'lucide-react'
import { useRef, useState } from 'react'
import type { LatarConfig, LatarTipe } from '../engine/background'
import type { ScreenshotResolution } from '../export/screenshot'
import type { VideoResolutionPreset } from '../export/turntableVideo'
import type { BahanType } from '../materials/normalMaps'
import type { LayerParams, MotifType } from '../patterns/generators'
import type { LogoConfig, LogoPosisi } from '../texture/logoLayer'
import type { ImageTransform, TextureMode } from '../texture/textureCompositor'

type TabId = 'bahan' | 'warna' | 'logo' | 'latar' | 'export'

interface Tab {
  id: TabId
  label: string
  icon: React.ReactNode
}

const TABS: Tab[] = [
  { id: 'bahan', label: 'Bahan', icon: <Settings size={16} /> },
  { id: 'warna', label: 'Warna & Motif', icon: <Palette size={16} /> },
  { id: 'logo', label: 'Logo', icon: <ImageIcon size={16} /> },
  { id: 'latar', label: 'Latar', icon: <Layers size={16} /> },
  { id: 'export', label: 'Export', icon: <Download size={16} /> },
]

export interface ExportProgressState {
  active: boolean
  step: string
  percent: number
}

export interface ControlPanelProps {
  // Props Bahan (Tahap 2)
  bahan: BahanType
  onBahanChange: (bahan: BahanType) => void
  embossStrength: number
  onEmbossStrengthChange: (val: number) => void
  textureScale: number
  onTextureScaleChange: (val: number) => void
  kerah: boolean
  onKerahChange: (val: boolean) => void
  tipeKerah?: 'ribbon' | 'vneck'
  onTipeKerahChange?: (tipe: 'ribbon' | 'vneck') => void
  lenganPanjang?: boolean
  onLenganPanjangChange?: (val: boolean) => void

  // Props Warna & Motif (Tahap 3)
  textureMode: TextureMode
  onTextureModeChange: (mode: TextureMode) => void
  warnaDasar: string
  onWarnaDasarChange: (color: string) => void
  layers: LayerParams[]
  onLayersChange: (layers: LayerParams[]) => void
  importedImage: HTMLImageElement | HTMLCanvasElement | null
  onImportedImageChange: (img: HTMLImageElement | null) => void
  imageTransform: ImageTransform
  onImageTransformChange: (transform: ImageTransform) => void
  showUvGuide: boolean
  onShowUvGuideChange: (val: boolean) => void

  // Props Logo (Tahap 4)
  logoConfig: LogoConfig
  onLogoConfigChange: (cfg: LogoConfig) => void

  // Props Latar (Tahap 4)
  latarConfig: LatarConfig
  onLatarConfigChange: (cfg: LatarConfig) => void

  // Props Export (Tahap 4 & 7)
  designId: string
  onDesignIdChange: (id: string) => void
  onCaptureScreenshot: (res: ScreenshotResolution) => Promise<void>
  onExportListingPack: () => Promise<void>
  onExportTurntableVideo?: (res: VideoResolutionPreset, durasi: number) => Promise<void>
  onOpenBatchModal?: () => void
  exportProgress: ExportProgressState
  videoExportProgress?: { active: boolean; status: string; percent: number }
  defaultTab?: TabId
}

export function ControlPanel({
  bahan = 'milano',
  onBahanChange = () => {},
  embossStrength = 1.0,
  onEmbossStrengthChange = () => {},
  textureScale = 1.0,
  onTextureScaleChange = () => {},
  kerah = true,
  onKerahChange = () => {},
  tipeKerah = 'ribbon',
  onTipeKerahChange = () => {},
  lenganPanjang = false,
  onLenganPanjangChange = () => {},

  textureMode = 'template',
  onTextureModeChange = () => {},
  warnaDasar = '#1B2A41',
  onWarnaDasarChange = () => {},
  layers = [],
  onLayersChange = () => {},
  importedImage = null,
  onImportedImageChange = () => {},
  imageTransform = { scale: 1.0, offsetX: 0, offsetY: 0, rotation: 0, mirror: false },
  onImageTransformChange = () => {},
  showUvGuide = false,
  onShowUvGuideChange = () => {},

  logoConfig = { image: null, posisi: 'dada-kiri', ukuran: 0.15, offset: [0, 0] },
  onLogoConfigChange = () => {},

  latarConfig = { tipe: 'gradasi', warna1: '#1E2330', warna2: '#0D0F12', sudut: 90, gambar: null },
  onLatarConfigChange = () => {},

  designId = '2026-10-21_fuji-ridge',
  onDesignIdChange = () => {},
  onCaptureScreenshot = async () => {},
  onExportListingPack = async () => {},
  onExportTurntableVideo,
  onOpenBatchModal,
  exportProgress = { active: false, step: '', percent: 0 },
  videoExportProgress,
  defaultTab = 'bahan',
}: Partial<ControlPanelProps> = {}) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab as TabId)

  return (
    <aside
      id="control-panel"
      aria-label="Panel kontrol desain"
      style={{
        width: 340,
        flexShrink: 0,
        background: 'var(--color-surface-1)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Tab navigation */}
      <nav
        id="panel-tabs"
        role="tablist"
        aria-label="Tab panel kontrol"
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
          overflowX: 'auto',
          background: 'var(--color-bg)',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-1)',
                padding: 'var(--space-3) var(--space-2)',
                background: isActive ? 'var(--color-surface-1)' : 'transparent',
                border: 'none',
                borderBottom: isActive
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent',
                cursor: 'pointer',
                color: isActive
                  ? 'var(--color-accent)'
                  : 'var(--color-text-secondary)',
                fontSize: 'var(--text-xs)',
                fontWeight: isActive ? 600 : 400,
                fontFamily: 'var(--font-sans)',
                transition: 'all var(--duration-fast) var(--ease-standard)',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Tab content area */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        {activeTab === 'bahan' && (
          <BahanTab
            bahan={bahan}
            onBahanChange={onBahanChange}
            embossStrength={embossStrength}
            onEmbossStrengthChange={onEmbossStrengthChange}
            textureScale={textureScale}
            onTextureScaleChange={onTextureScaleChange}
            kerah={kerah}
            onKerahChange={onKerahChange}
            tipeKerah={tipeKerah}
            onTipeKerahChange={onTipeKerahChange}
            lenganPanjang={lenganPanjang}
            onLenganPanjangChange={onLenganPanjangChange}
          />
        )}

        {activeTab === 'warna' && (
          <WarnaTab
            mode={textureMode}
            onModeChange={onTextureModeChange}
            warnaDasar={warnaDasar}
            onWarnaDasarChange={onWarnaDasarChange}
            layers={layers}
            onLayersChange={onLayersChange}
            importedImage={importedImage}
            onImportedImageChange={onImportedImageChange}
            imageTransform={imageTransform}
            onImageTransformChange={onImageTransformChange}
            showUvGuide={showUvGuide}
            onShowUvGuideChange={onShowUvGuideChange}
          />
        )}

        {activeTab === 'logo' && (
          <LogoTab
            config={logoConfig}
            onChange={onLogoConfigChange}
          />
        )}

        {activeTab === 'latar' && (
          <LatarTab
            config={latarConfig}
            onChange={onLatarConfigChange}
          />
        )}

        {activeTab === 'export' && (
          <ExportTab
            designId={designId}
            onDesignIdChange={onDesignIdChange}
            bahan={bahan}
            onCaptureScreenshot={onCaptureScreenshot}
            onExportListingPack={onExportListingPack}
            onExportTurntableVideo={onExportTurntableVideo}
            onOpenBatchModal={onOpenBatchModal}
            progress={exportProgress}
            videoProgress={videoExportProgress}
          />
        )}
      </div>
    </aside>
  )
}

/** ---------------- TAB BAHAN (Tahap 2) ---------------- */
interface BahanTabProps {
  bahan: BahanType
  onBahanChange: (bahan: BahanType) => void
  embossStrength: number
  onEmbossStrengthChange: (val: number) => void
  textureScale: number
  onTextureScaleChange: (val: number) => void
  kerah: boolean
  onKerahChange: (val: boolean) => void
  tipeKerah?: 'ribbon' | 'vneck'
  onTipeKerahChange?: (tipe: 'ribbon' | 'vneck') => void
  lenganPanjang?: boolean
  onLenganPanjangChange?: (val: boolean) => void
}

const BAHAN_LIST: Array<{
  id: BahanType
  name: string
  tag: string
  desc: string
}> = [
  {
    id: 'milano',
    name: 'Dri-Fit Milano',
    tag: 'Matte Chevron',
    desc: 'Tekstur rajutan pori zig-zag khas Milano Indonesia, halus, sejuk & non-reflektif.',
  },
  {
    id: 'emboss',
    name: 'Dri-Fit Emboss',
    tag: 'Relief Timbul 3D',
    desc: 'Pola relief kontur timbul woodgrain/topografi 3D mewah dengan kilau elastis.',
  },
  {
    id: 'microcool',
    name: 'Dri-Fit Microcool',
    tag: 'Pinhole Sheen',
    desc: 'Perforasi mikro titik jarum (microlite) berventilasi tinggi dengan kemilau athletic.',
  },
]

function BahanTab({
  bahan,
  onBahanChange,
  embossStrength,
  onEmbossStrengthChange,
  textureScale,
  onTextureScaleChange,
  kerah,
  onKerahChange,
  tipeKerah = 'ribbon',
  onTipeKerahChange = () => {},
  lenganPanjang = false,
  onLenganPanjangChange = () => {},
}: BahanTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <h2
          style={{
            fontSize: 'var(--text-md)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-1)',
          }}
        >
          Pilihan Bahan Jersey
        </h2>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          Tekstur normal map dihitung langsung (procedural) tanpa aset eksternal.
        </p>
      </div>

      {/* Material cards */}
      <div
        role="radiogroup"
        aria-label="Pilihan bahan jersey"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
      >
        {BAHAN_LIST.map((item) => {
          const isSelected = bahan === item.id
          return (
            <button
              key={item.id}
              id={`bahan-btn-${item.id}`}
              role="radio"
              aria-checked={isSelected}
              onClick={() => onBahanChange(item.id)}
              className={`card${isSelected ? ' selected' : ''}`}
              style={{
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-1)',
                padding: 'var(--space-3)',
                background: isSelected
                  ? 'var(--color-surface-2)'
                  : 'var(--color-surface-1)',
                border: isSelected
                  ? '1px solid var(--color-accent)'
                  : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: isSelected
                  ? '0 0 0 1px var(--color-accent)'
                  : 'none',
                transition: 'all var(--duration-fast) var(--ease-standard)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: isSelected ? 'var(--color-accent)' : 'var(--color-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                  }}
                >
                  {isSelected && <Sparkles size={14} color="var(--color-accent)" />}
                  {item.name}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(230, 57, 70, 0.15)' : 'var(--color-surface-3)',
                    color: isSelected ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {item.tag}
                </span>
              </div>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.4,
                }}
              >
                {item.desc}
              </span>
            </button>
          )
        })}
      </div>

      {/* Slider controls */}
      <div
        style={{
          background: 'var(--color-surface-2)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <Sliders size={14} color="var(--color-accent)" />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Parameter Tekstur Kain
          </span>
        </div>

        {bahan === 'emboss' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label
                htmlFor="emboss-strength-slider"
                style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}
              >
                Kekuatan Timbul
              </label>
              <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>
                {embossStrength.toFixed(1)}x
              </span>
            </div>
            <input
              id="emboss-strength-slider"
              type="range"
              min="0.3"
              max="2.5"
              step="0.1"
              value={embossStrength}
              onChange={(e) => onEmbossStrengthChange(parseFloat(e.target.value))}
              aria-label="Kekuatan timbul pola emboss"
              style={{ width: '100%', accentColor: 'var(--color-accent)', cursor: 'pointer' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label
              htmlFor="texture-scale-slider"
              style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}
            >
              Kerapatan Tekstur (Tiling)
            </label>
            <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
              {textureScale.toFixed(1)}x
            </span>
          </div>
          <input
            id="texture-scale-slider"
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={textureScale}
            onChange={(e) => onTextureScaleChange(parseFloat(e.target.value))}
            aria-label="Kerapatan tekstur bahan"
            style={{ width: '100%', accentColor: 'var(--color-accent)', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* ── PILIHAN TEMPLATE MODEL BAJU (Lengan Pendek vs Lengan Panjang) ── */}
      <div
        style={{
          background: 'var(--color-surface-2)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', display: 'block' }}>
              Pola Template Baju
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              {lenganPanjang ? 'Template Jersey Lengan Panjang' : 'Template Jersey Lengan Pendek'}
            </span>
          </div>
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(230, 57, 70, 0.15)',
              color: 'var(--color-accent)',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            {lenganPanjang ? 'Lengan Panjang' : 'Lengan Pendek'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
          {/* Card Lengan Pendek */}
          <button
            type="button"
            id="template-short-sleeve-btn"
            onClick={() => onLenganPanjangChange(false)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              border: !lenganPanjang ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
              background: !lenganPanjang ? 'rgba(230, 57, 70, 0.15)' : 'var(--color-surface-1)',
              cursor: 'pointer',
              textAlign: 'left',
              gap: '2px',
              transition: 'all var(--duration-fast) var(--ease-standard)',
            }}
          >
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: !lenganPanjang ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
              👕 Lengan Pendek
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', lineHeight: 1.2 }}>
              Pola atletis klasik di atas siku
            </span>
          </button>

          {/* Card Lengan Panjang */}
          <button
            type="button"
            id="template-long-sleeve-btn"
            onClick={() => onLenganPanjangChange(true)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              border: lenganPanjang ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
              background: lenganPanjang ? 'rgba(230, 57, 70, 0.15)' : 'var(--color-surface-1)',
              cursor: 'pointer',
              textAlign: 'left',
              gap: '2px',
              transition: 'all var(--duration-fast) var(--ease-standard)',
            }}
          >
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: lenganPanjang ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
              🥼 Lengan Panjang
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', lineHeight: 1.2 }}>
              Pola full-sleeve dengan manset
            </span>
          </button>
        </div>
      </div>

      {/* ── PILIHAN KERAH JERSEY ── */}
      <div
        style={{
          background: 'var(--color-surface-2)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', display: 'block' }}>
              Kerah Jersey
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              {kerah ? (tipeKerah === 'vneck' ? 'Kerah Polo V-Neck (Wangki) aktif' : 'Kerah Ribbon (Bulat) aktif') : 'Tanpa kerah (leher polos)'}
            </span>
          </div>

          <button
            id="collar-toggle-btn"
            role="switch"
            aria-checked={kerah}
            onClick={() => onKerahChange(!kerah)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: kerah ? 'var(--color-accent)' : 'var(--color-text-disabled)',
              display: 'flex',
              alignItems: 'center',
              padding: 0,
              transition: 'color var(--duration-fast) var(--ease-standard)',
            }}
            aria-label={kerah ? 'Nonaktifkan kerah' : 'Aktifkan kerah'}
          >
            {kerah ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
          </button>
        </div>

        {/* Pilihan Gaya Kerah: Ribbon (Bulat) vs V-Neck Polo */}
        {kerah && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            <button
              type="button"
              id="collar-type-ribbon-btn"
              onClick={() => onTipeKerahChange('ribbon')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                border: tipeKerah === 'ribbon' ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                background: tipeKerah === 'ribbon' ? 'rgba(230, 57, 70, 0.15)' : 'var(--color-surface-1)',
                color: tipeKerah === 'ribbon' ? 'var(--color-accent)' : 'var(--color-text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                gap: '2px',
                transition: 'all var(--duration-fast) var(--ease-standard)',
              }}
            >
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                🔘 Ribbon (Bulat)
              </span>
              <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', lineHeight: 1.2 }}>
                Pita rib melingkar rapat leher
              </span>
            </button>

            <button
              type="button"
              id="collar-type-vneck-btn"
              onClick={() => onTipeKerahChange('vneck')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                border: tipeKerah === 'vneck' ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                background: tipeKerah === 'vneck' ? 'rgba(230, 57, 70, 0.15)' : 'var(--color-surface-1)',
                color: tipeKerah === 'vneck' ? 'var(--color-accent)' : 'var(--color-text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                gap: '2px',
                transition: 'all var(--duration-fast) var(--ease-standard)',
              }}
            >
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                👔 V-Neck Polo
              </span>
              <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', lineHeight: 1.2 }}>
                Kerah polo lipat bukaan V
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/** ---------------- TAB WARNA & MOTIF (Tahap 3) ---------------- */
interface WarnaTabProps {
  mode: TextureMode
  onModeChange: (mode: TextureMode) => void
  warnaDasar: string
  onWarnaDasarChange: (color: string) => void
  layers: LayerParams[]
  onLayersChange: (layers: LayerParams[]) => void
  importedImage: HTMLImageElement | HTMLCanvasElement | null
  onImportedImageChange: (img: HTMLImageElement | null) => void
  imageTransform: ImageTransform
  onImageTransformChange: (transform: ImageTransform) => void
  showUvGuide: boolean
  onShowUvGuideChange: (val: boolean) => void
}

const PRESET_WARNA_DASAR = [
  { name: 'Nemesis Navy', hex: '#1B2A41' },
  { name: 'Midnight Slate', hex: '#0F172A' },
  { name: 'Alpine Moss', hex: '#2D3A29' },
  { name: 'Crimson Trail', hex: '#E63946' },
  { name: 'Chalk White', hex: '#F2F4F7' },
  { name: 'Desert Ochre', hex: '#D97706' },
]

const MOTIF_OPTIONS: Array<{ id: MotifType; label: string }> = [
  { id: 'contour-peak', label: 'Contour Peak (Topografi)' },
  { id: 'fuji-ridge', label: 'Fuji Ridge (Punggungan)' },
  { id: 'mocha-dust', label: 'Mocha Dust (Debu Trail)' },
  { id: 'moss-strata', label: 'Moss Strata (Lapisan Tanah)' },
  { id: 'merah-putih-ridge', label: 'Merah Putih Ridge' },
]

function WarnaTab({
  mode,
  onModeChange,
  warnaDasar,
  onWarnaDasarChange,
  layers,
  onLayersChange,
  importedImage,
  onImportedImageChange,
  imageTransform,
  onImageTransformChange,
  showUvGuide,
  onShowUvGuideChange,
}: WarnaTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddLayer = () => {
    if (layers.length >= 4) return
    const newLayer: LayerParams = {
      id: `layer-${Date.now()}`,
      motif: 'contour-peak',
      warna: '#F2F2F2',
      seed: Math.floor(Math.random() * 1000),
      kerapatan: 1.0,
      sudut: 0,
      skala: 1.0,
      opacity: 0.85,
    }
    onLayersChange([...layers, newLayer])
  }

  const handleUpdateLayer = (id: string, updates: Partial<LayerParams>) => {
    onLayersChange(
      layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    )
  }

  const handleRemoveLayer = (id: string) => {
    onLayersChange(layers.filter((l) => l.id !== id))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new window.Image()
      img.onload = () => {
        onImportedImageChange(img)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Mode Switcher */}
      <div
        style={{
          display: 'flex',
          background: 'var(--color-surface-2)',
          padding: '2px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
        }}
      >
        <button
          id="mode-template-btn"
          onClick={() => onModeChange('template')}
          style={{
            flex: 1,
            padding: 'var(--space-2)',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: mode === 'template' ? 'var(--color-accent)' : 'transparent',
            color: mode === 'template' ? '#FFFFFF' : 'var(--color-text-secondary)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all var(--duration-fast) var(--ease-standard)',
          }}
        >
          Mode A: Template Berlapis
        </button>
        <button
          id="mode-import-btn"
          onClick={() => onModeChange('import')}
          style={{
            flex: 1,
            padding: 'var(--space-2)',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: mode === 'import' ? 'var(--color-accent)' : 'transparent',
            color: mode === 'import' ? '#FFFFFF' : 'var(--color-text-secondary)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all var(--duration-fast) var(--ease-standard)',
          }}
        >
          Mode B: Import Gambar
        </button>
      </div>

      {/* Warna Dasar */}
      <div
        style={{
          background: 'var(--color-surface-2)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Warna Dasar Jersey
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="color"
              value={warnaDasar}
              onChange={(e) => onWarnaDasarChange(e.target.value)}
              aria-label="Pilih warna dasar hex"
              style={{
                width: 24,
                height: 24,
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                background: 'transparent',
              }}
            />
            <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
              {warnaDasar.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Quick Swatches */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {PRESET_WARNA_DASAR.map((swatch) => (
            <button
              key={swatch.hex}
              title={swatch.name}
              onClick={() => onWarnaDasarChange(swatch.hex)}
              style={{
                width: 24,
                height: 24,
                borderRadius: 'var(--radius-sm)',
                background: swatch.hex,
                border:
                  warnaDasar.toLowerCase() === swatch.hex.toLowerCase()
                    ? '2px solid var(--color-accent)'
                    : '1px solid var(--color-border-strong)',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* Mode A */}
      {mode === 'template' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Layer Motif ({layers.length}/4)
            </span>
            {layers.length < 4 && (
              <button
                id="add-layer-btn"
                onClick={handleAddLayer}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'var(--color-surface-3)',
                  border: '1px solid var(--color-border-strong)',
                  color: 'var(--color-text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} />
                <span>Tambah Layer</span>
              </button>
            )}
          </div>

          {layers.map((layer, idx) => (
            <div
              key={layer.id}
              style={{
                background: 'var(--color-surface-2)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                padding: 'var(--space-3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-accent)' }}>
                  LAYER {idx + 1}
                </span>
                <button
                  onClick={() => handleRemoveLayer(layer.id)}
                  title="Hapus layer"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-disabled)',
                    padding: 0,
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <select
                  value={layer.motif}
                  onChange={(e) =>
                    handleUpdateLayer(layer.id, { motif: e.target.value as MotifType })
                  }
                  style={{
                    flex: 1,
                    background: 'var(--color-surface-1)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 8px',
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {MOTIF_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <input
                  type="color"
                  value={layer.warna}
                  onChange={(e) => handleUpdateLayer(layer.id, { warna: e.target.value })}
                  title="Warna motif"
                  style={{
                    width: 32,
                    height: 32,
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Opacity</span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      {Math.round(layer.opacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={layer.opacity}
                    onChange={(e) =>
                      handleUpdateLayer(layer.id, { opacity: parseFloat(e.target.value) })
                    }
                    style={{ width: '100%', accentColor: 'var(--color-accent)' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Kerapatan</span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      {layer.kerapatan.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="2.2"
                    step="0.1"
                    value={layer.kerapatan}
                    onChange={(e) =>
                      handleUpdateLayer(layer.id, { kerapatan: parseFloat(e.target.value) })
                    }
                    style={{ width: '100%', accentColor: 'var(--color-accent)' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Skala</span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      {layer.skala.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.1"
                    value={layer.skala}
                    onChange={(e) =>
                      handleUpdateLayer(layer.id, { skala: parseFloat(e.target.value) })
                    }
                    style={{ width: '100%', accentColor: 'var(--color-accent)' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Sudut</span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      {layer.sudut}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={layer.sudut}
                    onChange={(e) =>
                      handleUpdateLayer(layer.id, { sudut: parseInt(e.target.value) })
                    }
                    style={{ width: '100%', accentColor: 'var(--color-accent)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  Seed: <span style={{ fontFamily: 'var(--font-mono)' }}>{layer.seed}</span>
                </span>
                <button
                  onClick={() =>
                    handleUpdateLayer(layer.id, { seed: Math.floor(Math.random() * 10000) })
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'var(--color-surface-3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '3px 8px',
                    fontSize: '11px',
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  <Dices size={13} />
                  <span>Acak Seed</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mode B */}
      {mode === 'import' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'var(--color-surface-2)',
              border: '2px dashed var(--color-border-strong)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <Upload size={24} color="var(--color-accent)" />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {importedImage ? 'Ganti File Gambar' : 'Pilih File JPG / PNG'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              Mendukung tekstur penuh resolusi tinggi
            </span>
          </div>

          {importedImage && (
            <div
              style={{
                background: 'var(--color-surface-2)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}
            >
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Transformasi Gambar
              </span>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Skala</span>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    {imageTransform.scale.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="3.0"
                  step="0.05"
                  value={imageTransform.scale}
                  onChange={(e) =>
                    onImageTransformChange({
                      ...imageTransform,
                      scale: parseFloat(e.target.value),
                    })
                  }
                  style={{ width: '100%', accentColor: 'var(--color-accent)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Offset X</span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      {Math.round(imageTransform.offsetX * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-0.8"
                    max="0.8"
                    step="0.02"
                    value={imageTransform.offsetX}
                    onChange={(e) =>
                      onImageTransformChange({
                        ...imageTransform,
                        offsetX: parseFloat(e.target.value),
                      })
                    }
                    style={{ width: '100%', accentColor: 'var(--color-accent)' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Offset Y</span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      {Math.round(imageTransform.offsetY * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-0.8"
                    max="0.8"
                    step="0.02"
                    value={imageTransform.offsetY}
                    onChange={(e) =>
                      onImageTransformChange({
                        ...imageTransform,
                        offsetY: parseFloat(e.target.value),
                      })
                    }
                    style={{ width: '100%', accentColor: 'var(--color-accent)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <RotateCw size={14} color="var(--color-text-secondary)" />
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    Rotasi: {imageTransform.rotation}°
                  </span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={imageTransform.rotation}
                  onChange={(e) =>
                    onImageTransformChange({
                      ...imageTransform,
                      rotation: parseInt(e.target.value),
                    })
                  }
                  style={{ width: 100, accentColor: 'var(--color-accent)' }}
                />
              </div>

              <button
                onClick={() =>
                  onImageTransformChange({
                    ...imageTransform,
                    mirror: !imageTransform.mirror,
                  })
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: imageTransform.mirror
                    ? 'rgba(230, 57, 70, 0.15)'
                    : 'var(--color-surface-3)',
                  border: imageTransform.mirror
                    ? '1px solid var(--color-accent)'
                    : '1px solid var(--color-border)',
                  color: imageTransform.mirror
                    ? 'var(--color-accent)'
                    : 'var(--color-text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <FlipHorizontal size={14} />
                <span>{imageTransform.mirror ? 'Mirror Aktif' : 'Mirror Horizontal'}</span>
              </button>
            </div>
          )}

          {/* UV Guide Toggle */}
          <div
            style={{
              background: 'var(--color-surface-2)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', display: 'block' }}>
                Garis Panel (UV Guide)
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                Bantuan batas panel depan, belakang & leher
              </span>
            </div>

            <button
              id="uv-guide-toggle-btn"
              role="switch"
              aria-checked={showUvGuide}
              onClick={() => onShowUvGuideChange(!showUvGuide)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: showUvGuide ? 'var(--color-accent)' : 'var(--color-text-disabled)',
                display: 'flex',
                alignItems: 'center',
                padding: 0,
              }}
              aria-label={showUvGuide ? 'Sembunyikan UV Guide' : 'Tampilkan UV Guide'}
            >
              {showUvGuide ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** ---------------- TAB LOGO (Tahap 4) ---------------- */
interface LogoTabProps {
  config: LogoConfig
  onChange: (cfg: LogoConfig) => void
}

function LogoTab({ config, onChange }: LogoTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new window.Image()
      img.onload = () => {
        onChange({ ...config, image: img })
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const positions: Array<{ id: LogoPosisi; label: string }> = [
    { id: 'dada-kiri', label: 'Dada Kiri' },
    { id: 'dada-tengah', label: 'Dada Tengah' },
    { id: 'punggung-atas', label: 'Punggung Atas' },
    { id: 'punggung-tengah', label: 'Punggung Tengah' },
    { id: 'lengan', label: 'Lengan' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
          Penempatan Logo
        </h2>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          Upload logo PNG transparan untuk diposisikan secara presisi pada jersey.
        </p>
      </div>

      {/* Upload Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          background: 'var(--color-surface-2)',
          border: '2px dashed var(--color-border-strong)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          textAlign: 'center',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png"
          onChange={handleLogoUpload}
          style={{ display: 'none' }}
        />
        <Upload size={22} color="var(--color-accent)" />
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {config.image ? 'Ganti File Logo' : 'Upload Logo PNG Transparan'}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
          PNG transparan memberikan hasil visual optimal
        </span>
      </div>

      {config.image && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Status info & remove */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--color-surface-2)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <CheckCircle2 size={16} color="var(--color-success)" />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)' }}>
                Logo Aktif ({config.image.width} × {config.image.height}px)
              </span>
            </div>
            <button
              onClick={() => onChange({ ...config, image: null })}
              title="Hapus logo"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-destructive)',
                padding: 0,
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>

          {/* Posisi Preset */}
          <div
            style={{
              background: 'var(--color-surface-2)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}
          >
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Posisi Preset Logo
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
              {positions.map((pos) => {
                const isSelected = config.posisi === pos.id
                return (
                  <button
                    key={pos.id}
                    onClick={() => onChange({ ...config, posisi: pos.id })}
                    style={{
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      border: isSelected
                        ? '1px solid var(--color-accent)'
                        : '1px solid var(--color-border)',
                      background: isSelected
                        ? 'rgba(230, 57, 70, 0.15)'
                        : 'var(--color-surface-1)',
                      color: isSelected ? 'var(--color-accent)' : 'var(--color-text-primary)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {pos.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Fine Tuning Controls */}
          <div
            style={{
              background: 'var(--color-surface-2)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Penyesuaian Skala & Titik Offset
            </span>

            {/* Ukuran */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Ukuran Logo</span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  {Math.round(config.ukuran * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.35"
                step="0.01"
                value={config.ukuran}
                onChange={(e) => onChange({ ...config, ukuran: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-accent)' }}
              />
            </div>

            {/* Offset X & Y */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Offset X</span>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    {Math.round(config.offset[0] * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-0.15"
                  max="0.15"
                  step="0.01"
                  value={config.offset[0]}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      offset: [parseFloat(e.target.value), config.offset[1]],
                    })
                  }
                  style={{ width: '100%', accentColor: 'var(--color-accent)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Offset Y</span>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    {Math.round(config.offset[1] * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-0.15"
                  max="0.15"
                  step="0.01"
                  value={config.offset[1]}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      offset: [config.offset[0], parseFloat(e.target.value)],
                    })
                  }
                  style={{ width: '100%', accentColor: 'var(--color-accent)' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** ---------------- TAB LATAR (Tahap 4) ---------------- */
interface LatarTabProps {
  config: LatarConfig
  onChange: (cfg: LatarConfig) => void
}

function LatarTab({ config, onChange }: LatarTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const modes: Array<{ id: LatarTipe; label: string }> = [
    { id: 'gradasi', label: 'Gradasi' },
    { id: 'polos', label: 'Polos' },
    { id: 'transparan', label: 'Transparan' },
    { id: 'gambar', label: 'Gambar' },
  ]

  const GRADIENT_PRESETS = [
    { name: 'Studio Dark', w1: '#1E2330', w2: '#0D0F12', angle: 90 },
    { name: 'Minimalist Light', w1: '#FFFFFF', w2: '#E6E8EB', angle: 90 },
    { name: 'Midnight Glow', w1: '#1A233A', w2: '#080C14', angle: 135 },
    { name: 'Sunset Trail', w1: '#3D1C24', w2: '#161A1F', angle: 45 },
  ]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new window.Image()
      img.onload = () => {
        onChange({ ...config, tipe: 'gambar', gambar: img })
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
          Latar Belakang Scene
        </h2>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          Latar berlaku untuk live preview 3D dan seluruh hasil render screenshot/export.
        </p>
      </div>

      {/* Mode selection pills */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--space-2)',
          background: 'var(--color-surface-2)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
        }}
      >
        {modes.map((m) => {
          const isSelected = config.tipe === m.id
          return (
            <button
              key={m.id}
              onClick={() => onChange({ ...config, tipe: m.id })}
              style={{
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isSelected ? 'var(--color-accent)' : 'transparent',
                color: isSelected ? '#FFFFFF' : 'var(--color-text-secondary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {m.label}
            </button>
          )
        })}
      </div>

      {/* Kontrol sesuai mode */}
      {config.tipe === 'polos' && (
        <div
          style={{
            background: 'var(--color-surface-2)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Warna Latar Polos
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input
                type="color"
                value={config.warna1}
                onChange={(e) => onChange({ ...config, warna1: e.target.value })}
                style={{ width: 24, height: 24, border: 'none', cursor: 'pointer', background: 'transparent' }}
              />
              <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
                {config.warna1.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {config.tipe === 'gradasi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Preset gradasi */}
          <div
            style={{
              background: 'var(--color-surface-2)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}
          >
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Preset Gradasi
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
              {GRADIENT_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() =>
                    onChange({
                      ...config,
                      warna1: p.w1,
                      warna2: p.w2,
                      sudut: p.angle,
                    })
                  }
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: `linear-gradient(${p.angle}deg, ${p.w1}, ${p.w2})`,
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color 1, Color 2, and Angle */}
          <div
            style={{
              background: 'var(--color-surface-2)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input
                  type="color"
                  value={config.warna1}
                  onChange={(e) => onChange({ ...config, warna1: e.target.value })}
                  style={{ width: 24, height: 24, border: 'none', cursor: 'pointer', background: 'transparent' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Warna 1</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input
                  type="color"
                  value={config.warna2}
                  onChange={(e) => onChange({ ...config, warna2: e.target.value })}
                  style={{ width: 24, height: 24, border: 'none', cursor: 'pointer', background: 'transparent' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Warna 2</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Sudut Gradasi</span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{config.sudut}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={config.sudut}
                onChange={(e) => onChange({ ...config, sudut: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-accent)' }}
              />
            </div>
          </div>
        </div>
      )}

      {config.tipe === 'transparan' && (
        <div
          style={{
            background: 'rgba(0, 229, 255, 0.08)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
          }}
        >
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Latar Transparan Aktif
          </span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Canvas menampilkan latar papan catur (*checkerboard*). Screenshot PNG akan tersimpan dengan transparansi murni (alpha channel).
          </span>
        </div>
      )}

      {config.tipe === 'gambar' && (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: 'var(--color-surface-2)',
            border: '2px dashed var(--color-border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            textAlign: 'center',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <Upload size={22} color="var(--color-accent)" />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {config.gambar ? 'Ganti Gambar Latar' : 'Pilih Gambar Latar (JPG/PNG)'}
          </span>
        </div>
      )}
    </div>
  )
}

/** ---------------- TAB EXPORT (Tahap 4 & 7) ---------------- */
interface ExportTabProps {
  designId: string
  onDesignIdChange: (id: string) => void
  bahan: string
  onCaptureScreenshot: (res: ScreenshotResolution) => Promise<void>
  onExportListingPack: () => Promise<void>
  onExportTurntableVideo?: (res: VideoResolutionPreset, durasi: number) => Promise<void>
  onOpenBatchModal?: () => void
  progress: ExportProgressState
  videoProgress?: { active: boolean; status: string; percent: number }
}

function ExportTab({
  designId,
  onDesignIdChange,
  bahan,
  onCaptureScreenshot,
  onExportListingPack,
  onExportTurntableVideo,
  onOpenBatchModal,
  progress,
  videoProgress = { active: false, status: '', percent: 0 },
}: ExportTabProps) {
  const [selectedRes, setSelectedRes] = useState<ScreenshotResolution>(2048)
  const [isCapturing, setIsCapturing] = useState(false)

  // State untuk Video 360
  const [videoRes, setVideoRes] = useState<VideoResolutionPreset>('1080x1080')
  const [videoDuration, setVideoDuration] = useState<number>(5)
  const [isRecordingVideo, setIsRecordingVideo] = useState(false)

  const handleScreenshot = async () => {
    setIsCapturing(true)
    try {
      await onCaptureScreenshot(selectedRes)
    } finally {
      setIsCapturing(false)
    }
  }

  const handleRecordVideo = async () => {
    if (!onExportTurntableVideo) return
    setIsRecordingVideo(true)
    try {
      await onExportTurntableVideo(videoRes, videoDuration)
    } finally {
      setIsRecordingVideo(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
          Export Gambar, Video & Batch
        </h2>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          Export screenshot resolusi tinggi, paket listing ZIP marketplace, video 360° turntable, atau proses massal.
        </p>
      </div>

      {/* ID Desain Input */}
      <div
        style={{
          background: 'var(--color-surface-2)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-1)',
        }}
      >
        <label htmlFor="design-id-input" style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          ID Desain (Prefix Nama File)
        </label>
        <input
          id="design-id-input"
          type="text"
          value={designId}
          onChange={(e) => onDesignIdChange(e.target.value)}
          placeholder="contoh: 2026-10-21_fuji-ridge"
          style={{
            background: 'var(--color-surface-1)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 10px',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
          }}
        />
      </div>

      {/* SECTION 1: Single Screenshot */}
      <div
        style={{
          background: 'var(--color-surface-2)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Camera size={16} color="var(--color-accent)" />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Screenshot Resolusi Tinggi (PNG)
          </span>
        </div>

        {/* Resolution selector */}
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {([1024, 2048, 3000] as ScreenshotResolution[]).map((res) => (
            <button
              key={res}
              onClick={() => setSelectedRes(res)}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                border: selectedRes === res ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                background: selectedRes === res ? 'rgba(230, 57, 70, 0.15)' : 'var(--color-surface-1)',
                color: selectedRes === res ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {res}px
            </button>
          ))}
        </div>

        <button
          onClick={handleScreenshot}
          disabled={isCapturing}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            background: 'var(--color-surface-3)',
            border: '1px solid var(--color-border-strong)',
            color: 'var(--color-text-primary)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            cursor: isCapturing ? 'not-allowed' : 'pointer',
          }}
        >
          <Camera size={14} />
          <span>{isCapturing ? 'Memproses Screenshot...' : `Unduh Screenshot (${selectedRes}px)`}</span>
        </button>
      </div>

      {/* SECTION 2: Marketplace Listing Pack */}
      <div
        style={{
          background: 'var(--color-surface-2)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <PackageCheck size={16} color="var(--color-accent)" />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Paket Listing Marketplace (.ZIP)
          </span>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          Ekspor otomatis 5 file siap upload:
          <ul style={{ paddingLeft: '16px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <li><code>{designId}_depan.png</code></li>
            <li><code>{designId}_belakang.png</code></li>
            <li><code>{designId}_depan-belakang.png</code></li>
            <li><code>{designId}_detail-{bahan}.png</code></li>
            <li><code>{designId}_texture.png</code></li>
          </ul>
        </div>

        {/* Progress bar jika proses aktif */}
        {progress.active && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: 'var(--color-accent)' }}>{progress.step}</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{progress.percent}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--color-surface-3)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progress.percent}%`,
                  height: '100%',
                  background: 'var(--color-accent)',
                  transition: 'width 200ms ease',
                }}
              />
            </div>
          </div>
        )}

        <button
          onClick={onExportListingPack}
          disabled={progress.active}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            background: 'var(--color-accent)',
            border: 'none',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-sm)',
            padding: '10px',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            cursor: progress.active ? 'not-allowed' : 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Download size={15} />
          <span>{progress.active ? 'Sedang Merender Paket...' : 'Download Paket Listing (.ZIP)'}</span>
        </button>
      </div>

      {/* SECTION 3: Video 360 Turntable (Tahap 7) */}
      <div
        style={{
          background: 'var(--color-surface-2)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Film size={16} color="var(--color-accent)" />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Video 360° Turntable (WebM/MP4)
            </span>
          </div>
          <span style={{ fontSize: '10px', background: 'var(--color-surface-3)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-accent)', fontWeight: 700 }}>
            BARU
          </span>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
          Merekam rotasi 360° mulus untuk konten video promosi di TikTok, Reels, atau etalase marketplace.
        </p>

        {/* Resolution selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Format Resolusi:</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {([
              { id: '1080x1080', label: '1080p Persegi (Feed)' },
              { id: '1080x1920', label: '9:16 Story/TikTok' },
              { id: '1920x1080', label: '16:9 Landscape' },
              { id: '720x720',   label: '720p Cepat' },
            ] as const).map((r) => (
              <button
                key={r.id}
                onClick={() => setVideoRes(r.id)}
                style={{
                  padding: '6px',
                  borderRadius: 'var(--radius-sm)',
                  border: videoRes === r.id ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                  background: videoRes === r.id ? 'rgba(230, 57, 70, 0.15)' : 'var(--color-surface-1)',
                  color: videoRes === r.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Durasi Putaran:</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[3, 5, 8].map((sec) => (
              <button
                key={sec}
                onClick={() => setVideoDuration(sec)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-xs)',
                  border: videoDuration === sec ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                  background: videoDuration === sec ? 'rgba(230, 57, 70, 0.15)' : 'var(--color-surface-1)',
                  color: videoDuration === sec ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {sec} detik
              </button>
            ))}
          </div>
        </div>

        {/* Video progress */}
        {videoProgress.active && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: 'var(--color-accent)' }}>{videoProgress.status}</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{videoProgress.percent}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--color-surface-3)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${videoProgress.percent}%`,
                  height: '100%',
                  background: 'var(--color-accent)',
                  transition: 'width 150ms ease',
                }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleRecordVideo}
          disabled={videoProgress.active || isRecordingVideo}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            background: 'var(--color-surface-3)',
            border: '1px solid var(--color-border-strong)',
            color: 'var(--color-text-primary)',
            borderRadius: 'var(--radius-sm)',
            padding: '9px',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            cursor: (videoProgress.active || isRecordingVideo) ? 'not-allowed' : 'pointer',
          }}
        >
          <Video size={15} color="var(--color-accent)" />
          <span>{videoProgress.active ? 'Sedang Merekam 360°...' : `Rekam & Unduh Video (${videoDuration}s)`}</span>
        </button>
      </div>

      {/* SECTION 4: Batch Processing (Tahap 7) */}
      <div
        style={{
          background: 'var(--color-surface-2)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <FolderArchive size={16} color="var(--color-accent)" />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Batch Processing (Export Massal)
            </span>
          </div>
          <span style={{ fontSize: '10px', background: 'rgba(0, 229, 255, 0.15)', padding: '2px 6px', borderRadius: '4px', color: '#00E5FF', fontWeight: 700 }}>
            MASSAL
          </span>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
          Proses seluruh 6 template preset atau kumpulan file JSON sekaligus ke dalam satu file Master ZIP siap upload.
        </p>

        <button
          onClick={onOpenBatchModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            background: 'rgba(0, 229, 255, 0.1)',
            border: '1px solid rgba(0, 229, 255, 0.35)',
            color: '#00E5FF',
            borderRadius: 'var(--radius-sm)',
            padding: '9px',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <FolderArchive size={15} />
          <span>Buka Panel Batch Processor...</span>
        </button>
      </div>
    </div>
  )
}


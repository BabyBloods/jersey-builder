/**
 * ui/CameraPresets.tsx — Toolbar preset kamera & kontrol Turntable 360°
 * Tombol ikon untuk pindah ke posisi kamera yang telah ditentukan
 * dan toggle putar 360° live (Turntable).
 */

import {
  ArrowLeftRight,
  Box,
  MoveLeft,
  MoveRight,
  Pause,
  RotateCw,
  ZoomIn,
} from 'lucide-react'
import type { CameraPreset } from '../engine/camera'

interface CameraPresetsProps {
  /** Callback saat preset diklik */
  onPreset: (preset: CameraPreset) => void
  /** Preset yang sedang aktif */
  activePreset?: CameraPreset
  /** Apakah turntable 360° sedang aktif berputar */
  isTurntableActive?: boolean
  /** Toggle turntable auto-rotate */
  onToggleTurntable?: () => void
}

interface PresetButton {
  preset: CameraPreset
  label: string
  icon: React.ReactNode
}

const PRESET_BUTTONS: PresetButton[] = [
  { preset: 'depan', label: 'Depan', icon: <Box size={16} /> },
  { preset: 'belakang', label: 'Belakang', icon: <ArrowLeftRight size={16} /> },
  { preset: 'samping-kiri', label: 'Samping Kiri', icon: <MoveLeft size={16} /> },
  { preset: 'samping-kanan', label: 'Samping Kanan', icon: <MoveRight size={16} /> },
  { preset: 'detail-bahan', label: 'Detail Bahan', icon: <ZoomIn size={16} /> },
]

export function CameraPresets({
  onPreset,
  activePreset,
  isTurntableActive = false,
  onToggleTurntable,
}: CameraPresetsProps) {
  return (
    <div
      id="camera-presets"
      role="toolbar"
      aria-label="Preset posisi kamera dan putar 360"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-1)',
        padding: 'var(--space-2) var(--space-3)',
        background: 'var(--color-surface-1)',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginRight: 'var(--space-2)' }}>
          Kamera:
        </span>
        {PRESET_BUTTONS.map(({ preset, label, icon }) => (
          <div key={preset} className="tooltip-wrapper">
            <button
              id={`camera-preset-${preset}`}
              className={`btn-icon${activePreset === preset ? ' active' : ''}`}
              onClick={() => onPreset(preset)}
              aria-label={label}
              aria-pressed={activePreset === preset}
              title={label}
            >
              {icon}
            </button>
            <span className="tooltip" role="tooltip">{label}</span>
          </div>
        ))}
      </div>

      {/* Kontrol Putar 360° (Turntable Auto-rotate) */}
      {onToggleTurntable && (
        <button
          onClick={onToggleTurntable}
          title={isTurntableActive ? 'Hentikan Putaran 360°' : 'Putar 360° Otomatis'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: isTurntableActive ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
            background: isTurntableActive ? 'rgba(230, 57, 70, 0.15)' : 'var(--color-surface-2)',
            color: isTurntableActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {isTurntableActive ? <Pause size={13} /> : <RotateCw size={13} />}
          <span>{isTurntableActive ? 'Jeda 360°' : 'Putar 360°'}</span>
        </button>
      )}
    </div>
  )
}

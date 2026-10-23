/**
 * ui/Header.tsx — Header aplikasi dengan logo, stepper, undo/redo, dan toolbar
 * Sesuai panduan design system Nemesis3D
 */

import {
  Download,
  FolderOpen,
  Redo2,
  RotateCcw,
  Save,
  Undo2,
} from 'lucide-react'

export type Step = 1 | 2 | 3 | 4

interface HeaderProps {
  currentStep: Step
  onStepClick?: (step: Step) => void
  onExportClick?: () => void
  onNewClick?: () => void
  onLoadClick?: () => void
  onSaveClick?: () => void
  onUndoClick?: () => void
  onRedoClick?: () => void
  canUndo?: boolean
  canRedo?: boolean
  autosaveStatus?: string
}

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: 'Pilih Template' },
  { id: 2, label: 'Sesuaikan' },
  { id: 3, label: 'Pratinjau' },
  { id: 4, label: 'Export' },
]

export function Header({
  currentStep,
  onStepClick,
  onExportClick,
  onNewClick,
  onLoadClick,
  onSaveClick,
  onUndoClick,
  onRedoClick,
  canUndo = false,
  canRedo = false,
  autosaveStatus,
}: HeaderProps) {
  return (
    <header
      id="app-header"
      role="banner"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        padding: '0 var(--space-4)',
        height: '48px',
        background: 'var(--color-surface-1)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
      }}
    >
      {/* Logo Nemesis3D */}
      <div
        id="app-logo"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          flexShrink: 0,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2L4 7v5c0 5 3.5 9.74 8 11 4.5-1.26 8-6 8-11V7L12 2z"
            stroke="var(--color-accent)"
            strokeWidth="2"
            strokeLinejoin="round"
            fill="var(--color-accent-muted)"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="var(--color-accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          style={{
            fontSize: 'var(--text-md)',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          NEMESIS<span style={{ color: 'var(--color-accent)', marginLeft: 2 }}>3D</span>
        </span>
      </div>

      {/* Stepper 4 Langkah */}
      <nav
        id="stepper"
        aria-label="Tahapan pengerjaan desain"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          flex: 1,
          justifyContent: 'center',
        }}
      >
        {STEPS.map((step, i) => {
          const isActive = step.id === currentStep
          const isDone = step.id < currentStep

          return (
            <div
              key={step.id}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              <button
                id={`step-btn-${step.id}`}
                onClick={() => onStepClick?.(step.id)}
                aria-current={isActive ? 'step' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 'var(--space-1) var(--space-2)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'all var(--duration-fast) var(--ease-standard)',
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    background: isActive
                      ? 'var(--color-accent)'
                      : isDone
                        ? 'var(--color-success)'
                        : 'var(--color-surface-3)',
                    color: isActive || isDone ? '#FFFFFF' : 'var(--color-text-disabled)',
                    transition: 'all var(--duration-base) var(--ease-standard)',
                  }}
                >
                  {isDone ? '✓' : step.id}
                </span>

                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive
                      ? 'var(--color-text-primary)'
                      : isDone
                        ? 'var(--color-text-secondary)'
                        : 'var(--color-text-disabled)',
                    transition: 'color var(--duration-fast) var(--ease-standard)',
                  }}
                >
                  {step.label}
                </span>
              </button>

              {i < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  style={{
                    width: 24,
                    height: 1,
                    background: isDone ? 'var(--color-success)' : 'var(--color-border)',
                    transition: 'background var(--duration-base) var(--ease-standard)',
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          )
        })}
      </nav>

      {/* Toolbar kanan: undo/redo, simpan, muat, export */}
      <div
        id="header-toolbar"
        role="toolbar"
        aria-label="Aksi desain"
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flexShrink: 0 }}
      >
        {/* Autosave status badge */}
        {autosaveStatus && (
          <span
            style={{
              fontSize: '11px',
              color: 'var(--color-text-secondary)',
              marginRight: 'var(--space-2)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {autosaveStatus}
          </span>
        )}

        {/* Undo / Redo */}
        <div className="tooltip-wrapper">
          <button
            id="btn-undo"
            className="btn-icon"
            aria-label="Undo (Ctrl+Z)"
            title="Undo (Ctrl+Z)"
            disabled={!canUndo}
            onClick={onUndoClick}
            style={{ opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'not-allowed' }}
          >
            <Undo2 size={15} />
          </button>
          <span className="tooltip" role="tooltip">Undo (Ctrl+Z)</span>
        </div>

        <div className="tooltip-wrapper">
          <button
            id="btn-redo"
            className="btn-icon"
            aria-label="Redo (Ctrl+Y)"
            title="Redo (Ctrl+Y)"
            disabled={!canRedo}
            onClick={onRedoClick}
            style={{ opacity: canRedo ? 1 : 0.4, cursor: canRedo ? 'pointer' : 'not-allowed' }}
          >
            <Redo2 size={15} />
          </button>
          <span className="tooltip" role="tooltip">Redo (Ctrl+Y)</span>
        </div>

        <div style={{ width: 1, height: 16, background: 'var(--color-border)', margin: '0 4px' }} />

        {/* Reset / Desain Baru */}
        <div className="tooltip-wrapper">
          <button
            id="btn-new"
            className="btn-icon"
            aria-label="Desain baru"
            title="Desain baru"
            onClick={onNewClick}
          >
            <RotateCcw size={15} />
          </button>
          <span className="tooltip" role="tooltip">Desain baru</span>
        </div>

        {/* Muat Draft / JSON */}
        <div className="tooltip-wrapper">
          <button
            id="btn-load"
            className="btn-icon"
            aria-label="Buka daftar draft & muat JSON"
            title="Buka daftar draft & muat JSON"
            onClick={onLoadClick}
          >
            <FolderOpen size={15} />
          </button>
          <span className="tooltip" role="tooltip">Buka draft / Muat JSON</span>
        </div>

        {/* Simpan Desain */}
        <div className="tooltip-wrapper">
          <button
            id="btn-save"
            className="btn-icon"
            aria-label="Simpan draft & unduh JSON"
            title="Simpan draft & unduh JSON"
            onClick={onSaveClick}
          >
            <Save size={15} />
          </button>
          <span className="tooltip" role="tooltip">Simpan draft & unduh JSON</span>
        </div>

        <div style={{ width: 1, height: 16, background: 'var(--color-border)', margin: '0 4px' }} />

        {/* Export CTA */}
        <button
          id="btn-export"
          className="btn-primary"
          aria-label="Export paket listing"
          onClick={onExportClick}
        >
          <Download size={14} />
          Export
        </button>
      </div>
    </header>
  )
}

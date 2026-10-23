/**
 * ui/BatchExportModal.tsx — Modal Pengelola Batch Export
 * Memungkinkan pengguna:
 * 1. Menjalankan batch export untuk seluruh 6 template preset dalam 1 klik
 * 2. Mengunggah beberapa file JSON desain untuk diproses massal
 * 3. Menampilkan progress bar per item dan status Master ZIP
 */

import { useState, useRef } from 'react'
import {
  Archive,
  CheckCircle2,
  FileJson,
  FolderArchive,
  Upload,
  X,
} from 'lucide-react'
import type { BahanType } from '../materials/normalMaps'
import { TEMPLATE_PRESETS } from './TemplateGallery'
import type { JerseyDesignSchema } from '../state/schema'
import type { BatchItemProgress } from '../batch/batchProcessor'

interface BatchExportModalProps {
  isOpen: boolean
  onClose: () => void
  onRunBatch: (designs: JerseyDesignSchema[]) => Promise<void>
  progress: BatchItemProgress | null
  isProcessing: boolean
  onCancel: () => void
}

export function BatchExportModal({
  isOpen,
  onClose,
  onRunBatch,
  progress,
  isProcessing,
  onCancel,
}: BatchExportModalProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'json'>('templates')
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(
    TEMPLATE_PRESETS.map((t) => t.id),
  )
  const [selectedBahan, setSelectedBahan] = useState<BahanType>('milano')
  const [uploadedDesigns, setUploadedDesigns] = useState<JerseyDesignSchema[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const toggleTemplate = (id: string) => {
    if (selectedTemplates.includes(id)) {
      if (selectedTemplates.length > 1) {
        setSelectedTemplates(selectedTemplates.filter((t) => t !== id))
      }
    } else {
      setSelectedTemplates([...selectedTemplates, id])
    }
  }

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newDesigns: JerseyDesignSchema[] = []
    let readCount = 0

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string) as JerseyDesignSchema
          if (parsed && parsed.nama_desain) {
            newDesigns.push(parsed)
          }
        } catch {
          console.warn('Gagal membaca file JSON:', file.name)
        }
        readCount++
        if (readCount === files.length) {
          setUploadedDesigns((prev) => [...prev, ...newDesigns])
        }
      }
      reader.readAsText(file)
    })
  }

  const handleStartBatch = async () => {
    let designsToRun: JerseyDesignSchema[] = []

    if (activeTab === 'templates') {
      const chosen = TEMPLATE_PRESETS.filter((t) => selectedTemplates.includes(t.id))
      designsToRun = chosen.map((tmpl) => ({
        id: `${tmpl.id}_${selectedBahan}`,
        template_id: tmpl.id,
        nama_desain: `${tmpl.nama} (${selectedBahan.toUpperCase()})`,
        bahan: selectedBahan,
        kerah: true,
        warna_dasar: tmpl.warna_dasar,
        layers: tmpl.layers,
        mode_tekstur: 'template',
        gambar_import: null,
        transform_gambar: { scale: 1, offsetX: 0, offsetY: 0, rotation: 0, mirror: false },
        logo: null,
        latar: {
          tipe: 'gradasi',
          warna1: '#0F172A',
          warna2: '#1E293B',
          sudut: 135,
        },
      }))
    } else {
      designsToRun = uploadedDesigns
    }

    if (designsToRun.length === 0) return
    await onRunBatch(designsToRun)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(5, 7, 10, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
    >
      <div
        style={{
          background: 'var(--color-surface-1)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: 'var(--space-4)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <FolderArchive size={20} color="var(--color-accent)" />
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Batch Export — Pemroses Desain Massal
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: 'var(--space-4)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--color-surface-2)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
            <button
              onClick={() => setActiveTab('templates')}
              disabled={isProcessing}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                background: activeTab === 'templates' ? 'var(--color-surface-3)' : 'transparent',
                color: activeTab === 'templates' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontWeight: activeTab === 'templates' ? 600 : 400,
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
              }}
            >
              Preset Template (6 Desain)
            </button>
            <button
              onClick={() => setActiveTab('json')}
              disabled={isProcessing}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                background: activeTab === 'json' ? 'var(--color-surface-3)' : 'transparent',
                color: activeTab === 'json' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontWeight: activeTab === 'json' ? 600 : 400,
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
              }}
            >
              Unggah File JSON ({uploadedDesigns.length})
            </button>
          </div>

          {activeTab === 'templates' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Pilih Template yang Akan Diproses:
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-accent)' }}>
                  {selectedTemplates.length} terpilih
                </span>
              </div>

              {/* Grid Template Checklist */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {TEMPLATE_PRESETS.map((tmpl) => {
                  const isChecked = selectedTemplates.includes(tmpl.id)
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => !isProcessing && toggleTemplate(tmpl.id)}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${isChecked ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        background: isChecked ? 'rgba(230, 57, 70, 0.08)' : 'var(--color-surface-2)',
                        cursor: isProcessing ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: tmpl.warna_dasar,
                            border: '1px solid rgba(255,255,255,0.2)',
                          }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {tmpl.nama}
                        </span>
                      </div>
                      {isChecked && <CheckCircle2 size={14} color="var(--color-accent)" />}
                    </div>
                  )
                })}
              </div>

              {/* Pilihan Bahan untuk Batch */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Bahan Jersey:
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['milano', 'emboss', 'microcool'] as BahanType[]).map((b) => (
                    <button
                      key={b}
                      onClick={() => setSelectedBahan(b)}
                      disabled={isProcessing}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        border: selectedBahan === b ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                        background: selectedBahan === b ? 'rgba(230, 57, 70, 0.15)' : 'var(--color-surface-2)',
                        color: selectedBahan === b ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                      }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".json"
                onChange={handleJsonUpload}
                style={{ display: 'none' }}
              />

              <div
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--color-border-strong)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4)',
                  textAlign: 'center',
                  background: 'var(--color-surface-2)',
                  cursor: isProcessing ? 'default' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Upload size={24} color="var(--color-accent)" />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Pilih beberapa file .json desain
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  Format skema JSON Nemesis3D
                </span>
              </div>

              {uploadedDesigns.length > 0 && (
                <div
                  style={{
                    maxHeight: '120px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    background: 'var(--color-surface-2)',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {uploadedDesigns.map((d, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        padding: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileJson size={13} color="var(--color-accent)" />
                        <span style={{ color: 'var(--color-text-primary)' }}>{d.nama_desain || d.id}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
                        {d.bahan}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Info Output per Desain */}
          <div
            style={{
              background: 'var(--color-surface-2)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              fontSize: '11px',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
              Setiap desain akan menghasilkan 6 file di dalam folder terpisah:
            </div>
            1. Tampak Depan (2048px) • 2. Tampak Belakang (2048px) • 3. 2-Sisi Berdampingan (4096px) • 4. Detail Zoom Bahan • 5. Tekstur Motif Polos • 6. Spesifikasi Desain JSON.
          </div>

          {/* Progress Bar jika sedang berjalan */}
          {isProcessing && progress && (
            <div
              style={{
                background: 'rgba(230, 57, 70, 0.08)',
                border: '1px solid rgba(230, 57, 70, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>
                  Memproses {progress.currentIndex} dari {progress.totalItems}: {progress.currentDesignName}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {progress.percent}%
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--color-surface-3)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${progress.percent}%`,
                    height: '100%',
                    background: 'var(--color-accent)',
                    transition: 'width 200ms ease',
                  }}
                />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                {progress.stepDescription}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface-2)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--space-2)',
          }}
        >
          {isProcessing ? (
            <button
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface-3)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Batalkan
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-1)',
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
              <button
                onClick={handleStartBatch}
                disabled={activeTab === 'json' && uploadedDesigns.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'var(--color-accent)',
                  color: '#FFFFFF',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  cursor: (activeTab === 'json' && uploadedDesigns.length === 0) ? 'not-allowed' : 'pointer',
                  opacity: (activeTab === 'json' && uploadedDesigns.length === 0) ? 0.5 : 1,
                }}
              >
                <Archive size={15} />
                <span>
                  Proses {activeTab === 'templates' ? `${selectedTemplates.length} Template` : `${uploadedDesigns.length} File`} (.ZIP)
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

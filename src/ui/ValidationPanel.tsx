/**
 * ui/ValidationPanel.tsx — Panel Checklist Validasi Desain (Langkah 3: Pratinjau)
 *
 * Menampilkan checklist otomatis dari kesiapan desain sebelum export:
 * - ✅ Template dipilih
 * - ✅ Warna dasar sudah diset
 * - ✅ Motif/layer sudah ada
 * - ✅ Bahan dipilih
 * - ⚠️ Logo belum diunggah (opsional)
 * - ✅ Resolusi output memadai
 * - ✅ Nama desain tidak kosong
 *
 * Juga menyediakan:
 * - Tombol "Salin Link Bagikan" → copyShareLink
 * - Progress bar kesiapan (0–100%)
 * - Ringkasan spesifikasi desain
 */

import { useState } from 'react'
import { Check, AlertTriangle, X, Share2, Copy, CheckCircle2 } from 'lucide-react'
import { copyShareLink } from '../state/shareLink'
import type { JerseyDesignSchema } from '../state/schema'
import type { LogoConfig } from '../texture/logoLayer'

// ─────────────────────────────────────────────────────────────
// Tipe Checklist Item
// ─────────────────────────────────────────────────────────────

type CheckStatus = 'ok' | 'warning' | 'error'

interface CheckItem {
  id: string
  label: string
  detail?: string
  status: CheckStatus
  required: boolean
}

// ─────────────────────────────────────────────────────────────
// Fungsi Evaluasi Checklist
// ─────────────────────────────────────────────────────────────

function evaluateDesign(
  design: JerseyDesignSchema,
  logoConfig: LogoConfig,
): CheckItem[] {
  const items: CheckItem[] = []

  // 1. Template dipilih
  items.push({
    id: 'check-template',
    label: 'Template Dipilih',
    detail: design.template_id !== 'custom' ? `Template: ${design.template_id}` : 'Template kustom',
    status: design.template_id ? 'ok' : 'error',
    required: true,
  })

  // 2. Nama desain
  const hasName = design.nama_desain && design.nama_desain.trim().length > 0
  items.push({
    id: 'check-name',
    label: 'Nama Desain',
    detail: hasName ? `"${design.nama_desain}"` : 'Nama desain kosong',
    status: hasName ? 'ok' : 'warning',
    required: false,
  })

  // 3. Warna dasar
  const validColor = /^#[0-9A-Fa-f]{6}$/.test(design.warna_dasar)
  items.push({
    id: 'check-warna',
    label: 'Warna Dasar',
    detail: validColor ? design.warna_dasar : 'Warna tidak valid',
    status: validColor ? 'ok' : 'error',
    required: true,
  })

  // 4. Layer motif
  const hasLayers = design.layers && design.layers.length > 0
  items.push({
    id: 'check-layers',
    label: 'Motif / Layer',
    detail: hasLayers
      ? `${design.layers.length} layer aktif`
      : design.mode_tekstur === 'import'
        ? 'Mode import gambar'
        : 'Tidak ada layer motif',
    status:
      hasLayers || design.mode_tekstur === 'import' || design.mode_tekstur === 'template'
        ? 'ok'
        : 'warning',
    required: false,
  })

  // 5. Bahan dipilih
  const validBahan = ['milano', 'emboss', 'microcool'].includes(design.bahan)
  items.push({
    id: 'check-bahan',
    label: 'Bahan Dipilih',
    detail: validBahan ? `Bahan: ${design.bahan}` : 'Bahan tidak dikenal',
    status: validBahan ? 'ok' : 'error',
    required: true,
  })

  // 6. Logo (opsional)
  items.push({
    id: 'check-logo',
    label: 'Logo Klub / Sponsor',
    detail: logoConfig.image ? `Posisi: ${logoConfig.posisi}` : 'Belum diunggah (opsional)',
    status: logoConfig.image ? 'ok' : 'warning',
    required: false,
  })

  // 7. Latar
  const validLatar = ['polos', 'gradasi', 'gambar', 'transparan'].includes(design.latar.tipe)
  items.push({
    id: 'check-latar',
    label: 'Latar Belakang',
    detail: validLatar ? `Tipe: ${design.latar.tipe}` : 'Konfigurasi latar tidak valid',
    status: validLatar ? 'ok' : 'warning',
    required: false,
  })

  // 8. Resolusi output
  const res = design.output?.resolusi ?? 0
  items.push({
    id: 'check-resolusi',
    label: 'Resolusi Output',
    detail: res >= 2048 ? `${res}×${res}px (Premium)` : `${res}×${res}px`,
    status: res >= 2048 ? 'ok' : res >= 1024 ? 'warning' : 'error',
    required: false,
  })

  // 9. Model & Kerah
  const collarDesc = design.kerah ? (design.tipe_kerah === 'vneck' ? 'Kerah V-Neck' : 'Kerah Ribbon') : 'Tanpa kerah'
  const sleeveDesc = design.lengan_panjang ? 'Lengan Panjang' : 'Lengan Pendek'
  items.push({
    id: 'check-model',
    label: 'Model Jersey',
    detail: `${collarDesc}, ${sleeveDesc}`,
    status: 'ok',
    required: false,
  })

  return items
}

function computeReadiness(items: CheckItem[]): number {
  const required = items.filter((i) => i.required)
  const optional = items.filter((i) => !i.required)
  const requiredOk = required.filter((i) => i.status === 'ok').length
  const optionalOk = optional.filter((i) => i.status === 'ok').length
  const maxScore = required.length * 2 + optional.length
  const score = requiredOk * 2 + optionalOk
  return Math.round((score / maxScore) * 100)
}

// ─────────────────────────────────────────────────────────────
// Status Icon
// ─────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === 'ok') return <Check size={13} color="var(--color-success)" strokeWidth={2.5} />
  if (status === 'warning') return <AlertTriangle size={13} color="var(--color-warning)" strokeWidth={2.5} />
  return <X size={13} color="var(--color-error)" strokeWidth={2.5} />
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

interface ValidationPanelProps {
  design: JerseyDesignSchema
  logoConfig: LogoConfig
  onProceedExport: () => void
}

export function ValidationPanel({ design, logoConfig, onProceedExport }: ValidationPanelProps) {
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'error'>('idle')

  const checkItems = evaluateDesign(design, logoConfig)
  const readiness = computeReadiness(checkItems)
  const hasErrors = checkItems.some((i) => i.required && i.status === 'error')

  const readinessColor =
    readiness >= 90
      ? 'var(--color-success)'
      : readiness >= 60
        ? 'var(--color-warning)'
        : 'var(--color-error)'

  async function handleShare() {
    try {
      await copyShareLink(design)
      setShareState('copied')
      setTimeout(() => setShareState('idle'), 3000)
    } catch {
      setShareState('error')
      setTimeout(() => setShareState('idle'), 3000)
    }
  }

  return (
    <div
      id="validation-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px 12px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: 4,
          }}
        >
          Pratinjau & Validasi
        </h2>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
          Periksa kelengkapan desain sebelum export ke paket listing marketplace.
        </p>
      </div>

      {/* Scrollable Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        {/* Readiness Score */}
        <div
          id="readiness-score"
          style={{
            background: 'var(--color-surface-2)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              KESIAPAN DESAIN
            </span>
            <span
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 800,
                color: readinessColor,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {readiness}%
            </span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: 'var(--color-surface-3)',
              overflow: 'hidden',
            }}
          >
            <div
              id="readiness-bar"
              style={{
                height: '100%',
                width: `${readiness}%`,
                background: readinessColor,
                borderRadius: 3,
                transition: 'width 0.6s var(--ease-standard), background 0.4s',
              }}
            />
          </div>

          {readiness >= 90 && (
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-success)',
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <CheckCircle2 size={12} /> Desain siap untuk di-export!
            </p>
          )}
        </div>

        {/* Checklist Items */}
        <div
          id="validation-checklist"
          role="list"
          aria-label="Checklist validasi desain"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {checkItems.map((item) => (
            <div
              key={item.id}
              id={item.id}
              role="listitem"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background:
                  item.status === 'ok'
                    ? 'rgba(34, 197, 94, 0.06)'
                    : item.status === 'warning'
                      ? 'rgba(245, 158, 11, 0.06)'
                      : 'rgba(239, 68, 68, 0.08)',
                border: '1px solid',
                borderColor:
                  item.status === 'ok'
                    ? 'rgba(34, 197, 94, 0.15)'
                    : item.status === 'warning'
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)',
              }}
            >
              <div style={{ marginTop: 1, flexShrink: 0 }}>
                <StatusIcon status={item.status} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {item.label}
                  </span>
                  {item.required && (
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        color: 'var(--color-text-disabled)',
                        background: 'var(--color-surface-3)',
                        padding: '1px 5px',
                        borderRadius: 3,
                      }}
                    >
                      WAJIB
                    </span>
                  )}
                </div>
                {item.detail && (
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-text-secondary)',
                      marginTop: 2,
                      marginBottom: 0,
                    }}
                  >
                    {item.detail}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Spesifikasi Ringkasan */}
        <div
          id="design-summary"
          style={{
            background: 'var(--color-surface-2)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            border: '1px solid var(--color-border)',
          }}
        >
          <h3
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 10,
              letterSpacing: '0.06em',
            }}
          >
            RINGKASAN SPESIFIKASI
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                { label: 'Nama', value: design.nama_desain || '—' },
                { label: 'Template', value: design.template_id || '—' },
                { label: 'Bahan', value: design.bahan },
                { label: 'Kerah', value: design.kerah ? 'Ya' : 'Tidak' },
                { label: 'Lengan', value: design.lengan_panjang ? 'Panjang' : 'Pendek' },
                { label: 'Mode Tekstur', value: design.mode_tekstur || 'template' },
                { label: 'Jumlah Layer', value: `${design.layers.length} layer` },
                { label: 'Warna Dasar', value: design.warna_dasar },
                { label: 'Latar', value: design.latar.tipe },
                { label: 'Logo', value: logoConfig.image ? `✓ ${logoConfig.posisi}` : '—' },
                { label: 'Resolusi', value: `${design.output?.resolusi ?? 2048}px` },
              ].map(({ label, value }) => (
                <tr key={label}>
                  <td
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-text-secondary)',
                      paddingBottom: 5,
                      paddingRight: 12,
                      verticalAlign: 'top',
                      width: '45%',
                    }}
                  >
                    {label}
                  </td>
                  <td
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      paddingBottom: 5,
                      fontFamily: value.startsWith('#') ? 'var(--font-mono)' : undefined,
                    }}
                  >
                    {value.startsWith('#') ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            background: value,
                            border: '1px solid rgba(255,255,255,0.15)',
                            flexShrink: 0,
                          }}
                        />
                        {value}
                      </span>
                    ) : (
                      value
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Share Link */}
        <div
          id="share-link-section"
          style={{
            background: 'var(--color-surface-2)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Share2 size={14} color="var(--color-accent)" />
            <h3
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                letterSpacing: '0.06em',
              }}
            >
              BAGIKAN DESAIN
            </h3>
          </div>
          <p
            style={{
              fontSize: '11px',
              color: 'var(--color-text-secondary)',
              marginBottom: 10,
              lineHeight: 1.5,
            }}
          >
            Salin link untuk berbagi desain ini (tanpa gambar/logo import). 
            Penerima dapat membukanya langsung di browser.
          </p>
          <button
            id="btn-copy-share-link"
            className="btn-secondary"
            onClick={handleShare}
            style={{
              width: '100%',
              justifyContent: 'center',
              gap: 6,
              display: 'flex',
              alignItems: 'center',
              background:
                shareState === 'copied'
                  ? 'rgba(34, 197, 94, 0.15)'
                  : shareState === 'error'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : undefined,
              borderColor:
                shareState === 'copied'
                  ? 'var(--color-success)'
                  : shareState === 'error'
                    ? 'var(--color-error)'
                    : undefined,
              color:
                shareState === 'copied'
                  ? 'var(--color-success)'
                  : shareState === 'error'
                    ? 'var(--color-error)'
                    : undefined,
              transition: 'all 0.3s',
            }}
          >
            {shareState === 'copied' ? (
              <>
                <Check size={13} /> Link Tersalin!
              </>
            ) : shareState === 'error' ? (
              <>
                <X size={13} /> Gagal Menyalin
              </>
            ) : (
              <>
                <Copy size={13} /> Salin Link Desain
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer CTA */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: 'var(--color-surface-1)',
          gap: 12,
        }}
      >
        <div>
          {hasErrors && (
            <p style={{ fontSize: '11px', color: 'var(--color-error)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={11} /> Ada item wajib yang belum lengkap
            </p>
          )}
        </div>
        <button
          id="btn-proceed-export"
          className="btn-primary"
          onClick={onProceedExport}
          title={hasErrors ? 'Lengkapi item wajib terlebih dahulu' : 'Lanjut ke Export'}
          style={{
            opacity: hasErrors ? 0.6 : 1,
            flexShrink: 0,
          }}
        >
          Export →
        </button>
      </div>
    </div>
  )
}

/**
 * ui/DraftsModal.tsx — Modal Daftar Draft Desain Tersimpan
 * Menampilkan daftar desain dari IndexedDB dengan thumbnail, nama, dan tanggal.
 * Pengguna dapat membuka, mengganti nama, atau menghapus draft.
 */

import { Check, Edit2, FolderOpen, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { DraftItem } from '../state/indexedDb'

interface DraftsModalProps {
  isOpen: boolean
  onClose: () => void
  drafts: DraftItem[]
  onOpenDraft: (draft: DraftItem) => void
  onDeleteDraft: (id: string) => void
  onRenameDraft: (id: string, newName: string) => void
}

export function DraftsModal({
  isOpen,
  onClose,
  drafts,
  onOpenDraft,
  onDeleteDraft,
  onRenameDraft,
}: DraftsModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState<string>('')

  if (!isOpen) return null

  const handleStartRename = (draft: DraftItem) => {
    setEditingId(draft.id)
    setEditName(draft.nama_desain)
  }

  const handleSaveRename = (id: string) => {
    if (editName.trim()) {
      onRenameDraft(id, editName.trim())
    }
    setEditingId(null)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drafts-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        padding: 'var(--space-4)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 580,
          maxHeight: '85vh',
          background: 'var(--color-surface-1)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4)',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface-2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <FolderOpen size={20} color="var(--color-accent)" />
            <h2
              id="drafts-modal-title"
              style={{
                fontSize: 'var(--text-md)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}
            >
              Draft Desain Tersimpan ({drafts.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body / Draft List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          {drafts.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-8) var(--space-4)',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <FolderOpen size={36} color="var(--color-text-disabled)" />
              <p style={{ fontSize: 'var(--text-sm)' }}>
                Belum ada draft tersimpan di browser ini.
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-disabled)' }}>
                Setiap perubahan pada desain akan otomatis dicadangkan ke IndexedDB lokal.
              </p>
            </div>
          ) : (
            drafts.map((draft) => {
              const dateStr = new Date(draft.updatedAt).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })

              return (
                <div
                  key={draft.id}
                  style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                  }}
                >
                  {/* Thumbnail / Preview Box */}
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-surface-3)',
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {draft.thumbnail ? (
                      <img
                        src={draft.thumbnail}
                        alt={`Preview ${draft.nama_desain}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background: draft.design.warna_dasar || '#1B2A41',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          fontSize: '10px',
                          fontWeight: 700,
                        }}
                      >
                        3D
                      </div>
                    )}
                  </div>

                  {/* Info & Rename */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingId === draft.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(draft.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          autoFocus
                          style={{
                            background: 'var(--color-surface-1)',
                            border: '1px solid var(--color-accent)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '4px 8px',
                            color: 'var(--color-text-primary)',
                            fontSize: 'var(--text-sm)',
                            fontFamily: 'var(--font-sans)',
                            width: '100%',
                          }}
                        />
                        <button
                          onClick={() => handleSaveRename(draft.id)}
                          style={{
                            background: 'var(--color-accent)',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            padding: '6px',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                          }}
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span
                          style={{
                            fontSize: 'var(--text-sm)',
                            fontWeight: 600,
                            color: 'var(--color-text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {draft.nama_desain}
                        </span>
                        <button
                          onClick={() => handleStartRename(draft)}
                          title="Ganti nama"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-secondary)',
                            padding: 0,
                          }}
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        marginTop: '4px',
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span style={{ textTransform: 'capitalize' }}>Bahan {draft.design.bahan}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <button
                      onClick={() => {
                        onOpenDraft(draft)
                        onClose()
                      }}
                      className="btn-primary"
                      style={{
                        padding: '6px 12px',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                      }}
                    >
                      Buka
                    </button>
                    <button
                      onClick={() => onDeleteDraft(draft.id)}
                      title="Hapus draft"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-text-disabled)',
                        padding: '6px',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

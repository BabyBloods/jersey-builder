/**
 * state/history.ts — Riwayat Undo / Redo untuk Editor Nemesis3D
 * Sesuai spesifikasi BRIEF bagian 9:
 * - Minimal 20 langkah riwayat undo/redo
 * - Mendukung shortcut keyboard (Ctrl+Z / Ctrl+Y)
 */

export class HistoryStack<T> {
  private past: T[] = []
  private future: T[] = []
  private maxSteps: number

  constructor(maxSteps: number = 30) {
    this.maxSteps = maxSteps
  }

  /**
   * Simpan snapshot state baru
   */
  public push(state: T) {
    // Clone state agar referensi terisolasi
    const cloned = JSON.parse(JSON.stringify(state)) as T

    // Jika state persis sama dengan snapshot terakhir, jangan duplikasi
    if (this.past.length > 0) {
      const last = this.past[this.past.length - 1]
      if (JSON.stringify(last) === JSON.stringify(cloned)) {
        return
      }
    }

    this.past.push(cloned)
    if (this.past.length > this.maxSteps) {
      this.past.shift() // Buang yang paling lama
    }

    // Setiap aksi baru membersihkan tumpukan redo
    this.future = []
  }

  /**
   * Batalkan aksi terakhir (Undo)
   */
  public undo(currentState: T): T | null {
    if (this.past.length === 0) return null

    const previous = this.past.pop()!
    this.future.push(JSON.parse(JSON.stringify(currentState)) as T)

    return JSON.parse(JSON.stringify(previous)) as T
  }

  /**
   * Ulangi aksi yang dibatalkan (Redo)
   */
  public redo(currentState: T): T | null {
    if (this.future.length === 0) return null

    const next = this.future.pop()!
    this.past.push(JSON.parse(JSON.stringify(currentState)) as T)

    return JSON.parse(JSON.stringify(next)) as T
  }

  public canUndo(): boolean {
    return this.past.length > 0
  }

  public canRedo(): boolean {
    return this.future.length > 0
  }

  public clear() {
    this.past = []
    this.future = []
  }
}

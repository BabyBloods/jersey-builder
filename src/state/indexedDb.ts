/**
 * state/indexedDb.ts — Penyimpanan Draft Lokal Menggunakan IndexedDB
 * Sesuai spesifikasi BRIEF bagian 5.1 & 5.11:
 * - Menyimpan draft desain dengan thumbnail, nama, dan tanggal pembaruan
 * - Bisa dibuka, diganti nama, atau dihapus
 * - Mendukung autosave berkala
 */

import type { JerseyDesignSchema } from './schema'

export interface DraftItem {
  id: string
  template_id: string
  nama_desain: string
  updatedAt: number
  thumbnail?: string // dataURL 256x256
  design: JerseyDesignSchema
}

const DB_NAME = 'nemesis3d_db'
const DB_VERSION = 1
const STORE_NAME = 'drafts'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return dbPromise
}

/**
 * Simpan atau perbarui draft desain di IndexedDB
 */
export async function saveDraftToDb(draft: DraftItem): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(draft)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Ambil satu draft berdasarkan id
 */
export async function getDraftFromDb(id: string): Promise<DraftItem | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onsuccess = () => resolve((request.result as DraftItem) || null)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Ambil seluruh daftar draft diurutkan berdasarkan tanggal terbaru
 */
export async function getAllDraftsFromDb(): Promise<DraftItem[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('updatedAt')
    const request = index.getAll()

    request.onsuccess = () => {
      const results = (request.result as DraftItem[]) || []
      // Urutkan dari yang paling baru diupdate
      results.sort((a, b) => b.updatedAt - a.updatedAt)
      resolve(results)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Hapus draft berdasarkan id
 */
export async function deleteDraftFromDb(id: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Ganti nama draft
 */
export async function renameDraftInDb(id: string, newName: string): Promise<void> {
  const draft = await getDraftFromDb(id)
  if (!draft) return
  draft.nama_desain = newName
  draft.design.nama_desain = newName
  draft.updatedAt = Date.now()
  await saveDraftToDb(draft)
}

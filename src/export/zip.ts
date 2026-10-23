/**
 * export/zip.ts — Generator file ZIP murni (Zero-Dependency)
 * Mengemas file-file biner ke format PKZIP standar untuk browser.
 * Cepat, andal, dan tidak memerlukan paket eksternal npm.
 */

// Tabel CRC32 untuk perhitungan checksum
const CRC_TABLE = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  CRC_TABLE[i] = c
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

export interface ZipEntry {
  name: string
  data: Uint8Array
}

/**
 * Buat file ZIP dari array file biner
 */
export function createZipBlob(entries: ZipEntry[]): Blob {
  const parts: Uint8Array[] = []
  const centralDirParts: Uint8Array[] = []
  let offset = 0

  const encoder = new TextEncoder()

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name)
    const crc = crc32(entry.data)
    const size = entry.data.length

    // --- Local File Header (30 byte + nama file) ---
    const localHeader = new Uint8Array(30 + nameBytes.length)
    const lView = new DataView(localHeader.buffer)

    lView.setUint32(0, 0x04034b50, true) // Signature
    lView.setUint16(4, 20, true)         // Version needed (2.0)
    lView.setUint16(6, 0, true)          // General purpose bit flag
    lView.setUint16(8, 0, true)          // Compression method: 0 (STORE)
    lView.setUint16(10, 0, true)         // File mod time
    lView.setUint16(12, 0, true)         // File mod date
    lView.setUint32(14, crc, true)       // CRC32
    lView.setUint32(18, size, true)      // Compressed size
    lView.setUint32(22, size, true)      // Uncompressed size
    lView.setUint16(26, nameBytes.length, true) // Filename length
    lView.setUint16(28, 0, true)         // Extra field length
    localHeader.set(nameBytes, 30)

    parts.push(localHeader)
    parts.push(entry.data)

    // --- Central Directory Header (46 byte + nama file) ---
    const cdHeader = new Uint8Array(46 + nameBytes.length)
    const cdView = new DataView(cdHeader.buffer)

    cdView.setUint32(0, 0x02014b50, true) // Signature
    cdView.setUint16(4, 20, true)          // Version made by
    cdView.setUint16(6, 20, true)          // Version needed
    cdView.setUint16(8, 0, true)           // Bit flag
    cdView.setUint16(10, 0, true)          // Compression method
    cdView.setUint16(12, 0, true)          // Mod time
    cdView.setUint16(14, 0, true)          // Mod date
    cdView.setUint32(16, crc, true)        // CRC32
    cdView.setUint32(20, size, true)       // Compressed size
    cdView.setUint32(24, size, true)       // Uncompressed size
    cdView.setUint16(28, nameBytes.length, true) // Filename length
    cdView.setUint16(30, 0, true)          // Extra field length
    cdView.setUint16(32, 0, true)          // Comment length
    cdView.setUint16(34, 0, true)          // Disk number start
    cdView.setUint16(36, 0, true)          // Internal file attributes
    cdView.setUint32(38, 0, true)          // External file attributes
    cdView.setUint32(42, offset, true)     // Relative offset of local header
    cdHeader.set(nameBytes, 46)

    centralDirParts.push(cdHeader)

    offset += localHeader.length + entry.data.length
  }

  const centralDirOffset = offset
  let centralDirSize = 0
  for (const cd of centralDirParts) {
    centralDirSize += cd.length
  }

  // --- End of Central Directory Record (22 byte) ---
  const eocd = new Uint8Array(22)
  const eView = new DataView(eocd.buffer)

  eView.setUint32(0, 0x06054b50, true) // Signature
  eView.setUint16(4, 0, true)          // Disk number
  eView.setUint16(6, 0, true)          // Start disk
  eView.setUint16(8, entries.length, true)  // Disk entries count
  eView.setUint16(10, entries.length, true) // Total entries count
  eView.setUint32(12, centralDirSize, true) // Central directory size
  eView.setUint32(16, centralDirOffset, true) // Central directory offset
  eView.setUint16(20, 0, true)         // Comment length

  // Gabungkan semua bagian menjadi Blob ZIP
  const allParts = [...parts, ...centralDirParts, eocd]
  return new Blob(allParts as unknown as BlobPart[], { type: 'application/zip' })
}

/**
 * Memicu download Blob dari browser
 */
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

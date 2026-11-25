import fs from 'fs'
import path from 'path'

const STORE_PATH = path.resolve(process.cwd(), '.hidden_posts.json')
let inMemoryHidden = new Set<string>()

function loadStore(): Set<string> {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8')
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) {
        inMemoryHidden = new Set<string>(arr.map(String))
      }
    }
  } catch {
    // If filesystem is read-only or error occurs, rely on in-memory Set
  }
  return inMemoryHidden
}

function saveStore(): void {
  try {
    const arr = Array.from(inMemoryHidden)
    fs.writeFileSync(STORE_PATH, JSON.stringify(arr, null, 2), 'utf-8')
  } catch {
    // In-memory set stays intact
  }
}

// Initial load
loadStore()

export function isPostHidden(id: string): boolean {
  if (!id) return false
  loadStore()
  return inMemoryHidden.has(String(id))
}

export function hidePost(id: string): void {
  if (!id) return
  loadStore()
  inMemoryHidden.add(String(id))
  saveStore()
}

export function unhidePost(id: string): void {
  if (!id) return
  loadStore()
  inMemoryHidden.delete(String(id))
  saveStore()
}

export function toggleHiddenPost(id: string): boolean {
  if (!id) return true
  loadStore()
  const strId = String(id)
  if (inMemoryHidden.has(strId)) {
    inMemoryHidden.delete(strId)
    saveStore()
    return true // Now published (visible)
  } else {
    inMemoryHidden.add(strId)
    saveStore()
    return false // Now hidden
  }
}

export function getHiddenPostIds(): Set<string> {
  loadStore()
  return new Set(inMemoryHidden)
}

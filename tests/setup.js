import 'fake-indexeddb/auto'
import { beforeEach, vi } from 'vitest'

// Mock para URL.createObjectURL y URL.revokeObjectURL
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
} else {
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:mock-url')
}

if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = vi.fn()
} else {
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
}

// Limpieza de localStorage antes de cada prueba
beforeEach(() => {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
})

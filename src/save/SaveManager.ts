import { SaveData, SAVE_VERSION } from './SaveData'

const DB_NAME = 'UndergroundExplorerDB'
const STORE_NAME = 'saves'

export class SaveManager {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1)

      request.onerror = () => {
        console.error('Failed to open IndexedDB')
        reject(new Error('Could not open database'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'slot' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async save(slot: number, data: SaveData): Promise<boolean> {
    if (!this.db) {
      console.error('Database not initialized')
      return false
    }

    return new Promise((resolve) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const request = store.put({
        slot: slot,
        timestamp: data.timestamp,
        data: data
      })

      request.onsuccess = () => resolve(true)
      request.onerror = () => {
        console.error('Failed to save')
        resolve(false)
      }
    })
  }

  async load(slot: number): Promise<SaveData | null> {
    if (!this.db) {
      console.error('Database not initialized')
      return null
    }

    return new Promise((resolve) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(slot)

      request.onsuccess = () => {
        const result = request.result
        if (result) {
          resolve(result.data as SaveData)
        } else {
          resolve(null)
        }
      }

      request.onerror = () => {
        console.error('Failed to load')
        resolve(null)
      }
    })
  }

  async listSaves(): Promise<number[]> {
    if (!this.db) {
      console.error('Database not initialized')
      return []
    }

    return new Promise((resolve) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAllKeys()

      request.onsuccess = () => {
        resolve(request.result as number[])
      }

      request.onerror = () => {
        console.error('Failed to list saves')
        resolve([])
      }
    })
  }

  async delete(slot: number): Promise<boolean> {
    if (!this.db) {
      console.error('Database not initialized')
      return false
    }

    return new Promise((resolve) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(slot)

      request.onsuccess = () => resolve(true)
      request.onerror = () => {
        console.error('Failed to delete')
        resolve(false)
      }
    })
  }
}

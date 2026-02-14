import { SaveManager } from './SaveManager'
import { SaveData, SAVE_VERSION } from './SaveData'

export class AutoSave {
  private saveManager: SaveManager
  private lastSaveTime: number = 0
  private saveInterval: number = 30000 // 30 seconds
  private isDirty: boolean = false

  constructor(saveManager: SaveManager) {
    this.saveManager = saveManager
  }

  markDirty(): void {
    this.isDirty = true
  }

  update(currentTime: number): void {
    if (currentTime - this.lastSaveTime < this.saveInterval) return
    if (!this.isDirty) return

    // Trigger save (will be handled by Game class)
    this.lastSaveTime = currentTime
    this.isDirty = false
  }

  shouldSave(): boolean {
    return this.isDirty
  }

  getLastSaveTime(): number {
    return this.lastSaveTime
  }

  async save(slot: number, data: SaveData): Promise<boolean> {
    const success = await this.saveManager.save(slot, data)
    if (success) {
      this.lastSaveTime = performance.now()
      this.isDirty = false
    }
    return success
  }

  async load(slot: number): Promise<SaveData | null> {
    return this.saveManager.load(slot)
  }
}

import { BlockType } from '../world/BlockType'

export interface InventoryItem {
  type: 'block' | 'tool' | 'weapon'
  id: string
  name: string
  count: number
  blockType?: BlockType
}

export class Inventory {
  private hotbar: (InventoryItem | null)[] = [null, null, null, null, null, null]
  private backpack: (InventoryItem | null)[] = new Array(24).fill(null)
  private selectedSlot: number = 0

  constructor() {
    // 初始物品
    this.hotbar[0] = { type: 'tool', id: 'pickaxe', name: '镐', count: 1 }
    this.hotbar[1] = { type: 'weapon', id: 'sword', name: '剑', count: 1 }
    this.hotbar[2] = { type: 'block', id: 'dirt', name: '泥土', count: 64, blockType: BlockType.DIRT }
  }

  getSelectedSlot(): number {
    return this.selectedSlot
  }

  setSelectedSlot(slot: number): void {
    this.selectedSlot = Math.max(0, Math.min(5, slot))
  }

  getSelectedItem(): InventoryItem | null {
    return this.hotbar[this.selectedSlot]
  }

  getHotbar(): (InventoryItem | null)[] {
    return this.hotbar
  }

  addItem(item: InventoryItem): boolean {
    // 先尝试堆叠到快捷栏
    for (let i = 0; i < this.hotbar.length; i++) {
      const slot = this.hotbar[i]
      if (slot && slot.id === item.id && slot.count < 64) {
        const canAdd = Math.min(item.count, 64 - slot.count)
        slot.count += canAdd
        item.count -= canAdd
        if (item.count === 0) return true
      }
    }

    // 尝试堆叠到背包
    for (let i = 0; i < this.backpack.length; i++) {
      const slot = this.backpack[i]
      if (slot && slot.id === item.id && slot.count < 64) {
        const canAdd = Math.min(item.count, 64 - slot.count)
        slot.count += canAdd
        item.count -= canAdd
        if (item.count === 0) return true
      }
    }

    // 尝试放入空槽
    for (let i = 0; i < this.hotbar.length; i++) {
      if (!this.hotbar[i]) {
        this.hotbar[i] = { ...item }
        return true
      }
    }

    for (let i = 0; i < this.backpack.length; i++) {
      if (!this.backpack[i]) {
        this.backpack[i] = { ...item }
        return true
      }
    }

    return false // 背包已满
  }

  removeItem(slotIndex: number, count: number = 1): InventoryItem | null {
    const item = this.hotbar[slotIndex]
    if (!item) return null

    const removed = { ...item, count: Math.min(count, item.count) }
    item.count -= removed.count

    if (item.count <= 0) {
      this.hotbar[slotIndex] = null
    }

    return removed
  }

  decreaseSelectedItem(count: number = 1): void {
    const item = this.hotbar[this.selectedSlot]
    if (item) {
      item.count -= count
      if (item.count <= 0) {
        this.hotbar[this.selectedSlot] = null
      }
    }
  }
}

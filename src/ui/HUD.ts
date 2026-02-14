import { InventoryItem } from '../player/Inventory'

export class HUD {
  private healthFill: HTMLElement
  private hotbarSlots: HTMLElement[] = []
  private instructions: HTMLElement
  private crosshair: HTMLElement

  constructor() {
    this.createHUD()
    this.healthFill = document.getElementById('health-fill')!
    this.instructions = document.getElementById('instructions')!
    this.crosshair = document.getElementById('crosshair')!

    // 初始化快捷栏
    for (let i = 1; i <= 6; i++) {
      const slot = document.getElementById(`hotbar-${i}`)
      if (slot) this.hotbarSlots.push(slot)
    }

    this.setActiveSlot(0)
  }

  private createHUD(): void {
    const hudContainer = document.createElement('div')
    hudContainer.innerHTML = `
      <!-- 准心 -->
      <div id="crosshair" class="crosshair"></div>

      <!-- 生命条 -->
      <div class="hud health-bar">
        <span class="label">❤️</span>
        <div class="bar-container">
          <div id="health-fill" class="bar-fill" style="width: 100%"></div>
        </div>
      </div>

      <!-- 快捷栏 -->
      <div class="hud hotbar">
        <div id="hotbar-1" class="hotbar-slot active">1</div>
        <div id="hotbar-2" class="hotbar-slot">2</div>
        <div id="hotbar-3" class="hotbar-slot">3</div>
        <div id="hotbar-4" class="hotbar-slot">4</div>
        <div id="hotbar-5" class="hotbar-slot">5</div>
        <div id="hotbar-6" class="hotbar-slot">6</div>
      </div>

      <!-- 提示 -->
      <div id="instructions" class="instructions">
        点击开始 | WASD 移动 | 空格 跳跃 | Shift 快速下降 | 鼠标视角
      </div>
    `
    document.body.appendChild(hudContainer)
  }

  setHealth(health: number, maxHealth: number = 100): void {
    const percentage = (health / maxHealth) * 100
    this.healthFill.style.width = `${percentage}%`
  }

  updateHealthBar(current: number, max: number): void {
    if (!this.healthFill) return

    const percentage = (current / max) * 100
    const color = percentage > 50 ? '#44ff44' : percentage > 25 ? '#ffff44' : '#ff4444'

    this.healthFill.style.width = `${percentage}%`
    this.healthFill.style.backgroundColor = color
  }

  setActiveSlot(index: number): void {
    this.hotbarSlots.forEach((slot, i) => {
      slot.classList.toggle('active', i === index)
    })
  }

  setHotbarItems(items: (InventoryItem | null)[]): void {
    this.hotbarSlots.forEach((slot, i) => {
      const item = items[i]
      if (item) {
        // 显示物品名称的前2个字符和数量
        const shortName = item.name.substring(0, 2)
        slot.innerHTML = `<span class="item-name">${shortName}</span><span class="item-count">${item.count}</span>`
      } else {
        // 空槽位显示数字
        slot.innerHTML = `${i + 1}`
      }
    })
  }

  hideInstructions(): void {
    this.instructions.style.opacity = '0'
    setTimeout(() => {
      this.instructions.style.display = 'none'
    }, 500)
  }

  showInstructions(): void {
    this.instructions.style.display = 'block'
    setTimeout(() => {
      this.instructions.style.opacity = '1'
    }, 10)
  }

  setCrosshairVisible(visible: boolean): void {
    this.crosshair.style.display = visible ? 'block' : 'none'
  }
}

# Phase 2: Weapons, Inventory & Mining Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 添加背包系统、方块挖掘/放置、武器系统，让游戏具备完整的探索和战斗循环。

**Architecture:** 背包系统管理物品和快捷栏，挖掘系统通过射线检测目标方块，武器系统处理不同武器的攻击逻辑。

**Tech Stack:** TypeScript + Three.js (Raycaster for block detection)

---

## Task 1: 背包系统

**Files:**
- Create: `src/player/Inventory.ts`
- Modify: `src/player/PlayerController.ts`
- Modify: `src/main.ts`

**Step 1: 创建 src/player/Inventory.ts**

```typescript
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
```

**Step 2: 更新 src/player/PlayerController.ts 添加背包和数字键切换**

在 PlayerController 类中添加：
```typescript
import { Inventory } from './Inventory'

// 在类属性中添加
private inventory: Inventory

// 在构造函数中
this.inventory = new Inventory()

// 在 setupControls 中添加数字键监听
// 数字键 1-6 切换快捷栏
for (let i = 1; i <= 6; i++) {
  document.addEventListener('keydown', (e) => {
    if (e.code === `Digit${i}` || e.code === `Numpad${i}`) {
      this.inventory.setSelectedSlot(i - 1)
    }
  })
}

// 添加 getter
getInventory(): Inventory {
  return this.inventory
}
```

**Step 3: 更新 src/ui/HUD.ts 显示快捷栏物品**

```typescript
// 在 setHotbarItems 方法中更新显示
setHotbarItems(items: (InventoryItem | null)[]): void {
  items.forEach((item, i) => {
    const slot = this.hotbarSlots[i]
    if (slot) {
      if (item) {
        slot.innerHTML = `<span>${item.name.substring(0, 2)}</span><small>${item.count}</small>`
      } else {
        slot.innerHTML = `${i + 1}`
      }
    }
  })
}
```

**Step 4: 更新 src/main.ts 集成背包**

在游戏循环中更新 HUD：
```typescript
// 在 update 方法中
const items = playerController.getInventory().getHotbar()
hud.setHotbarItems(items)
hud.setActiveSlot(playerController.getInventory().getSelectedSlot())
```

**Step 5: 验证**

运行 `npm run dev`，测试：
- 数字键 1-6 切换快捷栏
- HUD 显示物品名称和数量

**Step 6: 提交**

```bash
git add .
git commit -m "feat: add inventory system with hotbar

- Create Inventory class with item management
- Add hotbar slot selection with number keys
- Display items in HUD hotbar

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: 方块挖掘系统

**Files:**
- Create: `src/player/BlockInteraction.ts`
- Modify: `src/player/PlayerController.ts`
- Modify: `src/world/World.ts`

**Step 1: 创建 src/player/BlockInteraction.ts**

```typescript
import * as THREE from 'three'
import { World } from '../world/World'
import { BlockType } from '../world/BlockType'

export interface BlockHit {
  position: THREE.Vector3
  normal: THREE.Vector3
  blockType: BlockType
}

export class BlockInteraction {
  private camera: THREE.PerspectiveCamera
  private world: World
  private raycaster: THREE.Raycaster
  private reachDistance: number = 5
  private highlightMesh: THREE.Mesh | null = null

  constructor(camera: THREE.PerspectiveCamera, world: World, scene: THREE.Scene) {
    this.camera = camera
    this.world = world
    this.raycaster = new THREE.Raycaster()
    this.raycaster.far = this.reachDistance

    // 创建高亮方块
    const geometry = new THREE.BoxGeometry(1.01, 1.01, 1.01)
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.3,
      transparent: true,
      wireframe: false,
      depthTest: true
    })
    this.highlightMesh = new THREE.Mesh(geometry, material)
    this.highlightMesh.visible = false
    scene.add(this.highlightMesh)
  }

  getTargetBlock(): BlockHit | null {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera)

    // 获取相机前方所有区块的网格
    const direction = new THREE.Vector3()
    this.camera.getWorldDirection(direction)

    const playerPos = this.camera.position.clone()
    const hitBlock = this.raycastBlocks(playerPos, direction)

    return hitBlock
  }

  private raycastBlocks(origin: THREE.Vector3, direction: THREE.Vector3): BlockHit | null {
    const step = 0.1
    const maxDistance = this.reachDistance

    let current = origin.clone()

    for (let d = 0; d < maxDistance; d += step) {
      current = origin.clone().add(direction.clone().multiplyScalar(d))

      const blockX = Math.floor(current.x)
      const blockY = Math.floor(current.y)
      const blockZ = Math.floor(current.z)

      const blockType = this.world.getBlock(blockX, blockY, blockZ)

      if (blockType !== BlockType.AIR && blockType !== undefined) {
        // 计算法线方向（从哪个面进入）
        const prevPos = origin.clone().add(direction.clone().multiplyScalar(d - step))
        const normal = this.calculateNormal(prevPos, blockX, blockY, blockZ)

        return {
          position: new THREE.Vector3(blockX, blockY, blockZ),
          normal: normal,
          blockType: blockType
        }
      }
    }

    return null
  }

  private calculateNormal(prevPos: THREE.Vector3, blockX: number, blockY: number, blockZ: number): THREE.Vector3 {
    const normal = new THREE.Vector3()

    if (prevPos.x < blockX) normal.set(-1, 0, 0)
    else if (prevPos.x > blockX + 1) normal.set(1, 0, 0)
    else if (prevPos.y < blockY) normal.set(0, -1, 0)
    else if (prevPos.y > blockY + 1) normal.set(0, 1, 0)
    else if (prevPos.z < blockZ) normal.set(0, 0, -1)
    else if (prevPos.z > blockZ + 1) normal.set(0, 0, 1)

    return normal
  }

  updateHighlight(): void {
    const hit = this.getTargetBlock()

    if (hit && this.highlightMesh) {
      this.highlightMesh.position.set(
        hit.position.x + 0.5,
        hit.position.y + 0.5,
        hit.position.z + 0.5
      )
      this.highlightMesh.visible = true
    } else if (this.highlightMesh) {
      this.highlightMesh.visible = false
    }
  }

  breakBlock(): BlockType | null {
    const hit = this.getTargetBlock()

    if (hit) {
      const { x, y, z } = hit.position
      const blockType = this.world.getBlock(x, y, z)
      this.world.setBlock(x, y, z, BlockType.AIR)
      return blockType
    }

    return null
  }

  placeBlock(blockType: BlockType): boolean {
    const hit = this.getTargetBlock()

    if (hit) {
      // 在法线方向放置方块
      const placePos = hit.position.clone().add(hit.normal)
      const x = Math.floor(placePos.x)
      const y = Math.floor(placePos.y)
      const z = Math.floor(placePos.z)

      // 检查是否与玩家碰撞
      const playerPos = this.camera.position
      const playerMinY = playerPos.y - 1.7
      const playerMaxY = playerPos.y

      if (y >= playerMinY && y <= playerMaxY &&
          Math.abs(x + 0.5 - playerPos.x) < 1 &&
          Math.abs(z + 0.5 - playerPos.z) < 1) {
        return false // 不能在玩家位置放置
      }

      this.world.setBlock(x, y, z, blockType)
      return true
    }

    return false
  }
}
```

**Step 2: 更新 src/world/World.ts 添加 setBlock 方法**

```typescript
// 添加 setBlock 方法
setBlock(x: number, y: number, z: number, type: BlockType): void {
  const chunkX = Math.floor(x / CHUNK_SIZE)
  const chunkZ = Math.floor(z / CHUNK_SIZE)
  const chunk = this.getChunk(chunkX, chunkZ)

  if (chunk) {
    const localX = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
    const localZ = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
    chunk.setBlock(localX, y, localZ, type)

    // 重新生成网格
    const oldMesh = chunk.getMesh()
    if (oldMesh) {
      this.scene.remove(oldMesh)
    }
    const newMesh = chunk.generateMesh()
    this.scene.add(newMesh)
  }
}
```

**Step 3: 更新 src/player/PlayerController.ts 添加挖掘/放置**

```typescript
// 添加 BlockInteraction
private blockInteraction: BlockInteraction

// 在构造函数中
this.blockInteraction = new BlockInteraction(camera, world, scene)

// 在 setupControls 中添加鼠标点击
document.addEventListener('mousedown', (e) => {
  if (!this.isLocked) return

  if (e.button === 0) { // 左键挖掘
    const brokenBlock = this.blockInteraction.breakBlock()
    if (brokenBlock !== null && brokenBlock !== BlockType.AIR) {
      // 添加到背包
      this.inventory.addItem({
        type: 'block',
        id: `block_${brokenBlock}`,
        name: this.getBlockName(brokenBlock),
        count: 1,
        blockType: brokenBlock
      })
    }
  } else if (e.button === 2) { // 右键放置
    const selectedItem = this.inventory.getSelectedItem()
    if (selectedItem && selectedItem.type === 'block' && selectedItem.blockType !== undefined) {
      if (this.blockInteraction.placeBlock(selectedItem.blockType)) {
        this.inventory.decreaseSelectedItem(1)
      }
    }
  }
})

// 禁用右键菜单
document.addEventListener('contextmenu', (e) => e.preventDefault())

// 在 update 中更新高亮
this.blockInteraction.updateHighlight()
```

**Step 4: 更新 src/main.ts 传入 scene**

```typescript
// 创建玩家控制器时传入 scene
const playerController = new PlayerController(camera, world, game.getScene())
```

**Step 5: 验证**

运行 `npm run dev`，测试：
- 左键挖掘方块，添加到背包
- 右键放置方块
- 准心处显示高亮框

**Step 6: 提交**

```bash
git add .
git commit -m "feat: add block mining and placing system

- Create BlockInteraction class with raycasting
- Left click to break blocks
- Right click to place blocks
- Block highlight indicator
- Mined blocks added to inventory

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: 武器系统基础

**Files:**
- Create: `src/combat/Weapon.ts`
- Create: `src/combat/CombatSystem.ts`
- Modify: `src/player/PlayerController.ts`

**Step 1: 创建 src/combat/Weapon.ts**

```typescript
export enum WeaponType {
  PICKAXE = 'pickaxe',
  SWORD = 'sword',
  BOW = 'bow'
}

export interface WeaponStats {
  damage: number
  range: number
  cooldown: number // 秒
}

export const WEAPON_STATS: Record<WeaponType, WeaponStats> = {
  [WeaponType.PICKAXE]: { damage: 5, range: 3, cooldown: 0.5 },
  [WeaponType.SWORD]: { damage: 15, range: 4, cooldown: 0.3 },
  [WeaponType.BOW]: { damage: 20, range: 20, cooldown: 1.0 }
}

export class Weapon {
  private type: WeaponType
  private stats: WeaponStats
  private lastAttackTime: number = 0

  constructor(type: WeaponType) {
    this.type = type
    this.stats = WEAPON_STATS[type]
  }

  canAttack(currentTime: number): boolean {
    return currentTime - this.lastAttackTime >= this.stats.cooldown
  }

  attack(currentTime: number): number {
    this.lastAttackTime = currentTime
    return this.stats.damage
  }

  getStats(): WeaponStats {
    return this.stats
  }

  getType(): WeaponType {
    return this.type
  }
}
```

**Step 2: 创建 src/combat/CombatSystem.ts**

```typescript
import * as THREE from 'three'
import { Weapon } from './Weapon'

export interface AttackResult {
  hit: boolean
  damage: number
  position?: THREE.Vector3
}

export class CombatSystem {
  private camera: THREE.PerspectiveCamera
  private scene: THREE.Scene

  constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
    this.camera = camera
    this.scene = scene
  }

  performAttack(weapon: Weapon): AttackResult {
    const stats = weapon.getStats()
    const damage = weapon.attack(performance.now() / 1000)

    // 射线检测攻击目标
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera)
    raycaster.far = stats.range

    // TODO: 检测敌人碰撞（Phase 4 实现）

    return {
      hit: false, // 暂时返回 false，等敌人系统实现
      damage: damage,
      position: this.camera.position.clone().add(
        new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).multiplyScalar(stats.range)
      )
    }
  }

  // 创建攻击特效
  createAttackEffect(position: THREE.Vector3): void {
    const geometry = new THREE.SphereGeometry(0.2, 8, 8)
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8
    })
    const effect = new THREE.Mesh(geometry, material)
    effect.position.copy(position)
    this.scene.add(effect)

    // 动画消失
    const startTime = performance.now()
    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000
      if (elapsed < 0.2) {
        material.opacity = 0.8 * (1 - elapsed / 0.2)
        requestAnimationFrame(animate)
      } else {
        this.scene.remove(effect)
        geometry.dispose()
        material.dispose()
      }
    }
    animate()
  }
}
```

**Step 3: 更新 src/player/PlayerController.ts 集成武器系统**

```typescript
import { Weapon, WeaponType } from '../combat/Weapon'
import { CombatSystem } from '../combat/CombatSystem'

// 添加属性
private weapons: Map<WeaponType, Weapon> = new Map()
private combatSystem: CombatSystem

// 在构造函数中
this.weapons.set(WeaponType.PICKAXE, new Weapon(WeaponType.PICKAXE))
this.weapons.set(WeaponType.SWORD, new Weapon(WeaponType.SWORD))
this.combatSystem = new CombatSystem(camera, scene)

// 修改左键攻击逻辑
if (e.button === 0) {
  const selectedItem = this.inventory.getSelectedItem()

  if (selectedItem?.type === 'weapon' || selectedItem?.type === 'tool') {
    // 武器攻击
    const weapon = this.weapons.get(selectedItem.id as WeaponType)
    if (weapon && weapon.canAttack(performance.now() / 1000)) {
      const result = this.combatSystem.performAttack(weapon)
      if (result.position) {
        this.combatSystem.createAttackEffect(result.position)
      }
    }
  } else {
    // 徒手挖掘
    const brokenBlock = this.blockInteraction.breakBlock()
    // ... 原有逻辑
  }
}
```

**Step 4: 验证**

运行 `npm run dev`，测试：
- 选中剑时左键攻击显示特效
- 攻击有冷却时间

**Step 5: 提交**

```bash
git add .
git commit -m "feat: add weapon system with attack cooldown

- Create Weapon class with damage and cooldown
- Create CombatSystem for attack handling
- Attack effect visualization
- Different weapons have different stats

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: 多层地形优化

**Files:**
- Modify: `src/world/World.ts`
- Modify: `src/world/BlockType.ts`

**Step 1: 更新 src/world/BlockType.ts 添加更多方块**

```typescript
export enum BlockType {
  AIR = 0,
  DIRT = 1,
  STONE = 2,
  DEEP_STONE = 3,
  COPPER_ORE = 4,
  IRON_ORE = 5,
  GEM = 6,          // 新增：宝石
  BEDROCK = 7,      // 新增：基岩（不可破坏）
  GRAVEL = 8,       // 新增：砂砾
}

export const BLOCK_DEFINITIONS: Record<BlockType, BlockDefinition> = {
  [BlockType.AIR]: { name: 'Air', color: 0x000000, hardness: 0 },
  [BlockType.DIRT]: { name: 'Dirt', color: 0x8b4513, hardness: 1 },
  [BlockType.STONE]: { name: 'Stone', color: 0x808080, hardness: 2 },
  [BlockType.DEEP_STONE]: { name: 'Deep Stone', color: 0x4a4a4a, hardness: 3 },
  [BlockType.COPPER_ORE]: { name: 'Copper Ore', color: 0xb87333, hardness: 2 },
  [BlockType.IRON_ORE]: { name: 'Iron Ore', color: 0xa19d94, hardness: 2 },
  [BlockType.GEM]: { name: 'Gem', color: 0x9932cc, hardness: 4 },
  [BlockType.BEDROCK]: { name: 'Bedrock', color: 0x1a1a1a, hardness: -1 }, // -1 = 不可破坏
  [BlockType.GRAVEL]: { name: 'Gravel', color: 0x9e9e9e, hardness: 1 },
}
```

**Step 2: 更新 src/world/World.ts 多层生成逻辑**

```typescript
// 在 generateChunk 方法中更新地形生成

// 深度层级配置
const layers = [
  { minY: 0, maxY: 2, baseBlock: BlockType.BEDROCK },
  { minY: 2, maxY: 5, baseBlock: BlockType.DEEP_STONE, ores: [{ type: BlockType.GEM, chance: 0.01 }] },
  { minY: 5, maxY: 10, baseBlock: BlockType.DEEP_STONE, ores: [
    { type: BlockType.IRON_ORE, chance: 0.03 },
    { type: BlockType.COPPER_ORE, chance: 0.02 }
  ]},
  { minY: 10, maxY: 20, baseBlock: BlockType.STONE, ores: [
    { type: BlockType.IRON_ORE, chance: 0.02 },
    { type: BlockType.COPPER_ORE, chance: 0.04 }
  ]},
  { minY: 20, maxY: 28, baseBlock: BlockType.GRAVEL },
  { minY: 28, maxY: 32, baseBlock: BlockType.DIRT },
]

// 根据深度生成方块
for (let y = 0; y < CHUNK_HEIGHT; y++) {
  let blockType = BlockType.AIR

  for (const layer of layers) {
    if (y >= layer.minY && y < layer.maxY) {
      blockType = layer.baseBlock

      // 矿石生成
      if (layer.ores) {
        for (const ore of layer.ores) {
          if (Math.random() < ore.chance) {
            blockType = ore.type
            break
          }
        }
      }
      break
    }
  }

  chunk.setBlock(x, y, z, blockType)
}
```

**Step 3: 更新挖掘系统检查基岩**

在 BlockInteraction.ts 中：
```typescript
breakBlock(): BlockType | null {
  const hit = this.getTargetBlock()

  if (hit) {
    const { x, y, z } = hit.position
    const blockType = this.world.getBlock(x, y, z)

    // 基岩不可破坏
    if (blockType === BlockType.BEDROCK) {
      return null
    }

    this.world.setBlock(x, y, z, BlockType.AIR)
    return blockType
  }

  return null
}
```

**Step 4: 验证**

运行 `npm run dev`，测试：
- 地面有砂砾层
- 深层有更多矿石
- 底部基岩无法破坏

**Step 5: 提交**

```bash
git add .
git commit -m "feat: add multi-layer terrain with more block types

- Add bedrock, gravel, gem blocks
- Layered terrain generation
- Bedrock is indestructible
- Deeper layers have rarer ores

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Phase 2 完成检查点

完成以上 4 个任务后，Phase 2 包含：

- [x] 背包系统（快捷栏 + 物品管理）
- [x] 方块挖掘/放置
- [x] 武器系统（镐、剑、弓）
- [x] 多层地形生成
- [x] 更多方块类型（基岩、砂砾、宝石）

**后续 Phase 3-5 内容**:
- 队友 NPC 系统
- 敌人和 Boss
- 存档系统
- 音效和特效

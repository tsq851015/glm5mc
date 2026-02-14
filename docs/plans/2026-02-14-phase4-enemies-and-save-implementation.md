# Phase 4 - Enemies and Save System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement basic enemy system (slimes, bats, skeletons) and IndexedDB-based save system for the Underground Explorer game

**Architecture:**
- **Enemy System**: Component-based with shared Enemy base class, three enemy types with different AI behaviors (Simple, Flying, Pathfinding), and regional spawning based on depth
- **Save System**: IndexedDB storage with 30s auto-save, manual save slots, and incremental block change tracking
- **Combat Extension**: Integrate enemies into existing CombatSystem with collision detection and damage calculation

**Tech Stack:** TypeScript, Three.js, IndexedDB, simplex-noise

---

## Stage 1: Enemy Basics (Core)

### Task 1: Create EntityType enum

**Files:**
- Create: `src/entities/EntityType.ts`

**Step 1: Write the file**

```typescript
export enum EntityType {
  SLIME = 'slime',
  BAT = 'bat',
  SKELETON = 'skeleton'
}

export interface EntityStats {
  maxHealth: number
  damage: number
  moveSpeed: number
  attackRange: number
}

export const ENTITY_STATS: Record<EntityType, EntityStats> = {
  [EntityType.SLIME]: {
    maxHealth: 15,
    damage: 3,
    moveSpeed: 2.5,
    attackRange: 1.5
  },
  [EntityType.BAT]: {
    maxHealth: 25,
    damage: 6,
    moveSpeed: 4.0,
    attackRange: 2.0
  },
  [EntityType.SKELETON]: {
    maxHealth: 40,
    damage: 10,
    moveSpeed: 1.8,
    attackRange: 2.5
  }
}
```

**Step 2: Commit**

```bash
git add src/entities/EntityType.ts
git commit -m "feat(entities): add EntityType enum and stats configuration"
```

---

### Task 2: Create Enemy base class

**Files:**
- Create: `src/enemies/Enemy.ts`

**Step 1: Write the file**

```typescript
import * as THREE from 'three'
import { EntityType, EntityStats } from '../entities/EntityType'

export interface EnemySaveData {
  type: string
  position: { x: number, y: number, z: number }
  health: number
  isDead: boolean
}

export class Enemy {
  protected type: EntityType
  protected stats: EntityStats
  protected health: number
  protected mesh: THREE.Mesh
  protected position: THREE.Vector3
  protected isDead: boolean = false

  constructor(type: EntityType, position: THREE.Vector3, scene: THREE.Scene) {
    this.type = type
    this.stats = ENTITY_STATS[type]
    this.health = this.stats.maxHealth
    this.position = position.clone()

    // Create simple mesh (will be replaced with proper models later)
    const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8)
    const material = new THREE.MeshStandardMaterial({
      color: this.getColorForType()
    })
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.copy(position)
    scene.add(this.mesh)
  }

  private getColorForType(): number {
    switch (this.type) {
      case EntityType.SLIME: return 0x44ff44  // Green
      case EntityType.BAT: return 0x4444ff  // Blue
      case EntityType.SKELETON: return 0xeeeeee  // White
      default: return 0xff0000
    }
  }

  update(deltaTime: number, playerPosition: THREE.Vector3): void {
    if (this.isDead) return

    // AI will be implemented in subclasses
  }

  takeDamage(damage: number): void {
    if (this.isDead) return

    this.health -= damage
    if (this.health <= 0) {
      this.health = 0
      this.isDead = true
    }
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone()
  }

  getHealth(): number {
    return this.health
  }

  getMaxHealth(): number {
    return this.stats.maxHealth
  }

  isAlive(): boolean {
    return !this.isDead
  }

  getDamage(): number {
    return this.stats.damage
  }

  getAttackRange(): number {
    return this.stats.attackRange
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.mesh)
    this.mesh.geometry.dispose()
    ;(this.mesh.material as THREE.Material).dispose()
  }

  toSaveData(): EnemySaveData {
    return {
      type: this.type,
      position: {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z
      },
      health: this.health,
      isDead: this.isDead
    }
  }

  static fromSaveData(data: EnemySaveData, scene: THREE.Scene): Enemy {
    const type = data.type as EntityType
    const position = new THREE.Vector3(data.position.x, data.position.y, data.position.z)

    // Will be replaced with proper factory in later tasks
    const enemy = new Enemy(type, position, scene)
    enemy.health = data.health
    enemy.isDead = data.isDead

    return enemy
  }
}
```

**Step 2: Commit**

```bash
git add src/enemies/Enemy.ts
git commit -m "feat(enemies): add Enemy base class with health and damage"
```

---

### Task 3: Create Slime enemy with SimpleAI

**Files:**
- Create: `src/enemies/Slime.ts`
- Create: `src/enemies/EnemyAI.ts`

**Step 1: Create EnemyAI interface**

```typescript
import * as THREE from 'three'

export interface EnemyAI {
  update(deltaTime: number, enemyPosition: THREE.Vector3, playerPosition: THREE.Vector3): THREE.Vector3
}
```

**Step 2: Create Slime with SimpleAI**

```typescript
import * as THREE from 'three'
import { Enemy } from './Enemy'
import { EnemyAI } from './EnemyAI'
import { EntityType } from '../entities/EntityType'

class SimpleAI implements EnemyAI {
  update(_deltaTime: number, enemyPosition: THREE.Vector3, playerPosition: THREE.Vector3): THREE.Vector3 {
    const direction = new THREE.Vector3()
      .subVectors(playerPosition, enemyPosition)
      .normalize()

    return direction
  }
}

export class Slime extends Enemy {
  private ai: EnemyAI

  constructor(position: THREE.Vector3, scene: THREE.Scene) {
    super(EntityType.SLIME, position, scene)
    this.ai = new SimpleAI()
  }

  override update(deltaTime: number, playerPosition: THREE.Vector3): void {
    if (!this.isAlive()) return

    const direction = this.ai.update(deltaTime, this.position, playerPosition)

    // Move towards player
    const movement = direction.multiplyScalar(this.stats.moveSpeed * deltaTime)
    this.position.add(movement)
    this.mesh.position.copy(this.position)
  }
}
```

**Step 3: Commit**

```bash
git add src/enemies/EnemyAI.ts src/enemies/Slime.ts
git commit -m "feat(enemies): add Slime enemy with SimpleAI"
```

---

### Task 4: Create Bat enemy with FlyingAI

**Files:**
- Create: `src/enemies/Bat.ts`

**Step 1: Write Bat class**

```typescript
import * as THREE from 'three'
import { Enemy } from './Enemy'
import { EnemyAI } from './EnemyAI'
import { EntityType } from '../entities/EntityType'

class FlyingAI implements EnemyAI {
  update(_deltaTime: number, enemyPosition: THREE.Vector3, playerPosition: THREE.Vector3): THREE.Vector3 {
    const direction = new THREE.Vector3()
      .subVectors(playerPosition, enemyPosition)
      .normalize()

    // Flying AI ignores terrain, can move directly to player
    return direction
  }
}

export class Bat extends Enemy {
  private ai: EnemyAI

  constructor(position: THREE.Vector3, scene: THREE.Scene) {
    super(EntityType.BAT, position, scene)
    this.ai = new FlyingAI()

    // Change color to dark blue for bat
    ;(this.mesh.material as THREE.MeshStandardMaterial).color.setHex(0x4444ff)
  }

  override update(deltaTime: number, playerPosition: THREE.Vector3): void {
    if (!this.isAlive()) return

    const direction = this.ai.update(deltaTime, this.position, playerPosition)
    const movement = direction.multiplyScalar(this.stats.moveSpeed * deltaTime)
    this.position.add(movement)
    this.mesh.position.copy(this.position)
  }
}
```

**Step 2: Commit**

```bash
git add src/enemies/Bat.ts
git commit -m "feat(enemies): add Bat enemy with FlyingAI"
```

---

### Task 5: Create Skeleton enemy with PathfindingAI

**Files:**
- Create: `src/enemies/Skeleton.ts`

**Step 1: Write Skeleton class**

```typescript
import * as THREE from 'three'
import { Enemy } from './Enemy'
import { EnemyAI } from './EnemyAI'
import { EntityType } from '../entities/EntityType'

class PathfindingAI implements EnemyAI {
  private stuckCounter: number = 0
  private lastPosition: THREE.Vector3 = new THREE.Vector3()

  update(_deltaTime: number, enemyPosition: THREE.Vector3, playerPosition: THREE.Vector3): THREE.Vector3 {
    const direction = new THREE.Vector3()
      .subVectors(playerPosition, enemyPosition)
      .normalize()

    // Check if stuck (not moving)
    const distance = enemyPosition.distanceTo(this.lastPosition)
    if (distance < 0.01) {
      this.stuckCounter++
    } else {
      this.stuckCounter = 0
    }
    this.lastPosition.copy(enemyPosition)

    // If stuck, try strafing
    if (this.stuckCounter > 10) {
      // Try perpendicular direction
      direction.cross(new THREE.Vector3(0, 1, 0)).normalize()
      this.stuckCounter = 0
    }

    return direction
  }
}

export class Skeleton extends Enemy {
  private ai: EnemyAI

  constructor(position: THREE.Vector3, scene: THREE.Scene) {
    super(EntityType.SKELETON, position, scene)
    this.ai = new PathfindingAI()

    // Change color to white for skeleton
    ;(this.mesh.material as THREE.MeshStandardMaterial).color.setHex(0xeeeeee)
  }

  override update(deltaTime: number, playerPosition: THREE.Vector3): void {
    if (!this.isAlive()) return

    const direction = this.ai.update(deltaTime, this.position, playerPosition)
    const movement = direction.multiplyScalar(this.stats.moveSpeed * deltaTime)
    this.position.add(movement)
    this.mesh.position.copy(this.position)
  }
}
```

**Step 2: Commit**

```bash
git add src/enemies/Skeleton.ts
git commit -m "feat(enemies): add Skeleton enemy with PathfindingAI"
```

---

### Task 6: Create EnemySpawner

**Files:**
- Create: `src/enemies/EnemySpawner.ts`

**Step 1: Write EnemySpawner class**

```typescript
import * as THREE from 'three'
import { Slime } from './Slime'
import { Bat } from './Bat'
import { Skeleton } from './Skeleton'
import { Enemy } from './Enemy'
import { EntityType } from '../entities/EntityType'
import { BlockType } from '../world/BlockType'

interface SpawnConfig {
  type: EntityType
  minY: number
  maxY: number
  checkEmpty: boolean
  regionSize: number
  maxPerRegion: number
}

export class EnemySpawner {
  private enemies: Enemy[] = []
  private scene: THREE.Scene
  private getBlock: (x: number, y: number, z: number) => BlockType
  private lastSpawnCheck: number = 0
  private spawnCooldown: number = 60000 // 60 seconds

  private spawnConfigs: SpawnConfig[] = [
    {
      type: EntityType.SLIME,
      minY: 0,
      maxY: 25,
      checkEmpty: false,
      regionSize: 16,
      maxPerRegion: 3
    },
    {
      type: EntityType.BAT,
      minY: 10,
      maxY: 32,
      checkEmpty: true,
      regionSize: 20,
      maxPerRegion: 2
    },
    {
      type: EntityType.SKELETON,
      minY: 0,
      maxY: 15,
      checkEmpty: false,
      regionSize: 32,
      maxPerRegion: 1
    }
  ]

  constructor(
    scene: THREE.Scene,
    getBlock: (x: number, y: number, z: number) => BlockType
  ) {
    this.scene = scene
    this.getBlock = getBlock
  }

  update(currentTime: number, playerPosition: THREE.Vector3): void {
    // Check spawn every 5 seconds
    if (currentTime - this.lastSpawnCheck < 5000) return
    this.lastSpawnCheck = currentTime

    this.checkSpawns(playerPosition)
  }

  private checkSpawns(playerPosition: THREE.Vector3): void {
    const px = Math.floor(playerPosition.x)
    const py = Math.floor(playerPosition.y)
    const pz = Math.floor(playerPosition.z)

    for (const config of this.spawnConfigs) {
      if (py < config.minY || py > config.maxY) continue

      // Calculate region bounds
      const regionX = Math.floor(px / config.regionSize) * config.regionSize
      const regionZ = Math.floor(pz / config.regionSize) * config.regionSize

      // Count enemies in this region
      const enemiesInRegion = this.enemies.filter(e => {
        const pos = e.getPosition()
        return (
          e.isAlive() &&
          pos.x >= regionX && pos.x < regionX + config.regionSize &&
          pos.z >= regionZ && pos.z < regionZ + config.regionSize
        )
      })

      if (enemiesInRegion.length >= config.maxPerRegion) continue

      // Try to spawn
      const spawnPos = this.findSpawnPosition(regionX, regionZ, config)
      if (spawnPos) {
        this.spawnEnemy(config.type, spawnPos)
      }
    }
  }

  private findSpawnPosition(
    regionX: number,
    regionZ: number,
    config: SpawnConfig
  ): THREE.Vector3 | null {
    // Try 10 random positions
    for (let i = 0; i < 10; i++) {
      const x = regionX + Math.floor(Math.random() * config.regionSize)
      const z = regionZ + Math.floor(Math.random() * config.regionSize)
      const y = config.minY + Math.floor(Math.random() * (config.maxY - config.minY))

      // Check if position is valid
      if (config.checkEmpty) {
        // For flying enemies (bat), check if area is empty enough
        let emptyCount = 0
        for (let dy = 0; dy < 5; dy++) {
          if (this.getBlock(x, y + dy, z) === BlockType.AIR) {
            emptyCount++
          }
        }
        if (emptyCount < 3) continue
      } else {
        // For ground enemies, check if spawn position is not solid
        if (this.getBlock(x, y, z) !== BlockType.AIR) continue
        // Check if ground below
        if (this.getBlock(x, y - 1, z) === BlockType.AIR) continue
      }

      return new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5)
    }

    return null
  }

  private spawnEnemy(type: EntityType, position: THREE.Vector3): void {
    let enemy: Enemy

    switch (type) {
      case EntityType.SLIME:
        enemy = new Slime(position, this.scene)
        break
      case EntityType.BAT:
        enemy = new Bat(position, this.scene)
        break
      case EntityType.SKELETON:
        enemy = new Skeleton(position, this.scene)
        break
      default:
        return
    }

    this.enemies.push(enemy)
  }

  getEnemies(): Enemy[] {
    return this.enemies
  }

  updateEnemies(deltaTime: number, playerPosition: THREE.Vector3): void {
    for (const enemy of this.enemies) {
      if (enemy.isAlive()) {
        enemy.update(deltaTime, playerPosition)
      }
    }

    // Remove dead enemies (cleanup handled elsewhere)
    this.enemies = this.enemies.filter(e => e.isAlive() || !e.isAlive())
  }

  dispose(): void {
    for (const enemy of this.enemies) {
      enemy.dispose(this.scene)
    }
    this.enemies = []
  }

  toSaveData(): any[] {
    return this.enemies.map(e => e.toSaveData())
  }
}
```

**Step 2: Commit**

```bash
git add src/enemies/EnemySpawner.ts
git commit -m "feat(enemies): add EnemySpawner with regional spawning"
```

---

### Task 7: Integrate enemies into CombatSystem

**Files:**
- Modify: `src/combat/CombatSystem.ts:19-38`

**Step 1: Update CombatSystem to handle enemies**

Read current implementation:
```typescript
// Lines 19-38 currently have TODO comment for enemy collision
```

Replace with:

```typescript
performAttack(weapon: Weapon, enemies: Enemy[]): AttackResult {
  const stats = weapon.getStats()
  const damage = weapon.attack(performance.now() / 1000)

  // Calculate attack direction
  const direction = new THREE.Vector3(0, 0, -1)
  direction.applyQuaternion(this.camera.quaternion)

  const attackPosition = this.camera.position.clone().add(
    direction.multiplyScalar(stats.range * 0.5)
  )

  // Check enemy collisions
  let hitEnemy: Enemy | null = null
  let minDistance = stats.range

  for (const enemy of enemies) {
    if (!enemy.isAlive()) continue

    const distance = this.camera.position.distanceTo(enemy.getPosition())
    if (distance < minDistance) {
      // Check if enemy is in front (dot product)
      const toEnemy = new THREE.Vector3()
        .subVectors(enemy.getPosition(), this.camera.position)
        .normalize()

      const dot = direction.dot(toEnemy)
      if (dot > 0.5) { // Within ~60 degree cone
        minDistance = distance
        hitEnemy = enemy
      }
    }
  }

  if (hitEnemy) {
    hitEnemy.takeDamage(damage)
    this.createAttackEffect(hitEnemy.getPosition(), stats.range)

    return {
      hit: true,
      damage: damage,
      position: hitEnemy.getPosition()
    }
  }

  return {
    hit: false,
    damage: damage,
    position: attackPosition
  }
}
```

Also need to add import at top:
```typescript
import { Enemy } from '../enemies/Enemy'
```

**Step 2: Commit**

```bash
git add src/combat/CombatSystem.ts
git commit -m "feat(combat): add enemy collision detection to attacks"
```

---

## Stage 2: Save System (Core)

### Task 8: Create SaveData interfaces

**Files:**
- Create: `src/save/SaveData.ts`

**Step 1: Write SaveData interfaces**

```typescript
import { BlockType } from '../world/BlockType'
import { EnemySaveData } from '../enemies/Enemy'

export interface SaveData {
  version: string
  timestamp: number
  player: PlayerSaveData
  modifiedBlocks: ModifiedBlock[]
  enemies?: EnemySaveData[]
}

export interface PlayerSaveData {
  position: {
    x: number
    y: number
    z: number
  }
  health: number
  inventory: BlockType[]
}

export interface ModifiedBlock {
  key: string  // "x,y,z" format
  type: BlockType
}

export const SAVE_VERSION = '1.0'
```

**Step 2: Commit**

```bash
git add src/save/SaveData.ts
git commit -m "feat(save): add SaveData interfaces and version"
```

---

### Task 9: Create SaveManager with IndexedDB

**Files:**
- Create: `src/save/SaveManager.ts`

**Step 1: Write SaveManager class**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/save/SaveManager.ts
git commit -m "feat(save): add SaveManager with IndexedDB support"
```

---

### Task 10: Create AutoSave system

**Files:**
- Create: `src/save/AutoSave.ts`

**Step 1: Write AutoSave class**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/save/AutoSave.ts
git commit -m "feat(save): add AutoSave with 30s interval"
```

---

### Task 11: Add block modification tracking to World

**Files:**
- Modify: `src/world/World.ts:14-15` (add property)
- Modify: `src/world/World.ts:156-179` (track modifications)

**Step 1: Add modifiedBlocks tracking**

Add property after line 15:
```typescript
private modifiedBlocks: Map<string, BlockType> = new Map()
```

**Step 2: Update setBlock method to track changes**

Replace the existing `setBlock` method (lines 156-179) with:

```typescript
setBlock(worldX: number, worldY: number, worldZ: number, type: BlockType): void {
  if (worldY < 0 || worldY >= CHUNK_HEIGHT) {
    return
  }

  const chunkX = Math.floor(worldX / CHUNK_SIZE)
  const chunkZ = Math.floor(worldZ / CHUNK_SIZE)
  const localX = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
  const localZ = ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE

  const chunk = this.getChunk(chunkX, chunkZ)
  if (!chunk) {
    return
  }

  // Get original block before modification
  const originalBlock = chunk.getBlock(localX, worldY, localZ)

  // Track modification if different from original
  const key = `${worldX},${worldY},${worldZ}`
  if (type !== originalBlock) {
    this.modifiedBlocks.set(key, type)
  } else {
    // Remove from tracking if restored to original
    this.modifiedBlocks.delete(key)
  }

  chunk.setBlock(localX, worldY, localZ, type)
  chunk.generateMesh(this.scene)

  // Update neighboring chunks if block is on edge
  if (localX === 0) this.regenerateChunk(chunkX - 1, chunkZ)
  if (localX === CHUNK_SIZE - 1) this.regenerateChunk(chunkX + 1, chunkZ)
  if (localZ === 0) this.regenerateChunk(chunkX, chunkZ - 1)
  if (localZ === CHUNK_SIZE - 1) this.regenerateChunk(chunkX, chunkZ + 1)
}
```

**Step 3: Add getter for modified blocks**

Add new method after `dispose` method:
```typescript
getModifiedBlocks(): Map<string, BlockType> {
  return this.modifiedBlocks
}

clearModifiedBlocks(): void {
  this.modifiedBlocks.clear()
}
```

**Step 4: Commit**

```bash
git add src/world/World.ts
git commit -m "feat(world): add block modification tracking for saves"
```

---

### Task 12: Add health system to PlayerController

**Files:**
- Modify: `src/player/PlayerController.ts` (add health property and methods)

**Step 1: Add health property**

Find constructor properties section and add:
```typescript
private maxHealth: number = 100
private currentHealth: number = 100
```

**Step 2: Add health methods**

Add new methods after `update` method:
```typescript
takeDamage(damage: number): void {
  this.currentHealth = Math.max(0, this.currentHealth - damage)
  console.log(`Player took ${damage} damage. Health: ${this.currentHealth}/${this.maxHealth}`)
}

heal(amount: number): void {
  this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount)
}

getHealth(): number {
  return this.currentHealth
}

getMaxHealth(): number {
  return this.maxHealth
}

isAlive(): boolean {
  return this.currentHealth > 0
}
```

**Step 3: Commit**

```bash
git add src/player/PlayerController.ts
git commit -m "feat(player): add health system to PlayerController"
```

---

### Task 13: Integrate save system into Game class

**Files:**
- Modify: `src/core/Game.ts:1-93` (add save system integration)

**Step 1: Add imports**

Add after existing imports:
```typescript
import { SaveManager } from '../save/SaveManager'
import { AutoSave } from '../save/AutoSave'
import { SaveData, PlayerSaveData, ModifiedBlock } from '../save/SaveData'
```

**Step 2: Add save system properties to class**

Add in constructor properties section:
```typescript
private saveManager: SaveManager
private autoSave: AutoSave
private isSaveLoaded: boolean = false
```

**Step 3: Initialize save system in constructor**

Add at end of constructor (before `window.addEventListener`):
```typescript
this.saveManager = new SaveManager()
this.autoSave = new AutoSave(this.saveManager)

// Initialize save system
this.saveManager.init().then(() => {
  console.log('Save system initialized')
}).catch(err => {
  console.error('Failed to initialize save system:', err)
})
```

**Step 4: Add save/load methods**

Add new public methods before `stop` method:
```typescript
async saveGame(slot: number = 0): Promise<boolean> {
  const playerPos = this.camera.position

  // Gather save data from all systems
  const playerData: PlayerSaveData = {
    position: {
      x: playerPos.x,
      y: playerPos.y,
      z: playerPos.z
    },
    health: 100, // Will get from PlayerController when integrated
    inventory: [] // Will get from Inventory when integrated
  }

  const modifiedBlocks: ModifiedBlock[] = []
  // TODO: Get from World.getModifiedBlocks()

  const saveData: SaveData = {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    player: playerData,
    modifiedBlocks: modifiedBlocks
  }

  const success = await this.autoSave.save(slot, saveData)
  if (success) {
    console.log(`Game saved to slot ${slot}`)
  } else {
    console.error('Failed to save game')
  }

  return success
}

async loadGame(slot: number = 0): Promise<boolean> {
  const saveData = await this.autoSave.load(slot)

  if (!saveData) {
    console.log(`No save found in slot ${slot}`)
    return false
  }

  // Validate version
  if (saveData.version !== SAVE_VERSION) {
    console.error(`Incompatible save version: ${saveData.version}`)
    return false
  }

  // Restore player position
  this.camera.position.set(
    saveData.player.position.x,
    saveData.player.position.y,
    saveData.player.position.z
  )

  // Restore blocks
  // TODO: Apply modifiedBlocks to World

  this.isSaveLoaded = true
  console.log(`Game loaded from slot ${slot}`)
  return true
}

async checkAutoSave(): Promise<void> {
  if (this.autoSave.shouldSave()) {
    await this.saveGame(0) // Auto-save to slot 0
  }
}
```

**Step 5: Update game loop to check auto-save**

Modify `gameLoop` method (around line 63-71):
```typescript
private gameLoop(currentTime: number): void {
  if (!this.isRunning) return

  this.time.update(currentTime)
  this.update(this.time.deltaTime)

  // Check auto-save
  this.checkAutoSave().catch(err => {
    console.error('Auto-save failed:', err)
  })

  this.render()
  requestAnimationFrame((t) => this.gameLoop(t))
}
```

**Step 6: Commit**

```bash
git add src/core/Game.ts
git commit -m "feat(game): integrate save system with auto-save"
```

---

## Stage 3: AI Enhancement (Extension)

### Task 14: Implement pathfinding for Skeleton

**Files:**
- Modify: `src/enemies/Skeleton.ts:20-38`

**Step 1: Improve PathfindingAI with raycast-like check**

Update the `PathfindingAI.update` method to include obstacle detection:

```typescript
update(_deltaTime: number, enemyPosition: THREE.Vector3, playerPosition: THREE.Vector3): THREE.Vector3 {
  const direction = new THREE.Vector3()
    .subVectors(playerPosition, enemyPosition)
    .normalize()

  // Simple obstacle detection - check if we're stuck
  const distance = enemyPosition.distanceTo(this.lastPosition)
  if (distance < 0.01) {
    this.stuckCounter++
  } else {
    this.stuckCounter = 0
  }
  this.lastPosition.copy(enemyPosition)

  // If stuck, try different directions
  if (this.stuckCounter > 10) {
    // Try left, right, then jump combinations
    const tryDirections = [
      new THREE.Vector3(direction.z, 0, -direction.x), // Perpendicular left
      new THREE.Vector3(-direction.z, 0, direction.x), // Perpendicular right
      new THREE.Vector3(direction.x, 1, direction.z).normalize(), // Try jumping
      new THREE.Vector3(-direction.x, 0, -direction.z) // Reverse
    ]

    for (const tryDir of tryDirections) {
      this.stuckCounter = 0
      return tryDir
    }
  }

  return direction
}
```

**Step 2: Commit**

```bash
git add src/enemies/Skeleton.ts
git commit -m "feat(enemies): improve pathfinding with obstacle avoidance"
```

---

### Task 15: Add enemy attack damage to player

**Files:**
- Modify: `src/enemies/Enemy.ts`
- Modify: `src/enemies/EnemySpawner.ts:73-85`

**Step 1: Add attack cooldown to Enemy base class**

Add property in Enemy constructor:
```typescript
private lastAttackTime: number = 0
private attackCooldown: number = 1000 // 1 second
```

**Step 2: Add attack method to Enemy**

Add method in Enemy class:
```typescript
canAttack(currentTime: number): boolean {
  return currentTime - this.lastAttackTime >= this.attackCooldown
}

attack(currentTime: number, playerPosition: THREE.Vector3): number {
  const distance = this.position.distanceTo(playerPosition)

  if (distance <= this.stats.attackRange && this.canAttack(currentTime)) {
    this.lastAttackTime = currentTime
    return this.stats.damage
  }

  return 0
}
```

**Step 3: Update EnemySpawner to handle enemy attacks**

Update `updateEnemies` method in EnemySpawner:
```typescript
updateEnemies(deltaTime: number, playerPosition: THREE.Vector3, onPlayerHit: (damage: number) => void): void {
  const currentTime = performance.now()

  for (const enemy of this.enemies) {
    if (enemy.isAlive()) {
      enemy.update(deltaTime, playerPosition)

      // Check if enemy attacks player
      const damage = enemy.attack(currentTime, playerPosition)
      if (damage > 0) {
        onPlayerHit(damage)
      }
    }
  }

  this.enemies = this.enemies.filter(e => e.isAlive() || !e.isAlive())
}
```

**Step 4: Commit**

```bash
git add src/enemies/Enemy.ts src/enemies/EnemySpawner.ts
git commit -m "feat(combat): add enemy attack damage to player"
```

---

## Stage 4: Polish (Details)

### Task 16: Add damage indicators and UI feedback

**Files:**
- Modify: `src/ui/HUD.ts`
- Modify: `src/combat/CombatSystem.ts:40-75`

**Step 1: Add health bar to HUD**

Read current HUD implementation, then add health bar rendering:
```typescript
// Add these properties to HUD class
private playerHealthElement: HTMLElement | null = null

// In constructor, create health bar
this.playerHealthElement = document.createElement('div')
this.playerHealthElement.style.cssText = `
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 20px;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid #fff;
  border-radius: 4px;
`
document.body.appendChild(this.playerHealthElement)

// Add method to update health bar
updateHealthBar(current: number, max: number): void {
  if (!this.playerHealthElement) return

  const percentage = (current / max) * 100
  const color = percentage > 50 ? '#44ff44' : percentage > 25 ? '#ffff44' : '#ff4444'

  this.playerHealthElement.innerHTML = `
    <div style="width: ${percentage}%; height: 100%; background: ${color}; border-radius: 2px;"></div>
  `
}
```

**Step 2: Add floating damage numbers**

Add method to CombatSystem:
```typescript
showDamageNumber(position: THREE.Vector3, damage: number): void {
  const element = document.createElement('div')
  element.textContent = `-${damage}`
  element.style.cssText = `
    position: absolute;
    color: #ff4444;
    font-weight: bold;
    font-size: 18px;
    pointer-events: none;
    text-shadow: 1px 1px 2px black;
  `

  // Convert 3D position to screen coordinates
  // TODO: Implement projection in next task

  document.body.appendChild(element)

  // Animate floating up and fade out
  let opacity = 1.0
  let offsetY = 0
  const animate = () => {
    opacity -= 0.02
    offsetY += 1

    if (element.style) {
      element.style.opacity = opacity.toString()
      element.style.transform = `translateY(${-offsetY}px)`
    }

    if (opacity > 0) {
      requestAnimationFrame(animate)
    } else {
      document.body.removeChild(element)
    }
  }
  requestAnimationFrame(animate)
}
```

**Step 3: Commit**

```bash
git add src/ui/HUD.ts src/combat/CombatSystem.ts
git commit -m "feat(ui): add health bar and damage indicators"
```

---

### Task 17: Add death animation for enemies

**Files:**
- Modify: `src/enemies/Enemy.ts`

**Step 1: Add death animation**

Add property and method to Enemy class:
```typescript
private deathAnimationTime: number = 0
private isAnimatingDeath: boolean = false

animateDeath(scene: THREE.Scene): void {
  if (this.isAnimatingDeath) return

  this.isAnimatingDeath = true
  this.deathAnimationTime = performance.now()

  const duration = 500 // ms
  const startScale = this.mesh.scale.clone()

  const animate = () => {
    const elapsed = performance.now() - this.deathAnimationTime
    const progress = elapsed / duration

    if (progress < 1) {
      // Shrink and fade
      const scale = 1 - progress
      this.mesh.scale.set(
        startScale.x * scale,
        startScale.y * (1 - progress * 0.5), // Flatten
        startScale.z * scale
      )

      // Rotate
      this.mesh.rotation.y += 0.1

      ;(this.mesh.material as THREE.MeshStandardMaterial).opacity = 1 - progress

      requestAnimationFrame(animate)
    } else {
      // Animation complete
      this.dispose(scene)
    }
  }
  requestAnimationFrame(animate)
}
```

**Step 2: Commit**

```bash
git add src/enemies/Enemy.ts
git commit -m "feat(enemies): add death animation"
```

---

### Task 18: Final integration and testing

**Files:**
- Modify: `src/main.ts` (if needed for initialization)
- Create: `docs/plans/2026-02-14-phase4-testing.md`

**Step 1: Create testing documentation**

```markdown
# Phase 4 Testing Checklist

## Manual Testing Tasks

### Enemy System
- [ ] Slime spawns at Y < 25
- [ ] Bat spawns in empty areas at Y > 10
- [ ] Skeleton spawns at Y < 15
- [ ] Enemies move toward player
- [ ] Enemies damage player on contact
- [ ] Enemies can be killed
- [ ] Death animation plays correctly

### Save System
- [ ] Auto-save triggers every 30 seconds
- [ ] Manual save (F5) works
- [ ] Load restores player position
- [ ] Load restores modified blocks
- [ ] Save slots 0-3 work correctly

### Combat
- [ ] Player can attack enemies
- [ ] Damage numbers appear
- [ ] Health bar updates correctly
- [ ] Player death stops game

### Performance
- [ ] Game runs at 60 FPS with 20 enemies
- [ ] Save/load completes in < 1 second
- [ ] No memory leaks after 10 minutes of play

## Known Issues
- Document any bugs found during testing

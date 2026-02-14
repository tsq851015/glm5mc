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
  private isNightTime: () => boolean = () => false

  private spawnConfigs: SpawnConfig[] = [
    {
      type: EntityType.SLIME,
      minY: 38,  // 在地表层生成
      maxY: 50,
      checkEmpty: false,
      regionSize: 20,
      maxPerRegion: 4
    },
    {
      type: EntityType.BAT,
      minY: 45,  // 在空中生成
      maxY: 55,
      checkEmpty: true,
      regionSize: 25,
      maxPerRegion: 3
    },
    {
      type: EntityType.SKELETON,
      minY: 38,  // 在地表层生成
      maxY: 48,
      checkEmpty: false,
      regionSize: 30,
      maxPerRegion: 2
    }
  ]

  setIsNightTimeCallback(callback: () => boolean): void {
    this.isNightTime = callback
  }

  constructor(
    scene: THREE.Scene,
    getBlock: (x: number, y: number, z: number) => BlockType
  ) {
    this.scene = scene
    this.getBlock = getBlock
  }

  update(currentTime: number, playerPosition: THREE.Vector3): void {
    // 只在夜晚生成敌人
    if (!this.isNightTime()) return

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

    // 设置World引用，用于地面检测
    enemy.setWorld({ getBlock: this.getBlock })

    // 对于非飞行敌人，立即调整到地面高度
    if (type !== EntityType.BAT) {
      const groundLevel = enemy['findGroundLevel']()
      if (groundLevel > 0) {
        enemy['position'].y = groundLevel
        enemy['mesh'].position.y = groundLevel
      }
    }

    this.enemies.push(enemy)
  }

  getEnemies(): Enemy[] {
    return this.enemies
  }

  updateEnemies(deltaTime: number, playerPosition: THREE.Vector3, onPlayerHit: (damage: number) => void): void {
    const currentTime = performance.now()

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i]

      if (enemy.isAlive()) {
        enemy.update(deltaTime, playerPosition)

        // Check if enemy attacks player
        const damage = enemy.attack(currentTime, playerPosition)
        if (damage > 0) {
          onPlayerHit(damage)
        }

        // 检查敌人是否刚刚死亡
        if (!enemy.isAlive()) {
          // 触发死亡动画
          enemy.animateDeath(this.scene)
        }
      }
    }

    // 清理已完成死亡动画的敌人（已经被dispose的）
    // 注意：我们保留死亡中的敌人直到动画完成
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

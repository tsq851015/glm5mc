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

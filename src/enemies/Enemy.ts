import * as THREE from 'three'
import { EntityType, EntityStats, ENTITY_STATS } from '../entities/EntityType'

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
  protected mesh: THREE.Group
  protected position: THREE.Vector3
  protected isDead: boolean = false
  private lastAttackTime: number = 0
  private attackCooldown: number = 1000 // 1 second
  private deathAnimationTime: number = 0
  private isAnimatingDeath: boolean = false
  protected collisionRadius: number = 0.8 // 敌人碰撞半径
  protected world: { getBlock: (x: number, y: number, z: number) => number } | null = null
  protected verticalVelocity: number = 0
  protected gravity: number = 20 // 重力加速度
  protected isOnGround: boolean = false

  setWorld(world: { getBlock: (x: number, y: number, z: number) => number }): void {
    this.world = world
  }

  constructor(type: EntityType, position: THREE.Vector3, scene: THREE.Scene) {
    this.type = type
    this.stats = ENTITY_STATS[type]
    this.health = this.stats.maxHealth
    this.position = position.clone()

    // Create mesh group for complex models
    this.mesh = new THREE.Group()
    this.mesh.position.copy(position)
    scene.add(this.mesh)
  }

  // Get color for enemy type
  protected getColorForType(): number {
    switch (this.type) {
      case EntityType.SLIME: return 0x44ff44  // Green
      case EntityType.BAT: return 0x4444ff  // Blue
      case EntityType.SKELETON: return 0xeeeeee  // White
      default: return 0xff0000
    }
  }

  update(_deltaTime: number, _playerPosition: THREE.Vector3): void {
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

  // 检查与玩家的碰撞并推开
  protected checkPlayerCollision(playerPosition: THREE.Vector3): void {
    const distance = this.position.distanceTo(playerPosition)
    const minDistance = this.collisionRadius + 0.5 // 0.5 是玩家半径

    if (distance < minDistance && distance > 0) {
      // 计算推开方向
      const pushDirection = new THREE.Vector3()
        .subVectors(this.position, playerPosition)
        .normalize()

      // 推开敌人
      const pushDistance = minDistance - distance
      this.position.add(pushDirection.multiplyScalar(pushDistance))
      this.mesh.position.copy(this.position)
    }
  }

  // 检测地面高度
  protected findGroundLevel(): number {
    if (!this.world) return this.position.y

    const x = Math.floor(this.position.x)
    const z = Math.floor(this.position.z)

    // 从敌人当前位置向下搜索，找到第一个非空气方块
    // 最多向下搜索10个方块，避免性能问题
    const maxSearch = Math.floor(this.position.y)
    const minSearch = Math.max(0, maxSearch - 10)

    for (let y = maxSearch; y >= minSearch; y--) {
      const block = this.world.getBlock(x, y, z)
      if (block !== 0 && block !== undefined) { // 0 是 AIR
        return y + 1 // 站在方块上方
      }
    }

    // 如果附近找不到地面，保持在当前位置
    return this.position.y
  }

  // 应用重力和地面检测
  protected applyGravity(deltaTime: number): void {
    if (!this.world) return

    const groundLevel = this.findGroundLevel()

    // 检查是否在地面上
    if (this.position.y <= groundLevel + 0.1) {
      this.position.y = groundLevel
      this.verticalVelocity = 0
      this.isOnGround = true
    } else {
      // 在空中，应用重力
      this.isOnGround = false
      this.verticalVelocity -= this.gravity * deltaTime
      this.position.y += this.verticalVelocity * deltaTime
    }

    // 更新mesh位置
    this.mesh.position.copy(this.position)
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
        // Shrink and rotate
        const scale = 1 - progress
        this.mesh.scale.set(
          startScale.x * scale,
          startScale.y * (1 - progress * 0.5), // Flatten
          startScale.z * scale
        )

        // Rotate
        this.mesh.rotation.y += 0.1

        requestAnimationFrame(animate)
      } else {
        // Animation complete
        this.dispose(scene)
      }
    }
    requestAnimationFrame(animate)
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.mesh)
    // Dispose all children
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (child.material instanceof THREE.Material) {
          child.material.dispose()
        }
      } else if (child instanceof THREE.Group) {
        // Recursively dispose group children
        child.traverse((grandChild) => {
          if (grandChild instanceof THREE.Mesh) {
            grandChild.geometry.dispose()
            if (grandChild.material instanceof THREE.Material) {
              grandChild.material.dispose()
            }
          }
        })
      }
    })
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

  static async fromSaveData(data: EnemySaveData, scene: THREE.Scene): Promise<Enemy> {
    const type = data.type as EntityType
    const position = new THREE.Vector3(data.position.x, data.position.y, data.position.z)

    // Dynamic import based on type
    let enemy: Enemy
    switch (type) {
      case EntityType.SLIME:
        const { Slime } = await import('./Slime')
        enemy = new Slime(position, scene)
        break
      case EntityType.BAT:
        const { Bat } = await import('./Bat')
        enemy = new Bat(position, scene)
        break
      case EntityType.SKELETON:
        const { Skeleton } = await import('./Skeleton')
        enemy = new Skeleton(position, scene)
        break
      default:
        enemy = new Enemy(type, position, scene)
    }

    enemy.health = data.health
    enemy.isDead = data.isDead

    return enemy
  }
}

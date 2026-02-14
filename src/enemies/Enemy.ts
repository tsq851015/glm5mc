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
  private lastAttackTime: number = 0
  private attackCooldown: number = 1000 // 1 second
  private deathAnimationTime: number = 0
  private isAnimatingDeath: boolean = false

  constructor(type: EntityType, position: THREE.Vector3, scene: THREE.Scene) {
    this.type = type
    this.stats = (window as any).ENTITY_STATS ? (window as any).ENTITY_STATS[type] : {
      maxHealth: 15,
      damage: 3,
      moveSpeed: 2.5,
      attackRange: 1.5
    }
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

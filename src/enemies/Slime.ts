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

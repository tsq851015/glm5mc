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

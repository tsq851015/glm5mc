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

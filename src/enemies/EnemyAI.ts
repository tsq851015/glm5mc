import * as THREE from 'three'

export interface EnemyAI {
  update(deltaTime: number, enemyPosition: THREE.Vector3, playerPosition: THREE.Vector3): THREE.Vector3
}

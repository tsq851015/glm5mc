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
  private bodyMesh?: THREE.Mesh
  private bounceTime: number = 0

  constructor(position: THREE.Vector3, scene: THREE.Scene) {
    super(EntityType.SLIME, position, scene)
    this.ai = new SimpleAI()
    this.createSlimeModel()
  }

  private createSlimeModel(): void {
    // Main body - tapered cylinder (wider at bottom)
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.5, 0.6, 16)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x44ff44,
      transparent: true,
      opacity: 0.8,
      roughness: 0.3,
      metalness: 0.1
    })
    this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial)
    this.bodyMesh.position.y = 0.3
    this.mesh.add(this.bodyMesh)

    // Eyes - white spheres with black pupils
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8)
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff })
    const pupilGeometry = new THREE.SphereGeometry(0.04, 8, 8)
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })

    // Left eye
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    leftEye.position.set(-0.15, 0.5, 0.2)
    this.mesh.add(leftEye)

    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial)
    leftPupil.position.set(-0.15, 0.5, 0.25)
    this.mesh.add(leftPupil)

    // Right eye
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    rightEye.position.set(0.15, 0.5, 0.2)
    this.mesh.add(rightEye)

    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial)
    rightPupil.position.set(0.15, 0.5, 0.25)
    this.mesh.add(rightPupil)
  }

  override update(deltaTime: number, playerPosition: THREE.Vector3): void {
    if (!this.isAlive()) return

    const direction = this.ai.update(deltaTime, this.position, playerPosition)

    // Move towards player (只在水平方向移动)
    const movement = direction.multiplyScalar(this.stats.moveSpeed * deltaTime)
    this.position.x += movement.x
    this.position.z += movement.z

    // 应用重力和地面检测
    this.applyGravity(deltaTime)

    // 检查与玩家的碰撞
    this.checkPlayerCollision(playerPosition)

    // Bounce animation
    this.bounceTime += deltaTime * 5
    if (this.bodyMesh) {
      // 相对于地面进行弹跳动画
      const bounceOffset = Math.sin(this.bounceTime) * 0.1
      this.bodyMesh.position.y = 0.3 + bounceOffset
      this.bodyMesh.scale.y = 1 + Math.sin(this.bounceTime) * 0.15
    }
  }
}

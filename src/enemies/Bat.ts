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
  private leftWing?: THREE.Mesh
  private rightWing?: THREE.Mesh
  private wingTime: number = 0

  constructor(position: THREE.Vector3, scene: THREE.Scene) {
    super(EntityType.BAT, position, scene)
    this.ai = new FlyingAI()
    this.createBatModel()
  }

  private createBatModel(): void {
    // Body - small dark sphere
    const bodyGeometry = new THREE.SphereGeometry(0.2, 8, 8)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a4a,
      roughness: 0.8
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0.5
    this.mesh.add(body)

    // Head - smaller sphere
    const headGeometry = new THREE.SphereGeometry(0.12, 8, 8)
    const head = new THREE.Mesh(headGeometry, bodyMaterial)
    head.position.set(0, 0.65, 0.1)
    this.mesh.add(head)

    // Eyes - red glowing spheres
    const eyeGeometry = new THREE.SphereGeometry(0.03, 8, 8)
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    })

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    leftEye.position.set(-0.05, 0.68, 0.2)
    this.mesh.add(leftEye)

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    rightEye.position.set(0.05, 0.68, 0.2)
    this.mesh.add(rightEye)

    // Wings - flat triangles
    const wingGeometry = new THREE.BufferGeometry()
    const wingVertices = new Float32Array([
      0, 0.5, 0,    // body attachment point
      0.5, 0.4, 0.3, // wing tip
      0, 0.3, 0.2   // middle
    ])
    wingGeometry.setAttribute('position', new THREE.BufferAttribute(wingVertices, 3))
    wingGeometry.computeVertexNormals()

    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a5a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    })

    // Left wing
    this.leftWing = new THREE.Mesh(wingGeometry, wingMaterial)
    this.mesh.add(this.leftWing)

    // Right wing (mirrored)
    this.rightWing = new THREE.Mesh(wingGeometry.clone(), wingMaterial)
    this.rightWing.scale.x = -1
    this.mesh.add(this.rightWing)

    // Ears - pointed triangles on head
    const earGeometry = new THREE.ConeGeometry(0.05, 0.15, 4)
    const leftEar = new THREE.Mesh(earGeometry, bodyMaterial)
    leftEar.position.set(-0.08, 0.78, 0.05)
    leftEar.rotation.z = 0.3
    this.mesh.add(leftEar)

    const rightEar = new THREE.Mesh(earGeometry, bodyMaterial)
    rightEar.position.set(0.08, 0.78, 0.05)
    rightEar.rotation.z = -0.3
    this.mesh.add(rightEar)
  }

  override update(deltaTime: number, playerPosition: THREE.Vector3): void {
    if (!this.isAlive()) return

    const direction = this.ai.update(deltaTime, this.position, playerPosition)
    const movement = direction.multiplyScalar(this.stats.moveSpeed * deltaTime)

    // 蝙蝠只在水平方向移动，保持飞行高度
    this.position.x += movement.x
    this.position.z += movement.z

    // 检查与玩家的碰撞（蝙蝠保持一定距离）
    this.checkPlayerCollision(playerPosition)

    // Wing flapping animation
    this.wingTime += deltaTime * 15
    const flapAngle = Math.sin(this.wingTime) * 0.5

    if (this.leftWing && this.rightWing) {
      this.leftWing.rotation.z = flapAngle
      this.rightWing.rotation.z = -flapAngle

      // Slight wing bending
      const scaleY = 1 + Math.sin(this.wingTime * 2) * 0.1
      this.leftWing.scale.y = scaleY
      this.rightWing.scale.y = scaleY
    }

    // Hovering motion (上下悬停)
    this.position.y += Math.sin(this.wingTime * 0.5) * 0.002
    this.mesh.position.copy(this.position)
  }
}

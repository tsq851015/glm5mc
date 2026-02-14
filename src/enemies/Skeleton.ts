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

    // Simple obstacle detection - check if we're stuck
    const distance = enemyPosition.distanceTo(this.lastPosition)
    if (distance < 0.01) {
      this.stuckCounter++
    } else {
      this.stuckCounter = 0
    }
    this.lastPosition.copy(enemyPosition)

    // If stuck, try different directions
    if (this.stuckCounter > 10) {
      // Try left, right, then jump combinations
      const tryDirections = [
        new THREE.Vector3(direction.z, 0, -direction.x), // Perpendicular left
        new THREE.Vector3(-direction.z, 0, direction.x), // Perpendicular right
        new THREE.Vector3(direction.x, 1, direction.z).normalize(), // Try jumping
        new THREE.Vector3(-direction.x, 0, -direction.z) // Reverse
      ]

      for (const tryDir of tryDirections) {
        this.stuckCounter = 0
        return tryDir
      }
    }

    return direction
  }
}

export class Skeleton extends Enemy {
  private ai: EnemyAI
  private leftArm?: THREE.Group
  private rightArm?: THREE.Group
  private leftLeg?: THREE.Group
  private rightLeg?: THREE.Group
  private walkTime: number = 0

  constructor(position: THREE.Vector3, scene: THREE.Scene) {
    super(EntityType.SKELETON, position, scene)
    this.ai = new PathfindingAI()
    this.createSkeletonModel()
  }

  private createSkeletonModel(): void {
    // Bone material
    const boneMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8e8e8,
      roughness: 0.7
    })

    // Dark joint material
    const jointMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.8
    })

    // Head - skull shape
    const headGeometry = new THREE.BoxGeometry(0.25, 0.3, 0.25)
    const head = new THREE.Mesh(headGeometry, boneMaterial)
    head.position.y = 1.6
    this.mesh.add(head)

    // Eye sockets - dark boxes
    const eyeSocketGeometry = new THREE.BoxGeometry(0.06, 0.08, 0.1)
    const leftEyeSocket = new THREE.Mesh(eyeSocketGeometry, jointMaterial)
    leftEyeSocket.position.set(-0.06, 1.62, 0.1)
    this.mesh.add(leftEyeSocket)

    const rightEyeSocket = new THREE.Mesh(eyeSocketGeometry, jointMaterial)
    rightEyeSocket.position.set(0.06, 1.62, 0.1)
    this.mesh.add(rightEyeSocket)

    // Nose hole
    const noseGeometry = new THREE.BoxGeometry(0.05, 0.06, 0.05)
    const nose = new THREE.Mesh(noseGeometry, jointMaterial)
    nose.position.set(0, 1.55, 0.12)
    this.mesh.add(nose)

    // Spine / Body
    const spineGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.15)
    const spine = new THREE.Mesh(spineGeometry, boneMaterial)
    spine.position.y = 1.15
    this.mesh.add(spine)

    // Ribcage
    for (let i = 0; i < 3; i++) {
      const ribGeometry = new THREE.TorusGeometry(0.15, 0.03, 4, 8)
      const rib = new THREE.Mesh(ribGeometry, boneMaterial)
      rib.position.y = 1.35 - i * 0.12
      rib.rotation.x = Math.PI / 2
      this.mesh.add(rib)
    }

    // Pelvis
    const pelvisGeometry = new THREE.BoxGeometry(0.25, 0.15, 0.15)
    const pelvis = new THREE.Mesh(pelvisGeometry, boneMaterial)
    pelvis.position.y = 0.8
    this.mesh.add(pelvis)

    // Arms - groups for animation
    this.leftArm = new THREE.Group()
    this.leftArm.position.set(-0.2, 1.3, 0)
    this.mesh.add(this.leftArm)

    this.rightArm = new THREE.Group()
    this.rightArm.position.set(0.2, 1.3, 0)
    this.mesh.add(this.rightArm)

    // Upper arms
    const upperArmGeometry = new THREE.BoxGeometry(0.08, 0.35, 0.08)
    const leftUpperArm = new THREE.Mesh(upperArmGeometry, boneMaterial)
    leftUpperArm.position.y = -0.175
    this.leftArm.add(leftUpperArm)

    const rightUpperArm = new THREE.Mesh(upperArmGeometry, boneMaterial)
    rightUpperArm.position.y = -0.175
    this.rightArm.add(rightUpperArm)

    // Lower arms (forearms)
    const forearmGeometry = new THREE.BoxGeometry(0.06, 0.3, 0.06)
    const leftForearm = new THREE.Mesh(forearmGeometry, boneMaterial)
    leftForearm.position.y = -0.5
    this.leftArm.add(leftForearm)

    const rightForearm = new THREE.Mesh(forearmGeometry, boneMaterial)
    rightForearm.position.y = -0.5
    this.rightArm.add(rightForearm)

    // Hands
    const handGeometry = new THREE.BoxGeometry(0.07, 0.08, 0.07)
    const leftHand = new THREE.Mesh(handGeometry, boneMaterial)
    leftHand.position.y = -0.7
    this.leftArm.add(leftHand)

    const rightHand = new THREE.Mesh(handGeometry, boneMaterial)
    rightHand.position.y = -0.7
    this.rightArm.add(rightHand)

    // Legs - groups for animation
    this.leftLeg = new THREE.Group()
    this.leftLeg.position.set(-0.08, 0.72, 0)
    this.mesh.add(this.leftLeg)

    this.rightLeg = new THREE.Group()
    this.rightLeg.position.set(0.08, 0.72, 0)
    this.mesh.add(this.rightLeg)

    // Upper legs
    const upperLegGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.1)
    const leftUpperLeg = new THREE.Mesh(upperLegGeometry, boneMaterial)
    leftUpperLeg.position.y = -0.2
    this.leftLeg.add(leftUpperLeg)

    const rightUpperLeg = new THREE.Mesh(upperLegGeometry, boneMaterial)
    rightUpperLeg.position.y = -0.2
    this.rightLeg.add(rightUpperLeg)

    // Lower legs
    const lowerLegGeometry = new THREE.BoxGeometry(0.08, 0.35, 0.08)
    const leftLowerLeg = new THREE.Mesh(lowerLegGeometry, boneMaterial)
    leftLowerLeg.position.y = -0.575
    this.leftLeg.add(leftLowerLeg)

    const rightLowerLeg = new THREE.Mesh(lowerLegGeometry, boneMaterial)
    rightLowerLeg.position.y = -0.575
    this.rightLeg.add(rightLowerLeg)

    // Feet
    const footGeometry = new THREE.BoxGeometry(0.1, 0.06, 0.15)
    const leftFoot = new THREE.Mesh(footGeometry, boneMaterial)
    leftFoot.position.set(0, -0.76, 0.02)
    this.leftLeg.add(leftFoot)

    const rightFoot = new THREE.Mesh(footGeometry, boneMaterial)
    rightFoot.position.set(0, -0.76, 0.02)
    this.rightLeg.add(rightFoot)
  }

  override update(deltaTime: number, playerPosition: THREE.Vector3): void {
    if (!this.isAlive()) return

    const direction = this.ai.update(deltaTime, this.position, playerPosition)
    const movement = direction.multiplyScalar(this.stats.moveSpeed * deltaTime)

    // Check if actually moving
    const isMoving = movement.length() > 0

    // 只在水平方向移动
    this.position.x += movement.x
    this.position.z += movement.z

    // 应用重力和地面检测
    this.applyGravity(deltaTime)

    // 检查与玩家的碰撞
    this.checkPlayerCollision(playerPosition)

    // Face the player
    if (direction.length() > 0.1) {
      const angle = Math.atan2(direction.x, direction.z)
      this.mesh.rotation.y = angle
    }

    // Walking animation
    if (isMoving) {
      this.walkTime += deltaTime * 5

      // Arm swing (opposite to legs)
      if (this.leftArm && this.rightArm) {
        this.leftArm.rotation.x = Math.sin(this.walkTime) * 0.5
        this.rightArm.rotation.x = Math.sin(this.walkTime + Math.PI) * 0.5
      }

      // Leg swing
      if (this.leftLeg && this.rightLeg) {
        this.leftLeg.rotation.x = Math.sin(this.walkTime + Math.PI) * 0.6
        this.rightLeg.rotation.x = Math.sin(this.walkTime) * 0.6
      }
    } else {
      // Idle breathing
      this.walkTime = 0
      if (this.leftArm && this.rightArm) {
        this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, 0.1)
        this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, 0.1)
      }
      if (this.leftLeg && this.rightLeg) {
        this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, 0.1)
        this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, 0.1)
      }
    }
  }
}

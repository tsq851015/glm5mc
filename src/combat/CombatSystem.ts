import * as THREE from 'three'
import { Weapon } from './Weapon'
import { Enemy } from '../enemies/Enemy'

export interface AttackResult {
  hit: boolean
  damage: number
  position?: THREE.Vector3
}

export class CombatSystem {
  private camera: THREE.PerspectiveCamera
  private scene: THREE.Scene

  constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
    this.camera = camera
    this.scene = scene
  }

  performAttack(weapon: Weapon, enemies: Enemy[]): AttackResult {
    const stats = weapon.getStats()
    const damage = weapon.attack(performance.now() / 1000)

    // 计算攻击方向
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyQuaternion(this.camera.quaternion)

    const attackPosition = this.camera.position.clone().add(
      direction.multiplyScalar(stats.range * 0.5)
    )

    // 检测敌人碰撞
    let hitEnemy: Enemy | null = null
    let minDistance = stats.range

    for (const enemy of enemies) {
      if (!enemy.isAlive()) continue

      const distance = this.camera.position.distanceTo(enemy.getPosition())
      if (distance < minDistance) {
        // 检查敌人是否在前方 (点积）
        const toEnemy = new THREE.Vector3()
          .subVectors(enemy.getPosition(), this.camera.position)
          .normalize()

        const dot = direction.dot(toEnemy)
        if (dot > 0.5) { // 在约60度圆锥内
          minDistance = distance
          hitEnemy = enemy
        }
      }
    }

    if (hitEnemy) {
      hitEnemy.takeDamage(damage)
      this.createAttackEffect(hitEnemy.getPosition(), stats.range)

      return {
        hit: true,
        damage: damage,
        position: hitEnemy.getPosition()
      }
    }

    return {
      hit: false,
      damage: damage,
      position: attackPosition
    }
  }

  createAttackEffect(position: THREE.Vector3, _range: number): void {
    // 创建攻击特效 - 简单的扩散圆环
    const geometry = new THREE.RingGeometry(0.1, 0.3, 16)
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    })
    const effect = new THREE.Mesh(geometry, material)

    // 面向相机
    effect.position.copy(position)
    effect.lookAt(this.camera.position)
    this.scene.add(effect)

    // 动画消失
    const startTime = performance.now()
    const duration = 200 // ms

    const animate = () => {
      const elapsed = performance.now() - startTime
      const progress = elapsed / duration

      if (progress < 1) {
        effect.scale.setScalar(1 + progress * 2)
        material.opacity = 0.8 * (1 - progress)
        requestAnimationFrame(animate)
      } else {
        this.scene.remove(effect)
        geometry.dispose()
        material.dispose()
      }
    }
    animate()
  }
}

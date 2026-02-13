import * as THREE from 'three'
import { Weapon } from './Weapon'

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

  performAttack(weapon: Weapon): AttackResult {
    const stats = weapon.getStats()
    const damage = weapon.attack(performance.now() / 1000)

    // 计算攻击方向
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyQuaternion(this.camera.quaternion)

    const attackPosition = this.camera.position.clone().add(
      direction.multiplyScalar(stats.range * 0.5)
    )

    // TODO: 敌人碰撞检测 (Phase 4)

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

import * as THREE from 'three'
import { World } from '../world/World'

export class PlayerController {
  private camera: THREE.PerspectiveCamera
  private world: World
  private moveSpeed: number = 5
  private lookSpeed: number = 0.002
  private jumpForce: number = 8
  private gravity: number = 20
  private verticalVelocity: number = 0
  private isOnGround: boolean = false
  private playerHeight: number = 1.7

  private keys: { [key: string]: boolean } = {}
  private isLocked: boolean = false
  private euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ')

  constructor(camera: THREE.PerspectiveCamera, world: World) {
    this.camera = camera
    this.world = world
    this.setupControls()
  }

  private setupControls(): void {
    // 键盘事件
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true
    })

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false
    })

    // 鼠标锁定
    document.addEventListener('click', () => {
      if (!this.isLocked) {
        document.body.requestPointerLock()
      }
    })

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === document.body
    })

    // 鼠标移动
    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return

      this.euler.setFromQuaternion(this.camera.quaternion)
      this.euler.y -= e.movementX * this.lookSpeed
      this.euler.x -= e.movementY * this.lookSpeed
      this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x))
      this.camera.quaternion.setFromEuler(this.euler)
    })
  }

  update(deltaTime: number): void {
    if (!this.isLocked) return

    const position = this.camera.position

    // 获取移动方向
    const direction = new THREE.Vector3(0, 0, 0)
    if (this.keys['KeyW']) direction.z -= 1
    if (this.keys['KeyS']) direction.z += 1
    if (this.keys['KeyA']) direction.x -= 1
    if (this.keys['KeyD']) direction.x += 1

    // 标准化方向
    if (direction.length() > 0) {
      direction.normalize()
    }

    // 应用相机旋转到移动方向
    const forward = new THREE.Vector3(0, 0, -1)
    const right = new THREE.Vector3(1, 0, 0)
    forward.applyQuaternion(this.camera.quaternion)
    right.applyQuaternion(this.camera.quaternion)

    // 只在 XZ 平面移动
    forward.y = 0
    right.y = 0
    forward.normalize()
    right.normalize()

    // 计算水平移动
    const horizontalVelocity = new THREE.Vector3()
    horizontalVelocity.add(forward.multiplyScalar(-direction.z))
    horizontalVelocity.add(right.multiplyScalar(direction.x))
    horizontalVelocity.multiplyScalar(this.moveSpeed * deltaTime)

    // 应用水平移动
    position.x += horizontalVelocity.x
    position.z += horizontalVelocity.z

    // 检测脚下是否有方块
    const feetY = position.y - this.playerHeight
    const blockBelow = this.world.getBlock(
      Math.floor(position.x),
      Math.floor(feetY),
      Math.floor(position.z)
    )

    // 地面检测
    this.isOnGround = blockBelow !== 0 && blockBelow !== undefined

    // 重力
    if (!this.isOnGround) {
      this.verticalVelocity -= this.gravity * deltaTime
    } else {
      this.verticalVelocity = 0
      // 防止穿透地面
      position.y = Math.floor(feetY) + 1 + this.playerHeight
    }

    // 跳跃 (只在地面时)
    if (this.keys['Space'] && this.isOnGround) {
      this.verticalVelocity = this.jumpForce
      this.isOnGround = false
    }

    // Shift 快速下降 (飞行模式或在空中时)
    if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) {
      this.verticalVelocity -= 15 * deltaTime
    }

    // 应用垂直移动
    position.y += this.verticalVelocity * deltaTime

    // 防止掉出世界底部
    if (position.y < 1) {
      position.y = 1
      this.verticalVelocity = 0
      this.isOnGround = true
    }
  }

  getPosition(): THREE.Vector3 {
    return this.camera.position
  }

  setPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z)
  }

  getIsLocked(): boolean {
    return this.isLocked
  }

  getIsOnGround(): boolean {
    return this.isOnGround
  }
}

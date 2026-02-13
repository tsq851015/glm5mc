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

  private playerRadius: number = 0.3

  update(deltaTime: number): void {
    if (!this.isLocked) return

    const position = this.camera.position.clone()

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

    // 水平碰撞检测 - 分别检测 X 和 Z 方向
    const newX = position.x + horizontalVelocity.x
    const newZ = position.z + horizontalVelocity.z

    // 检测 X 方向是否有碰撞
    if (!this.checkHorizontalCollision(newX, position.y, position.z)) {
      this.camera.position.x = newX
    }

    // 检测 Z 方向是否有碰撞
    if (!this.checkHorizontalCollision(this.camera.position.x, position.y, newZ)) {
      this.camera.position.z = newZ
    }

    // 更新位置引用
    const currentPos = this.camera.position

    // 检测脚下是否有方块
    const feetY = currentPos.y - this.playerHeight
    const blockBelow = this.world.getBlock(
      Math.floor(currentPos.x),
      Math.floor(feetY),
      Math.floor(currentPos.z)
    )

    // 地面检测
    this.isOnGround = blockBelow !== 0 && blockBelow !== undefined

    // 重力
    if (!this.isOnGround) {
      this.verticalVelocity -= this.gravity * deltaTime
    } else {
      this.verticalVelocity = 0
      // 防止穿透地面
      currentPos.y = Math.floor(feetY) + 1 + this.playerHeight
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
    currentPos.y += this.verticalVelocity * deltaTime

    // 防止掉出世界底部
    if (currentPos.y < 1) {
      currentPos.y = 1
      this.verticalVelocity = 0
      this.isOnGround = true
    }
  }

  // 检测水平方向碰撞
  private checkHorizontalCollision(x: number, y: number, z: number): boolean {
    const feetY = y - this.playerHeight

    // 检测玩家身体范围内的多个高度点
    for (let checkY = Math.floor(feetY); checkY <= Math.floor(y); checkY++) {
      // 检测玩家周围的方块 (使用玩家半径)
      const blockX = Math.floor(x)
      const blockZ = Math.floor(z)

      const block = this.world.getBlock(blockX, checkY, blockZ)
      if (block !== 0 && block !== undefined) {
        return true // 有碰撞
      }
    }

    return false // 无碰撞
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

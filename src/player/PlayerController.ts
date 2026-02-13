import * as THREE from 'three'

export class PlayerController {
  private camera: THREE.PerspectiveCamera
  private moveSpeed: number = 5
  private lookSpeed: number = 0.002
  private velocity: THREE.Vector3 = new THREE.Vector3()
  private direction: THREE.Vector3 = new THREE.Vector3()

  private keys: { [key: string]: boolean } = {}
  private isLocked: boolean = false
  private euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ')

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera
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

    // 获取移动方向
    this.direction.set(0, 0, 0)

    if (this.keys['KeyW']) this.direction.z -= 1
    if (this.keys['KeyS']) this.direction.z += 1
    if (this.keys['KeyA']) this.direction.x -= 1
    if (this.keys['KeyD']) this.direction.x += 1

    // 标准化方向
    if (this.direction.length() > 0) {
      this.direction.normalize()
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

    // 计算水平速度
    this.velocity.set(0, 0, 0)
    this.velocity.add(forward.multiplyScalar(-this.direction.z))
    this.velocity.add(right.multiplyScalar(this.direction.x))
    this.velocity.multiplyScalar(this.moveSpeed * deltaTime)

    // 垂直移动: 空格上升, Shift 下降
    if (this.keys['Space']) {
      this.velocity.y = this.moveSpeed * deltaTime
    }
    if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) {
      this.velocity.y = -this.moveSpeed * deltaTime
    }

    // 应用移动
    this.camera.position.add(this.velocity)
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
}

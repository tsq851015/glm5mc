import * as THREE from 'three'
import { Time } from './Time'

export class Game {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private time: Time
  private isRunning: boolean = false

  constructor() {
    // 初始化场景
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a2e)

    // 初始化相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.set(0, 10, 20)
    this.camera.lookAt(0, 0, 0)

    // 初始化渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)

    // 初始化时间管理
    this.time = new Time()

    // 设置灯光
    this.setupLights()

    // 监听窗口大小变化
    window.addEventListener('resize', this.onResize.bind(this))
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 20, 10)
    this.scene.add(directionalLight)
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    document.getElementById('app')?.appendChild(this.renderer.domElement)
    this.gameLoop(0)
  }

  private gameLoop(currentTime: number): void {
    if (!this.isRunning) return

    this.time.update(currentTime)
    this.update(this.time.deltaTime)
    this.render()

    requestAnimationFrame((t) => this.gameLoop(t))
  }

  protected update(_deltaTime: number): void {
    // 子类或后续扩展实现
  }

  protected render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  stop(): void {
    this.isRunning = false
  }

  getScene(): THREE.Scene {
    return this.scene
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }
}

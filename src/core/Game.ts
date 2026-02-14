import * as THREE from 'three'
import { Time } from './Time'
import { SaveManager } from '../save/SaveManager'
import { AutoSave } from '../save/AutoSave'
import { SaveData, PlayerSaveData, ModifiedBlock } from '../save/SaveData'

export class Game {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private time: Time
  private isRunning: boolean = false
  private saveManager: SaveManager
  private autoSave: AutoSave
  private isSaveLoaded: boolean = false

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

    // 初始化保存系统
    this.saveManager = new SaveManager()
    this.autoSave = new AutoSave(this.saveManager)

    // 初始化保存系统
    this.saveManager.init().then(() => {
      console.log('Save system initialized')
    }).catch(err => {
      console.error('Failed to initialize save system:', err)
    })

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

    // Check auto-save
    this.checkAutoSave().catch(err => {
      console.error('Auto-save failed:', err)
    })

    this.render()

    requestAnimationFrame((t) => this.gameLoop(t))
  }

  async saveGame(slot: number = 0): Promise<boolean> {
    const playerPos = this.camera.position

    // Gather save data from all systems
    const playerData: PlayerSaveData = {
      position: {
        x: playerPos.x,
        y: playerPos.y,
        z: playerPos.z
      },
      health: 100, // Will get from PlayerController when integrated
      inventory: [] // Will get from Inventory when integrated
    }

    const modifiedBlocks: ModifiedBlock[] = []
    // TODO: Get from World.getModifiedBlocks()

    const saveData: SaveData = {
      version: '1.0',
      timestamp: Date.now(),
      player: playerData,
      modifiedBlocks: modifiedBlocks
    }

    const success = await this.autoSave.save(slot, saveData)
    if (success) {
      console.log(`Game saved to slot ${slot}`)
    } else {
      console.error('Failed to save game')
    }

    return success
  }

  async loadGame(slot: number = 0): Promise<boolean> {
    const saveData = await this.autoSave.load(slot)

    if (!saveData) {
      console.log(`No save found in slot ${slot}`)
      return false
    }

    // Validate version
    if (saveData.version !== '1.0') {
      console.error(`Incompatible save version: ${saveData.version}`)
      return false
    }

    // Restore player position
    this.camera.position.set(
      saveData.player.position.x,
      saveData.player.position.y,
      saveData.player.position.z
    )

    // Restore blocks
    // TODO: Apply modifiedBlocks to World

    this.isSaveLoaded = true
    console.log(`Game loaded from slot ${slot}`)
    return true
  }

  async checkAutoSave(): Promise<void> {
    if (this.autoSave.shouldSave()) {
      await this.saveGame(0) // Auto-save to slot 0
    }
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

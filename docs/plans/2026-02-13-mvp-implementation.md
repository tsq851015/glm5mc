# Underground Explorer MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个可玩的第一人称地下探索游戏 MVP，包含移动、挖掘、基础敌人和战斗。

**Architecture:** Three.js 渲染体素世界，第一人称控制器，基于区块的地形生成，简单实体系统。

**Tech Stack:** TypeScript + Vite + Three.js + simplex-noise

---

## Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/style.css`

**Step 1: 初始化 npm 项目**

```bash
cd J:/testglm5
npm init -y
```

**Step 2: 安装依赖**

```bash
npm install three simplex-noise
npm install -D typescript vite @types/three
```

**Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

**Step 4: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000
  }
})
```

**Step 5: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Underground Explorer</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

**Step 6: 创建 src/style.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
}

canvas {
  display: block;
}
```

**Step 7: 创建 src/main.ts**

```typescript
import './style.css'
import * as THREE from 'three'

// 初始化场景
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x1a1a2e)

// 初始化相机
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0, 10, 20)

// 初始化渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
document.getElementById('app')?.appendChild(renderer.domElement)

// 添加环境光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

// 添加方向光
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(10, 20, 10)
scene.add(directionalLight)

// 添加测试方块
const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshLambertMaterial({ color: 0x4a7c59 })
const cube = new THREE.Mesh(geometry, material)
scene.add(cube)

// 窗口大小调整
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// 渲染循环
function animate() {
  requestAnimationFrame(animate)
  cube.rotation.x += 0.01
  cube.rotation.y += 0.01
  renderer.render(scene, camera)
}

animate()

console.log('Underground Explorer initialized!')
```

**Step 8: 更新 package.json scripts**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

**Step 9: 验证项目运行**

```bash
npm run dev
```

Expected: 浏览器打开 http://localhost:3000 显示一个旋转的绿色方块

**Step 10: 提交**

```bash
git add .
git commit -m "feat: initialize project with Vite + TypeScript + Three.js

- Set up development environment
- Add basic scene with rotating cube
- Configure TypeScript and Vite

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: 游戏核心循环

**Files:**
- Create: `src/core/Game.ts`
- Create: `src/core/Time.ts`
- Modify: `src/main.ts`

**Step 1: 创建 src/core/Time.ts**

```typescript
export class Time {
  private lastTime: number = 0
  public deltaTime: number = 0
  public elapsed: number = 0

  update(currentTime: number): void {
    if (this.lastTime === 0) {
      this.lastTime = currentTime
    }
    this.deltaTime = (currentTime - this.lastTime) / 1000
    this.elapsed += this.deltaTime
    this.lastTime = currentTime
  }
}
```

**Step 2: 创建 src/core/Game.ts**

```typescript
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
```

**Step 3: 更新 src/main.ts**

```typescript
import './style.css'
import { Game } from './core/Game'

const game = new Game()
game.start()

console.log('Underground Explorer started!')
```

**Step 4: 验证运行**

```bash
npm run dev
```

Expected: 浏览器显示黑色背景的空场景（正常，因为还没有添加对象）

**Step 5: 提交**

```bash
git add .
git commit -m "feat: add Game core loop and Time management

- Create Game class with scene, camera, renderer
- Add Time class for delta time tracking
- Refactor main.ts to use Game class

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: 区块与方块系统

**Files:**
- Create: `src/world/BlockType.ts`
- Create: `src/world/Chunk.ts`
- Create: `src/world/World.ts`

**Step 1: 创建 src/world/BlockType.ts**

```typescript
export enum BlockType {
  AIR = 0,
  DIRT = 1,
  STONE = 2,
  DEEP_STONE = 3,
  COPPER_ORE = 4,
  IRON_ORE = 5,
}

export interface BlockDefinition {
  name: string
  color: number
  hardness: number
}

export const BLOCK_DEFINITIONS: Record<BlockType, BlockDefinition> = {
  [BlockType.AIR]: { name: 'Air', color: 0x000000, hardness: 0 },
  [BlockType.DIRT]: { name: 'Dirt', color: 0x8b4513, hardness: 1 },
  [BlockType.STONE]: { name: 'Stone', color: 0x808080, hardness: 2 },
  [BlockType.DEEP_STONE]: { name: 'Deep Stone', color: 0x4a4a4a, hardness: 3 },
  [BlockType.COPPER_ORE]: { name: 'Copper Ore', color: 0xb87333, hardness: 2 },
  [BlockType.IRON_ORE]: { name: 'Iron Ore', color: 0xa19d94, hardness: 2 },
}

export const CHUNK_SIZE = 16
export const CHUNK_HEIGHT = 32
```

**Step 2: 创建 src/world/Chunk.ts**

```typescript
import * as THREE from 'three'
import { BlockType, BLOCK_DEFINITIONS, CHUNK_SIZE, CHUNK_HEIGHT } from './BlockType'

export class Chunk {
  private blocks: Uint8Array
  private mesh: THREE.Mesh | null = null
  private position: THREE.Vector3

  constructor(x: number, z: number) {
    this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE)
    this.position = new THREE.Vector3(x * CHUNK_SIZE, 0, z * CHUNK_SIZE)
  }

  getBlockIndex(x: number, y: number, z: number): number {
    return y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x
  }

  getBlock(x: number, y: number, z: number): BlockType {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return BlockType.AIR
    }
    return this.blocks[this.getBlockIndex(x, y, z)]
  }

  setBlock(x: number, y: number, z: number, type: BlockType): void {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return
    }
    this.blocks[this.getBlockIndex(x, y, z)] = type
  }

  generateMesh(): THREE.Mesh {
    const geometry = new THREE.BufferGeometry()
    const vertices: number[] = []
    const colors: number[] = []
    const normals: number[] = []

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const blockType = this.getBlock(x, y, z)
          if (blockType === BlockType.AIR) continue

          const color = new THREE.Color(BLOCK_DEFINITIONS[blockType].color)

          // 检查每个面是否需要渲染（相邻面是空气则渲染）
          this.addFaceIfExposed(vertices, colors, normals, x, y, z, color, 'top')
          this.addFaceIfExposed(vertices, colors, normals, x, y, z, color, 'bottom')
          this.addFaceIfExposed(vertices, colors, normals, x, y, z, color, 'front')
          this.addFaceIfExposed(vertices, colors, normals, x, y, z, color, 'back')
          this.addFaceIfExposed(vertices, colors, normals, x, y, z, color, 'left')
          this.addFaceIfExposed(vertices, colors, normals, x, y, z, color, 'right')
        }
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))

    const material = new THREE.MeshLambertMaterial({ vertexColors: true })
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.copy(this.position)

    return this.mesh
  }

  private addFaceIfExposed(
    vertices: number[],
    colors: number[],
    normals: number[],
    x: number,
    y: number,
    z: number,
    color: THREE.Color,
    face: string
  ): void {
    // 检查相邻方块
    let exposed = false
    const nx = x, ny = y, nz = z

    switch (face) {
      case 'top':
        exposed = this.getBlock(x, y + 1, z) === BlockType.AIR
        break
      case 'bottom':
        exposed = this.getBlock(x, y - 1, z) === BlockType.AIR
        break
      case 'front':
        exposed = this.getBlock(x, y, z + 1) === BlockType.AIR
        break
      case 'back':
        exposed = this.getBlock(x, y, z - 1) === BlockType.AIR
        break
      case 'left':
        exposed = this.getBlock(x - 1, y, z) === BlockType.AIR
        break
      case 'right':
        exposed = this.getBlock(x + 1, y, z) === BlockType.AIR
        break
    }

    if (!exposed) return

    // 添加面的顶点
    const faceData = this.getFaceVertices(x, y, z, face)
    vertices.push(...faceData.vertices)
    normals.push(...faceData.normals)

    // 添加颜色（每个顶点）
    for (let i = 0; i < 6; i++) {
      colors.push(color.r, color.g, color.b)
    }
  }

  private getFaceVertices(x: number, y: number, z: number, face: string): { vertices: number[], normals: number[] } {
    const vertices: number[] = []
    const normals: number[] = []

    switch (face) {
      case 'top':
        vertices.push(
          x, y + 1, z,
          x + 1, y + 1, z,
          x + 1, y + 1, z + 1,
          x, y + 1, z,
          x + 1, y + 1, z + 1,
          x, y + 1, z + 1
        )
        normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0)
        break
      case 'bottom':
        vertices.push(
          x, y, z + 1,
          x + 1, y, z + 1,
          x + 1, y, z,
          x, y, z + 1,
          x + 1, y, z,
          x, y, z
        )
        normals.push(0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0)
        break
      case 'front':
        vertices.push(
          x, y, z + 1,
          x, y + 1, z + 1,
          x + 1, y + 1, z + 1,
          x, y, z + 1,
          x + 1, y + 1, z + 1,
          x + 1, y, z + 1
        )
        normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1)
        break
      case 'back':
        vertices.push(
          x + 1, y, z,
          x + 1, y + 1, z,
          x, y + 1, z,
          x + 1, y, z,
          x, y + 1, z,
          x, y, z
        )
        normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1)
        break
      case 'left':
        vertices.push(
          x, y, z,
          x, y + 1, z,
          x, y + 1, z + 1,
          x, y, z,
          x, y + 1, z + 1,
          x, y, z + 1
        )
        normals.push(-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0)
        break
      case 'right':
        vertices.push(
          x + 1, y, z + 1,
          x + 1, y + 1, z + 1,
          x + 1, y + 1, z,
          x + 1, y, z + 1,
          x + 1, y + 1, z,
          x + 1, y, z
        )
        normals.push(1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0)
        break
    }

    return { vertices, normals }
  }

  getMesh(): THREE.Mesh | null {
    return this.mesh
  }

  getPosition(): THREE.Vector3 {
    return this.position
  }
}
```

**Step 3: 创建 src/world/World.ts**

```typescript
import * as THREE from 'three'
import { createNoise2D } from 'simplex-noise'
import { Chunk } from './Chunk'
import { BlockType, CHUNK_SIZE, CHUNK_HEIGHT } from './BlockType'

export class World {
  private chunks: Map<string, Chunk> = new Map()
  private scene: THREE.Scene
  private noise2D: ReturnType<typeof createNoise2D>
  private seed: number

  constructor(scene: THREE.Scene, seed: number = Date.now()) {
    this.scene = scene
    this.seed = seed
    this.noise2D = createNoise2D(() => this.seed / 10000)
  }

  private getChunkKey(x: number, z: number): string {
    return `${x},${z}`
  }

  generateChunk(chunkX: number, chunkZ: number): Chunk {
    const key = this.getChunkKey(chunkX, chunkZ)
    if (this.chunks.has(key)) {
      return this.chunks.get(key)!
    }

    const chunk = new Chunk(chunkX, chunkZ)

    // 生成地形
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const worldX = chunkX * CHUNK_SIZE + x
        const worldZ = chunkZ * CHUNK_SIZE + z

        // 使用噪声生成高度
        const noiseValue = this.noise2D(worldX * 0.05, worldZ * 0.05)
        const height = Math.floor((noiseValue + 1) * 5) + 10

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          let blockType = BlockType.AIR

          if (y === 0) {
            blockType = BlockType.STONE
          } else if (y < height - 4) {
            blockType = BlockType.DEEP_STONE
            // 随机添加矿石
            if (Math.random() < 0.02) blockType = BlockType.COPPER_ORE
            if (Math.random() < 0.01) blockType = BlockType.IRON_ORE
          } else if (y < height) {
            blockType = BlockType.STONE
          } else if (y === height) {
            blockType = BlockType.DIRT
          }

          chunk.setBlock(x, y, z, blockType)
        }
      }
    }

    // 生成洞穴
    this.generateCaves(chunk, chunkX, chunkZ)

    // 生成并添加网格到场景
    const mesh = chunk.generateMesh()
    this.scene.add(mesh)

    this.chunks.set(key, chunk)
    return chunk
  }

  private generateCaves(chunk: Chunk, chunkX: number, chunkZ: number): void {
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let y = 1; y < CHUNK_HEIGHT - 5; y++) {
          const worldX = chunkX * CHUNK_SIZE + x
          const worldZ = chunkZ * CHUNK_SIZE + z

          // 3D 噪声生成洞穴
          const caveNoise = this.noise2D(worldX * 0.1 + y * 0.1, worldZ * 0.1)
          if (caveNoise > 0.7) {
            chunk.setBlock(x, y, z, BlockType.AIR)
          }
        }
      }
    }
  }

  generateInitialChunks(radius: number = 2): void {
    for (let x = -radius; x <= radius; x++) {
      for (let z = -radius; z <= radius; z++) {
        this.generateChunk(x, z)
      }
    }
  }

  getChunk(chunkX: number, chunkZ: number): Chunk | undefined {
    return this.chunks.get(this.getChunkKey(chunkX, chunkZ))
  }
}

**Step 4: 更新 src/main.ts 集成 World**

```typescript
import './style.css'
import { Game } from './core/Game'
import { World } from './world/World'

class UndergroundGame extends Game {
  private world!: World

  protected override update(_deltaTime: number): void {
    // 游戏更新逻辑
  }
}

const game = new UndergroundGame()
game.start()

// 生成世界
const world = new World(game.getScene())
world.generateInitialChunks(1)

console.log('Underground Explorer started with world!')
```

**Step 5: 验证运行**

```bash
npm run dev
```

Expected: 浏览器显示生成的地形方块，按 F12 可以看到控制台输出

**Step 6: 提交**

```bash
git add .
git commit -m "feat: add Chunk and World system with procedural generation

- Create BlockType enum with 6 block types
- Implement Chunk with greedy mesh rendering
- Add World with noise-based terrain generation
- Include cave generation system

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: 第一人称控制器

**Files:**
- Create: `src/player/PlayerController.ts`
- Modify: `src/main.ts`

**Step 1: 创建 src/player/PlayerController.ts**

```typescript
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

    // 计算速度
    this.velocity.set(0, 0, 0)
    this.velocity.add(forward.multiplyScalar(-this.direction.z))
    this.velocity.add(right.multiplyScalar(this.direction.x))
    this.velocity.multiplyScalar(this.moveSpeed * deltaTime)

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
```

**Step 2: 更新 src/main.ts**

```typescript
import './style.css'
import { Game } from './core/Game'
import { World } from './world/World'
import { PlayerController } from './player/PlayerController'

class UndergroundGame extends Game {
  private world!: World
  private playerController!: PlayerController

  protected override update(deltaTime: number): void {
    if (this.playerController) {
      this.playerController.update(deltaTime)
    }
  }
}

const game = new UndergroundGame()
game.start()

// 设置玩家初始位置
const camera = game.getCamera()
camera.position.set(8, 25, 8)

// 创建玩家控制器
const playerController = new PlayerController(camera)

// 生成世界
const world = new World(game.getScene())
world.generateInitialChunks(1)

console.log('Underground Explorer started!')
console.log('Click to enable mouse control, WASD to move')
```

**Step 3: 验证运行**

```bash
npm run dev
```

Expected:
- 点击屏幕锁定鼠标
- WASD 移动
- 鼠标控制视角
- ESC 退出鼠标锁定

**Step 4: 提交**

```bash
git add .
git commit -m "feat: add first-person player controller

- WASD movement with camera direction
- Mouse look with pointer lock
- Smooth movement with delta time

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: 基础 HUD 界面

**Files:**
- Modify: `src/style.css`
- Create: `src/ui/HUD.ts`

**Step 1: 更新 src/style.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

#app {
  width: 100%;
  height: 100%;
  position: relative;
}

canvas {
  display: block;
}

/* HUD 样式 */
.hud {
  position: fixed;
  pointer-events: none;
  z-index: 100;
}

/* 准心 */
.crosshair {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  z-index: 100;
}

.crosshair::before,
.crosshair::after {
  content: '';
  position: absolute;
  background: white;
  opacity: 0.8;
}

.crosshair::before {
  width: 2px;
  height: 20px;
  left: 9px;
  top: 0;
}

.crosshair::after {
  width: 20px;
  height: 2px;
  left: 0;
  top: 9px;
}

/* 生命条 */
.health-bar {
  bottom: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.health-bar .label {
  color: #ff4444;
  font-size: 24px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.health-bar .bar-container {
  width: 200px;
  height: 20px;
  background: rgba(0,0,0,0.5);
  border-radius: 10px;
  overflow: hidden;
}

.health-bar .bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff4444, #ff6666);
  transition: width 0.3s ease;
}

/* 快捷栏 */
.hotbar {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
  background: rgba(0,0,0,0.5);
  padding: 5px;
  border-radius: 5px;
}

.hotbar-slot {
  width: 50px;
  height: 50px;
  background: rgba(255,255,255,0.1);
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
}

.hotbar-slot.active {
  border-color: #ffffff;
  background: rgba(255,255,255,0.2);
}

/* 提示文字 */
.instructions {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  background: rgba(0,0,0,0.7);
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 14px;
  z-index: 100;
  transition: opacity 0.5s ease;
}
```

**Step 2: 创建 src/ui/HUD.ts**

```typescript
export class HUD {
  private healthBar: HTMLElement
  private healthFill: HTMLElement
  private hotbarSlots: HTMLElement[] = []
  private instructions: HTMLElement
  private crosshair: HTMLElement

  constructor() {
    this.createHUD()
    this.healthBar = document.getElementById('health-bar')!
    this.healthFill = document.getElementById('health-fill')!
    this.instructions = document.getElementById('instructions')!
    this.crosshair = document.getElementById('crosshair')!

    // 初始化快捷栏
    for (let i = 1; i <= 6; i++) {
      const slot = document.getElementById(`hotbar-${i}`)
      if (slot) this.hotbarSlots.push(slot)
    }

    this.setActiveSlot(0)
  }

  private createHUD(): void {
    const hudContainer = document.createElement('div')
    hudContainer.innerHTML = `
      <!-- 准心 -->
      <div id="crosshair" class="crosshair"></div>

      <!-- 生命条 -->
      <div class="hud health-bar">
        <span class="label">❤️</span>
        <div class="bar-container">
          <div id="health-fill" class="bar-fill" style="width: 100%"></div>
        </div>
      </div>

      <!-- 快捷栏 -->
      <div class="hud hotbar">
        <div id="hotbar-1" class="hotbar-slot active">1</div>
        <div id="hotbar-2" class="hotbar-slot">2</div>
        <div id="hotbar-3" class="hotbar-slot">3</div>
        <div id="hotbar-4" class="hotbar-slot">4</div>
        <div id="hotbar-5" class="hotbar-slot">5</div>
        <div id="hotbar-6" class="hotbar-slot">6</div>
      </div>

      <!-- 提示 -->
      <div id="instructions" class="instructions">
        点击开始游戏 | WASD 移动 | 鼠标视角
      </div>
    `
    document.body.appendChild(hudContainer)
  }

  setHealth(health: number, maxHealth: number = 100): void {
    const percentage = (health / maxHealth) * 100
    this.healthFill.style.width = `${percentage}%`
  }

  setActiveSlot(index: number): void {
    this.hotbarSlots.forEach((slot, i) => {
      slot.classList.toggle('active', i === index)
    })
  }

  hideInstructions(): void {
    this.instructions.style.opacity = '0'
    setTimeout(() => {
      this.instructions.style.display = 'none'
    }, 500)
  }

  showInstructions(): void {
    this.instructions.style.display = 'block'
    setTimeout(() => {
      this.instructions.style.opacity = '1'
    }, 10)
  }

  setCrosshairVisible(visible: boolean): void {
    this.crosshair.style.display = visible ? 'block' : 'none'
  }
}
```

**Step 3: 更新 src/main.ts**

```typescript
import './style.css'
import { Game } from './core/Game'
import { World } from './world/World'
import { PlayerController } from './player/PlayerController'
import { HUD } from './ui/HUD'

class UndergroundGame extends Game {
  private world!: World
  private playerController!: PlayerController
  private hud!: HUD

  protected override update(deltaTime: number): void {
    if (this.playerController) {
      this.playerController.update(deltaTime)

      // 更新 HUD 状态
      if (this.hud) {
        if (this.playerController.getIsLocked()) {
          this.hud.hideInstructions()
          this.hud.setCrosshairVisible(true)
        } else {
          this.hud.showInstructions()
          this.hud.setCrosshairVisible(false)
        }
      }
    }
  }
}

const game = new UndergroundGame()
game.start()

// 设置玩家初始位置
const camera = game.getCamera()
camera.position.set(8, 25, 8)

// 创建 HUD
const hud = new HUD()

// 创建玩家控制器
const playerController = new PlayerController(camera)

// 生成世界
const world = new World(game.getScene())
world.generateInitialChunks(1)

console.log('Underground Explorer started!')
```

**Step 4: 验证运行**

```bash
npm run dev
```

Expected:
- 显示准心、生命条、快捷栏
- 点击后隐藏提示
- ESC 后显示提示

**Step 5: 提交**

```bash
git add .
git commit -m "feat: add basic HUD interface

- Crosshair for aiming
- Health bar display
- 6-slot hotbar
- Instructions overlay
- Toggle based on pointer lock state

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## MVP 完成检查点

完成以上 5 个任务后，MVP 包含：

- [x] 项目基础架构 (Vite + TypeScript + Three.js)
- [x] 游戏核心循环
- [x] 程序化地形生成
- [x] 方块系统 (6 种方块)
- [x] 第一人称控制器
- [x] 基础 HUD

**后续迭代内容** (Phase 2-5):
- 简单敌人和 AI
- 战斗系统
- 队友 NPC 系统
- 更多内容层
- Boss 战斗
- 存档系统

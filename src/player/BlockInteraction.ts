import * as THREE from 'three'
import { World } from '../world/World'
import { BlockType, BLOCK_DEFINITIONS } from '../world/BlockType'

export interface BlockHit {
  position: THREE.Vector3
  normal: THREE.Vector3
  blockType: BlockType
}

export class BlockInteraction {
  private camera: THREE.PerspectiveCamera
  private world: World
  private reachDistance: number = 5
  private highlightMesh: THREE.Mesh | null = null

  constructor(camera: THREE.PerspectiveCamera, world: World, scene: THREE.Scene) {
    this.camera = camera
    this.world = world

    // 创建高亮方块
    const geometry = new THREE.BoxGeometry(1.01, 1.01, 1.01)
    const edges = new THREE.EdgesGeometry(geometry)
    const material = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })
    this.highlightMesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        opacity: 0.2,
        transparent: true,
        depthTest: true
      })
    )
    const outline = new THREE.LineSegments(edges, material)
    this.highlightMesh.add(outline)
    this.highlightMesh.visible = false
    scene.add(this.highlightMesh)
  }

  getTargetBlock(): BlockHit | null {
    const direction = new THREE.Vector3()
    this.camera.getWorldDirection(direction)

    const step = 0.1
    const maxDistance = this.reachDistance
    const playerPos = this.camera.position.clone()

    let prevPos = playerPos.clone()

    for (let d = 0; d < maxDistance; d += step) {
      const current = playerPos.clone().add(direction.clone().multiplyScalar(d))

      const blockX = Math.floor(current.x)
      const blockY = Math.floor(current.y)
      const blockZ = Math.floor(current.z)

      const blockType = this.world.getBlock(blockX, blockY, blockZ)

      if (blockType !== BlockType.AIR && blockType !== undefined) {
        const normal = this.calculateNormal(prevPos, blockX, blockY, blockZ)

        return {
          position: new THREE.Vector3(blockX, blockY, blockZ),
          normal: normal,
          blockType: blockType
        }
      }

      prevPos = current.clone()
    }

    return null
  }

  private calculateNormal(prevPos: THREE.Vector3, blockX: number, blockY: number, blockZ: number): THREE.Vector3 {
    const center = new THREE.Vector3(blockX + 0.5, blockY + 0.5, blockZ + 0.5)
    const diff = prevPos.clone().sub(center)

    const absX = Math.abs(diff.x)
    const absY = Math.abs(diff.y)
    const absZ = Math.abs(diff.z)

    if (absX > absY && absX > absZ) {
      return new THREE.Vector3(diff.x > 0 ? 1 : -1, 0, 0)
    } else if (absY > absZ) {
      return new THREE.Vector3(0, diff.y > 0 ? 1 : -1, 0)
    } else {
      return new THREE.Vector3(0, 0, diff.z > 0 ? 1 : -1)
    }
  }

  updateHighlight(): void {
    const hit = this.getTargetBlock()

    if (hit && this.highlightMesh) {
      this.highlightMesh.position.set(
        hit.position.x + 0.5,
        hit.position.y + 0.5,
        hit.position.z + 0.5
      )
      this.highlightMesh.visible = true
    } else if (this.highlightMesh) {
      this.highlightMesh.visible = false
    }
  }

  breakBlock(): BlockType | null {
    const hit = this.getTargetBlock()

    if (hit) {
      const { x, y, z } = hit.position
      const blockType = this.world.getBlock(x, y, z)

      // 基岩不可破坏 (hardness -1)
      if (BLOCK_DEFINITIONS[blockType]?.hardness === -1) {
        return null
      }

      this.world.setBlock(x, y, z, BlockType.AIR)
      return blockType
    }

    return null
  }

  placeBlock(blockType: BlockType): boolean {
    const hit = this.getTargetBlock()

    if (hit) {
      const placePos = hit.position.clone().add(hit.normal)
      const x = Math.floor(placePos.x)
      const y = Math.floor(placePos.y)
      const z = Math.floor(placePos.z)

      // 检查是否与玩家碰撞
      const playerPos = this.camera.position
      const playerMinY = playerPos.y - 1.7
      const playerMaxY = playerPos.y

      if (y >= Math.floor(playerMinY) && y <= Math.ceil(playerMaxY) &&
          Math.abs(x + 0.5 - playerPos.x) < 0.8 &&
          Math.abs(z + 0.5 - playerPos.z) < 0.8) {
        return false
      }

      // 检查目标位置是否为空
      const existingBlock = this.world.getBlock(x, y, z)
      if (existingBlock !== BlockType.AIR && existingBlock !== undefined) {
        return false
      }

      this.world.setBlock(x, y, z, blockType)
      return true
    }

    return false
  }

  getBlockName(blockType: BlockType): string {
    return BLOCK_DEFINITIONS[blockType]?.name || 'Unknown'
  }
}

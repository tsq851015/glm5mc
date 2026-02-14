import * as THREE from 'three'
import { createNoise2D, createNoise3D } from 'simplex-noise'
import { Chunk } from './Chunk'
import { BlockType, CHUNK_SIZE, CHUNK_HEIGHT } from './BlockType'

// 深度层级配置
interface LayerConfig {
  minY: number
  maxY: number
  baseBlock: BlockType
  ores?: { type: BlockType; chance: number }[]
}


  private onDirty?: () => void

  constructor(scene: THREE.Scene, onDirty?: () => void) {
    this.scene = scene
    this.onDirty = onDirty
    this.noise2D = createNoise2D()
    this.noise3D = createNoise3D()
  }

export class World {
  private scene: THREE.Scene
  private chunks: Map<string, Chunk> = new Map()
  private noise2D: ReturnType<typeof createNoise2D>
  private noise3D: ReturnType<typeof createNoise3D>
  private modifiedBlocks: Map<string, BlockType> = new Map()

  // Noise parameters
  private readonly caveNoiseScale = 0.1
  private readonly caveThreshold = 0.6

  // 深度层级配置
  private readonly layers: LayerConfig[] = [
    { minY: 0, maxY: 2, baseBlock: BlockType.BEDROCK },
    {
      minY: 2, maxY: 8,
      baseBlock: BlockType.DEEP_STONE,
      ores: [
        { type: BlockType.GEM, chance: 0.005 },
        { type: BlockType.IRON_ORE, chance: 0.02 },
      ]
    },
    {
      minY: 8, maxY: 15,
      baseBlock: BlockType.DEEP_STONE,
      ores: [
        { type: BlockType.IRON_ORE, chance: 0.03 },
        { type: BlockType.COPPER_ORE, chance: 0.04 },
      ]
    },
    {
      minY: 15, maxY: 22,
      baseBlock: BlockType.STONE,
      ores: [
        { type: BlockType.IRON_ORE, chance: 0.02 },
        { type: BlockType.COPPER_ORE, chance: 0.05 },
      ]
    },
    { minY: 22, maxY: 28, baseBlock: BlockType.GRAVEL },
    { minY: 28, maxY: 32, baseBlock: BlockType.DIRT },
  ]

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.noise2D = createNoise2D()
    this.noise3D = createNoise3D()
  }

  private getChunkKey(chunkX: number, chunkZ: number): string {
    return `${chunkX},${chunkZ}`
  }

  generateInitialChunks(radius: number): void {
    for (let x = -radius; x <= radius; x++) {
      for (let z = -radius; z <= radius; z++) {
        this.generateChunk(x, z)
      }
    }
  }

  private generateChunk(chunkX: number, chunkZ: number): Chunk {
    const key = this.getChunkKey(chunkX, chunkZ)
    if (this.chunks.has(key)) {
      return this.chunks.get(key)!
    }

    const chunk = new Chunk(chunkX, chunkZ)

    // Generate terrain for this chunk
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const worldX = chunkX * CHUNK_SIZE + x
        const worldZ = chunkZ * CHUNK_SIZE + z

        // Fill blocks from bottom to top using layered terrain
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          // Check for caves using 3D noise
          const caveNoise = this.noise3D(
            worldX * this.caveNoiseScale,
            y * this.caveNoiseScale,
            worldZ * this.caveNoiseScale
          )

          // Apply cave generation (carve out caves) - don't carve bedrock
          if (caveNoise > this.caveThreshold && y > 2) {
            chunk.setBlock(x, y, z, BlockType.AIR)
            continue
          }

          // 根据层级确定方块
          let blockType = BlockType.AIR
          for (const layer of this.layers) {
            if (y >= layer.minY && y < layer.maxY) {
              blockType = layer.baseBlock

              // 矿石生成
              if (layer.ores) {
                const oreNoise = this.noise2D(worldX * 0.5 + y, worldZ * 0.5 + y)
                for (const ore of layer.ores) {
                  if (oreNoise > (1 - ore.chance * 10)) {
                    blockType = ore.type
                    break
                  }
                }
              }
              break
            }
          }

          chunk.setBlock(x, y, z, blockType)
        }
      }
    }

    // Generate mesh for the chunk
    chunk.generateMesh(this.scene)

    this.chunks.set(key, chunk)
    return chunk
  }

  getChunk(chunkX: number, chunkZ: number): Chunk | undefined {
    return this.chunks.get(this.getChunkKey(chunkX, chunkZ))
  }

  getBlock(worldX: number, worldY: number, worldZ: number): BlockType {
    if (worldY < 0 || worldY >= CHUNK_HEIGHT) {
      return BlockType.AIR
    }

    const chunkX = Math.floor(worldX / CHUNK_SIZE)
    const chunkZ = Math.floor(worldZ / CHUNK_SIZE)
    const localX = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
    const localZ = ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE

    const chunk = this.getChunk(chunkX, chunkZ)
    if (!chunk) {
      return BlockType.AIR
    }

    return chunk.getBlock(localX, worldY, localZ)
  }

  setBlock(worldX: number, worldY: number, worldZ: number, type: BlockType): void {
  if (worldY < 0 || worldY >= CHUNK_HEIGHT) {
    return
  }

  const chunkX = Math.floor(worldX / CHUNK_SIZE)
  const chunkZ = Math.floor(worldZ / CHUNK_SIZE)
  const localX = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
  const localZ = ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE

  const chunk = this.getChunk(chunkX, chunkZ)
  if (!chunk) {
    return
  }

  // Get original block before modification
  const originalBlock = chunk.getBlock(localX, worldY, localZ)

  // Track modification if different from original
  const key = `${worldX},${worldY},${worldZ}`
  if (type !== originalBlock) {
    this.modifiedBlocks.set(key, type)
    this.onDirty?.()
  } else {
    // Remove from tracking if restored to original
    this.modifiedBlocks.delete(key)
  }

  chunk.setBlock(localX, worldY, localZ, type)
  chunk.generateMesh(this.scene)

  // Update neighboring chunks if block is on edge
  if (localX === 0) this.regenerateChunk(chunkX - 1, chunkZ)
  if (localX === CHUNK_SIZE - 1) this.regenerateChunk(chunkX + 1, chunkZ)
  if (localZ === 0) this.regenerateChunk(chunkX, chunkZ - 1)
  if (localZ === CHUNK_SIZE - 1) this.regenerateChunk(chunkX, chunkZ + 1)
}

  private regenerateChunk(chunkX: number, chunkZ: number): void {
    const chunk = this.getChunk(chunkX, chunkZ)
    if (chunk) {
      chunk.generateMesh(this.scene)
    }
  }

  getModifiedBlocks(): Map<string, BlockType> {
    return this.modifiedBlocks
  }

  clearModifiedBlocks(): void {
    this.modifiedBlocks.clear()
  }

  dispose(): void {
    for (const chunk of this.chunks.values()) {
      chunk.dispose(this.scene)
    }
    this.chunks.clear()
  }
}

import * as THREE from 'three'
import { createNoise2D, createNoise3D } from 'simplex-noise'
import { Chunk } from './Chunk'
import { BlockType, CHUNK_SIZE, CHUNK_HEIGHT } from './BlockType'

export class World {
  private scene: THREE.Scene
  private chunks: Map<string, Chunk> = new Map()
  private noise2D: ReturnType<typeof createNoise2D>
  private noise3D: ReturnType<typeof createNoise3D>

  // Noise parameters
  private readonly heightNoiseScale = 0.05
  private readonly caveNoiseScale = 0.1
  private readonly caveThreshold = 0.7
  private readonly minTerrainHeight = 10
  private readonly maxTerrainHeight = 20

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

        // Get terrain height using 2D noise
        const heightNoise = this.noise2D(
          worldX * this.heightNoiseScale,
          worldZ * this.heightNoiseScale
        )
        // Normalize noise from [-1, 1] to [0, 1]
        const normalizedNoise = (heightNoise + 1) / 2
        const terrainHeight = Math.floor(
          this.minTerrainHeight + normalizedNoise * (this.maxTerrainHeight - this.minTerrainHeight)
        )

        // Fill blocks from bottom to terrain height
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          // Check for caves using 3D noise
          const caveNoise = this.noise3D(
            worldX * this.caveNoiseScale,
            y * this.caveNoiseScale,
            worldZ * this.caveNoiseScale
          )

          // Determine block type based on depth
          let blockType: BlockType

          if (y > terrainHeight) {
            // Above terrain - air
            blockType = BlockType.AIR
          } else if (y === terrainHeight) {
            // Surface layer - dirt
            blockType = BlockType.DIRT
          } else if (y < terrainHeight - 10) {
            // Deep stone layer
            blockType = BlockType.DEEP_STONE
          } else if (y < terrainHeight - 5) {
            // Stone layer with potential ores
            blockType = this.generateOre(worldX, y, worldZ)
          } else {
            // Regular stone layer
            blockType = BlockType.STONE
          }

          // Apply cave generation (carve out caves)
          if (caveNoise > this.caveThreshold && y < terrainHeight && y > 0) {
            blockType = BlockType.AIR
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

  private generateOre(x: number, y: number, z: number): BlockType {
    // Use position-based random seed for consistent ore generation
    const seed = x * 73856093 + y * 19349663 + z * 83492791
    const random = (Math.sin(seed) * 43758.5453) % 1

    // Ore distribution probabilities
    if (random < 0.02) {
      return BlockType.COPPER_ORE
    } else if (random < 0.035) {
      return BlockType.IRON_ORE
    }
    return BlockType.STONE
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

  dispose(): void {
    for (const chunk of this.chunks.values()) {
      chunk.dispose(this.scene)
    }
    this.chunks.clear()
  }
}

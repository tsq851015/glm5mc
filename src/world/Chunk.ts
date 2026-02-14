import * as THREE from 'three'
import { BlockType, BLOCK_DEFINITIONS, CHUNK_SIZE, CHUNK_HEIGHT } from './BlockType'

export class Chunk {
  private blocks: Uint8Array
  private mesh: THREE.Mesh | null = null
  private chunkX: number
  private chunkZ: number

  constructor(chunkX: number, chunkZ: number) {
    this.chunkX = chunkX
    this.chunkZ = chunkZ
    this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE)
    // Initialize with air
    this.blocks.fill(BlockType.AIR)
  }

  private getBlockIndex(x: number, y: number, z: number): number {
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

  getChunkX(): number {
    return this.chunkX
  }

  getChunkZ(): number {
    return this.chunkZ
  }

  getMesh(): THREE.Mesh | null {
    return this.mesh
  }

  generateMesh(scene: THREE.Scene): void {
    // Remove old mesh if exists
    if (this.mesh) {
      scene.remove(this.mesh)
      this.mesh.geometry.dispose()
      if (this.mesh.material instanceof THREE.Material) {
        this.mesh.material.dispose()
      }
    }

    const positions: number[] = []
    const normals: number[] = []
    const colors: number[] = []

    // Face definitions: [dx, dy, dz] for each face's normal direction
    const faceNormals = [
      [1, 0, 0],   // Right (+X)
      [-1, 0, 0],  // Left (-X)
      [0, 1, 0],   // Top (+Y)
      [0, -1, 0],  // Bottom (-Y)
      [0, 0, 1],   // Front (+Z)
      [0, 0, -1],  // Back (-Z)
    ]

    // For each face, define the 4 vertices (relative to block position)
    const faceVertices = [
      // Right face (+X)
      [
        [1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]
      ],
      // Left face (-X)
      [
        [0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]
      ],
      // Top face (+Y)
      [
        [0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]
      ],
      // Bottom face (-Y)
      [
        [0, 0, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1]
      ],
      // Front face (+Z)
      [
        [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]
      ],
      // Back face (-Z)
      [
        [1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]
      ],
    ]

    // Iterate through all blocks
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const blockType = this.getBlock(x, y, z)
          if (blockType === BlockType.AIR) continue

          const blockDef = BLOCK_DEFINITIONS[blockType]
          const color = new THREE.Color(blockDef.color)

          // Check each face
          for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
            const [nx, ny, nz] = faceNormals[faceIndex]
            const neighborX = x + nx
            const neighborY = y + ny
            const neighborZ = z + nz

            // Check if neighbor is air (face should be rendered)
            const neighbor = this.getBlock(neighborX, neighborY, neighborZ)
            if (neighbor !== BlockType.AIR) continue

            // Calculate ambient occlusion
            const ao = this.calculateAmbientOcclusion(x, y, z, nx, ny, nz)

            // Apply AO to color (darken slightly)
            const faceColor = color.clone()
            faceColor.multiplyScalar(ao)

            // Get vertices for this face
            const verts = faceVertices[faceIndex]

            // World position offset for this chunk
            const worldOffsetX = this.chunkX * CHUNK_SIZE
            const worldOffsetZ = this.chunkZ * CHUNK_SIZE

            // Add two triangles (6 vertices) for this face
            // Triangle 1: verts[0], verts[1], verts[2]
            // Triangle 2: verts[0], verts[2], verts[3]
            const indices = [0, 1, 2, 0, 2, 3]

            for (const i of indices) {
              const v = verts[i]
              positions.push(
                v[0] + x + worldOffsetX,
                v[1] + y,
                v[2] + z + worldOffsetZ
              )
              normals.push(nx, ny, nz)
              colors.push(faceColor.r, faceColor.g, faceColor.b)
            }
          }
        }
      }
    }

    // Create geometry
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    // Create material
    const material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
    })

    // Create mesh
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true

    scene.add(this.mesh)
  }

  private calculateAmbientOcclusion(x: number, y: number, z: number, nx: number, ny: number, nz: number): number {
    // Simple ambient occlusion based on neighboring blocks
    let occlusion = 1.0
    let neighborCount = 0

    // Check side neighbors perpendicular to face normal
    if (nx !== 0) {
      // X face - check Y and Z neighbors
      if (this.getBlock(x + nx, y + 1, z) !== BlockType.AIR) neighborCount++
      if (this.getBlock(x + nx, y - 1, z) !== BlockType.AIR) neighborCount++
      if (this.getBlock(x + nx, y, z + 1) !== BlockType.AIR) neighborCount++
      if (this.getBlock(x + nx, y, z - 1) !== BlockType.AIR) neighborCount++
    } else if (ny !== 0) {
      // Y face - check X and Z neighbors
      if (this.getBlock(x + 1, y + ny, z) !== BlockType.AIR) neighborCount++
      if (this.getBlock(x - 1, y + ny, z) !== BlockType.AIR) neighborCount++
      if (this.getBlock(x, y + ny, z + 1) !== BlockType.AIR) neighborCount++
      if (this.getBlock(x, y + ny, z - 1) !== BlockType.AIR) neighborCount++
    } else if (nz !== 0) {
      // Z face - check X and Y neighbors
      if (this.getBlock(x + 1, y, z + nz) !== BlockType.AIR) neighborCount++
      if (this.getBlock(x - 1, y, z + nz) !== BlockType.AIR) neighborCount++
      if (this.getBlock(x, y + 1, z + nz) !== BlockType.AIR) neighborCount++
      if (this.getBlock(x, y - 1, z + nz) !== BlockType.AIR) neighborCount++
    }

    // Apply occlusion based on neighbor count
    occlusion = 1.0 - (neighborCount * 0.1)
    return Math.max(0.6, occlusion)
  }

  dispose(scene: THREE.Scene): void {
    if (this.mesh) {
      scene.remove(this.mesh)
      this.mesh.geometry.dispose()
      if (this.mesh.material instanceof THREE.Material) {
        this.mesh.material.dispose()
      }
      this.mesh = null
    }
  }
}

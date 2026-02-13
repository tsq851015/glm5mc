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

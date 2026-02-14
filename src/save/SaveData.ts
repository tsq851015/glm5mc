import { BlockType } from '../world/BlockType'
import { EnemySaveData } from '../enemies/Enemy'

export interface SaveData {
  version: string
  timestamp: number
  player: PlayerSaveData
  modifiedBlocks: ModifiedBlock[]
  enemies?: EnemySaveData[]
}

export interface PlayerSaveData {
  position: {
    x: number
    y: number
    z: number
  }
  health: number
  inventory: BlockType[]
}

export interface ModifiedBlock {
  key: string  // "x,y,z" format
  type: BlockType
}

export const SAVE_VERSION = '1.0'

export enum EntityType {
  SLIME = 'slime',
  BAT = 'bat',
  SKELETON = 'skeleton'
}

export interface EntityStats {
  maxHealth: number
  damage: number
  moveSpeed: number
  attackRange: number
}

export const ENTITY_STATS: Record<EntityType, EntityStats> = {
  [EntityType.SLIME]: {
    maxHealth: 15,
    damage: 3,
    moveSpeed: 2.5,
    attackRange: 1.5
  },
  [EntityType.BAT]: {
    maxHealth: 25,
    damage: 6,
    moveSpeed: 4.0,
    attackRange: 2.0
  },
  [EntityType.SKELETON]: {
    maxHealth: 40,
    damage: 10,
    moveSpeed: 1.8,
    attackRange: 2.5
  }
}

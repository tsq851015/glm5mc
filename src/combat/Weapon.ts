export enum WeaponType {
  PICKAXE = 'pickaxe',
  SWORD = 'sword',
  BOW = 'bow'
}

export interface WeaponStats {
  damage: number
  range: number
  cooldown: number // 秒
}

export const WEAPON_STATS: Record<WeaponType, WeaponStats> = {
  [WeaponType.PICKAXE]: { damage: 5, range: 3, cooldown: 0.5 },
  [WeaponType.SWORD]: { damage: 15, range: 4, cooldown: 0.3 },
  [WeaponType.BOW]: { damage: 20, range: 20, cooldown: 1.0 }
}

export class Weapon {
  private type: WeaponType
  private stats: WeaponStats
  private lastAttackTime: number = 0

  constructor(type: WeaponType) {
    this.type = type
    this.stats = WEAPON_STATS[type]
  }

  canAttack(currentTime: number): boolean {
    return currentTime - this.lastAttackTime >= this.stats.cooldown
  }

  attack(currentTime: number): number {
    this.lastAttackTime = currentTime
    return this.stats.damage
  }

  getStats(): WeaponStats {
    return this.stats
  }

  getType(): WeaponType {
    return this.type
  }
}

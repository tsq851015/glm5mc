import './style.css'
import { Game } from './core/Game'
import { World } from './world/World'
import { PlayerController } from './player/PlayerController'
import { HUD } from './ui/HUD'
import { EnemySpawner } from './enemies/EnemySpawner'
import { Enemy } from './enemies/Enemy'
import { SaveData, PlayerSaveData, ModifiedBlock } from './save/SaveData'

// Global world reference for debugging
declare global {
  interface Window {
    world: World
  }
}

class UndergroundGame extends Game {
  private playerController!: PlayerController
  private hud!: HUD
  private world!: World
  private enemySpawner!: EnemySpawner

  protected override update(deltaTime: number): void {
    // 更新昼夜循环
    this.getDayNightCycle().update(deltaTime)

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

        // 更新快捷栏显示
        this.hud.setHotbarItems(this.playerController.getInventory().getHotbar())
        this.hud.setActiveSlot(this.playerController.getInventory().getSelectedSlot())

        // 更新生命值显示
        this.hud.updateHealthBar(
          this.playerController.getHealth(),
          this.playerController.getMaxHealth()
        )

        // 更新时间显示
        const dayNightCycle = this.getDayNightCycle()
        this.hud.updateTime(dayNightCycle.getTimeString(), dayNightCycle.isNightTime())
      }
    }

    // 更新敌人生成和 AI
    if (this.enemySpawner) {
      this.enemySpawner.update(performance.now(), this.playerController.getPosition())

      // 更新所有敌人
      this.enemySpawner.updateEnemies(deltaTime, this.playerController.getPosition(), (damage) => {
        this.playerController.takeDamage(damage)
      })
    }
  }

  setPlayerController(controller: PlayerController): void {
    this.playerController = controller
  }

  setHUD(hud: HUD): void {
    this.hud = hud
  }

  setWorld(world: World): void {
    this.world = world
  }

  setEnemySpawner(spawner: EnemySpawner): void {
    this.enemySpawner = spawner
  }

  async saveGame(slot: number = 0): Promise<boolean> {
    const playerPos = this.getCamera().position

    // 收集保存数据
    const playerData: PlayerSaveData = {
      position: {
        x: playerPos.x,
        y: playerPos.y,
        z: playerPos.z
      },
      health: this.playerController.getHealth(),
      inventory: this.playerController.getInventory().getHotbar()
        .filter((item) => item !== null && item.blockType !== undefined)
        .map((item) => item.blockType as BlockType)
    }

    // 转换修改方块的 Map 为数组
    const modifiedBlocks: ModifiedBlock[] = []
    for (const [key, type] of this.world.getModifiedBlocks()) {
      modifiedBlocks.push({ key, type })
    }

    // 收集敌人数据
    const enemies = this.enemySpawner.getEnemies().map((e) => e.toSaveData())

    const saveData: SaveData = {
      version: '1.0',
      timestamp: Date.now(),
      player: playerData,
      modifiedBlocks: modifiedBlocks,
      enemies: enemies
    }

    const success = await this.getAutoSave().save(slot, saveData)
    if (success) {
      console.log(`Game saved to slot ${slot}`)
    } else {
      console.error('Failed to save game')
    }

    return success
  }

  async loadGame(slot: number = 0): Promise<boolean> {
    const saveData = await this.getAutoSave().load(slot)

    if (!saveData) {
      console.log(`No save found in slot ${slot}`)
      return false
    }

    // 验证版本
    if (saveData.version !== '1.0') {
      console.error(`Incompatible save version: ${saveData.version}`)
      return false
    }

    // 恢复玩家位置
    this.getCamera().position.set(
      saveData.player.position.x,
      saveData.player.position.y,
      saveData.player.position.z
    )

    // 恢复玩家生命值
    this.playerController.takeDamage(100 - saveData.player.health)

    // 恢复方块修改
    for (const modifiedBlock of saveData.modifiedBlocks) {
      const [x, y, z] = modifiedBlock.key.split(',').map(Number)
      this.world.setBlock(x, y, z, modifiedBlock.type)
    }

    // 恢复敌人状态
    if (saveData.enemies) {
      for (const enemyData of saveData.enemies) {
        if (!enemyData.isDead) {
          const enemy = Enemy.fromSaveData(enemyData, this.getScene())
          this.enemySpawner.getEnemies().push(enemy)
        }
      }
    }

    console.log(`Game loaded from slot ${slot}`)
    return true
  }

  getAutoSave() {
    return this.autoSave
  }
}

const game = new UndergroundGame()
game.start()

// 生成世界 (先创建世界，用于碰撞检测)
const world = new World(game.getScene())
world.generateInitialChunks(4) // 扩大到4个半径的区块 (9x9=81个区块)

// 设置 World 到游戏
game.setWorld(world)

// Expose world for debugging
window.world = world

// 设置玩家初始位置 (在地面上方)
const camera = game.getCamera()
camera.position.set(32, 50, 32) // 出生在地面，y=50在地表层上方

// 创建敌人生成器
const enemySpawner = new EnemySpawner(
  game.getScene(),
  (x, y, z) => world.getBlock(x, y, z)
)
enemySpawner.setIsNightTimeCallback(() => game.getDayNightCycle().isNightTime())
game.setEnemySpawner(enemySpawner)

// 创建 HUD
const hud = new HUD()
game.setHUD(hud)

// 创建玩家控制器 (传入 world 和 scene 用于碰撞检测和方块交互)
const playerController = new PlayerController(
  camera,
  world,
  game.getScene(),
  () => game.markDirty(), // onDirty
  () => enemySpawner.getEnemies() // getEnemies
)
game.setPlayerController(playerController)

console.log('Underground Explorer started!')
console.log('WASD 移动 | 空格 跳跃 | Shift 快速下降')
console.log('1-6 切换物品 | 左键 攻击/挖掘 | 右键 放置')
console.log('F5 手动保存')
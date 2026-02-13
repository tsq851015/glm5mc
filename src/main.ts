import './style.css'
import { Game } from './core/Game'
import { World } from './world/World'
import { PlayerController } from './player/PlayerController'
import { HUD } from './ui/HUD'

// Global world reference for debugging
declare global {
  interface Window {
    world: World
  }
}

class UndergroundGame extends Game {
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

  setPlayerController(controller: PlayerController): void {
    this.playerController = controller
  }

  setHUD(hud: HUD): void {
    this.hud = hud
  }
}

const game = new UndergroundGame()
game.start()

// 设置玩家初始位置
const camera = game.getCamera()
camera.position.set(8, 25, 8)

// 创建 HUD
const hud = new HUD()
game.setHUD(hud)

// 创建玩家控制器
const playerController = new PlayerController(camera)
game.setPlayerController(playerController)

// 生成世界
const world = new World(game.getScene())
world.generateInitialChunks(1)

// Expose world for debugging
window.world = world

console.log('Underground Explorer started!')
console.log('Click to enable mouse control, WASD to move')

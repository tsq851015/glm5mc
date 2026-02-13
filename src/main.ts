import './style.css'
import { Game } from './core/Game'
import { World } from './world/World'

// Global world reference for debugging
declare global {
  interface Window {
    world: World
  }
}

class UndergroundGame extends Game {
  protected override update(_deltaTime: number): void {
    // 游戏更新逻辑
  }
}

const game = new UndergroundGame()
game.start()

// 生成世界
const world = new World(game.getScene())
world.generateInitialChunks(1)

// Expose world for debugging
window.world = world

console.log('Underground Explorer started with world!')

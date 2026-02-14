# Underground Explorer 开发进度

## 项目概述
- **项目路径**: J:/testglm5
- **GitHub**: https://github.com/tsq851015/glm5mc
- **技术栈**: TypeScript + Vite + Three.js + simplex-noise

## 已完成功能

### Phase 1 - MVP ✅
- [x] 项目初始化 (Vite + TypeScript + Three.js)
- [x] 游戏核心循环 (Game, Time 类)
- [x] 程序化地形生成 (Chunk, World 类)
- [x] 第一人称控制器 (WASD + 鼠标视角)
- [x] 重力和跳跃系统
- [x] 水平碰撞检测
- [x] 基础 HUD (准心、生命条、快捷栏)

### Phase 2 ✅
- [x] 背包系统 (Inventory 类)
- [x] 方块挖掘/放置 (BlockInteraction 类)
- [x] 武器系统 (Weapon, CombatSystem 类)
- [x] 多层地形 (基岩、砂砾、宝石)

## 当前方块类型
- AIR (0) - 空气
- DIRT (1) - 泥土
- STONE (2) - 石头
- DEEP_STONE (3) - 深岩
- COPPER_ORE (4) - 铜矿
- IRON_ORE (5) - 铁矿
- GEM (6) - 宝石
- BEDROCK (7) - 基岩 (不可破坏)
- GRAVEL (8) - 砂砾

## 地形层级
- Y 0-2: 基岩层
- Y 2-8: 深岩层 (宝石、铁矿)
- Y 8-15: 深岩层 (铁矿、铜矿)
- Y 15-22: 石头层 (铁矿、铜矿)
- Y 22-28: 砂砾层
- Y 28-32: 泥土层

## 控制方式
- WASD: 移动
- 空格: 跳跃
- Shift: 快速下降
- 鼠标: 视角控制
- 1-6: 切换快捷栏
- 左键: 攻击/挖掘
- 右键: 放置方块
- ESC: 退出鼠标锁定

## 待开发功能

### Phase 3 - 队友系统
- [ ] NPC 招募机制
- [ ] 指挥系统
- [ ] 队友 AI 跟随
- [ ] 队友装备

### Phase 4 - 内容丰富
- [ ] 敌人系统 (史莱姆、蝙蝠、骷髅等)
- [ ] Boss 战斗
- [ ] 存档系统 (IndexedDB)
- [ ] 隐藏区域

### Phase 5 - 打磨
- [ ] 音效和音乐
- [ ] 粒子特效
- [ ] 平衡调整
- [ ] 性能优化

## 文件结构
```
src/
├── core/
│   ├── Game.ts
│   └── Time.ts
├── world/
│   ├── BlockType.ts
│   ├── Chunk.ts
│   └── World.ts
├── player/
│   ├── PlayerController.ts
│   ├── Inventory.ts
│   └── BlockInteraction.ts
├── combat/
│   ├── Weapon.ts
│   └── CombatSystem.ts
├── ui/
│   └── HUD.ts
├── main.ts
└── style.css
```

## 设计文档
- docs/plans/2026-02-13-underground-explorer-design.md
- docs/plans/2026-02-13-mvp-implementation.md
- docs/plans/2026-02-13-phase2-implementation.md

## 下次启动命令
```bash
cd J:/testglm5
npm run dev
```

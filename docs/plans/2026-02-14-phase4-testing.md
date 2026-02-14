# Phase 4 Testing Checklist

## Manual Testing Tasks

### Enemy System
- [ ] Slime spawns at Y < 25
- [ ] Bat spawns in empty areas at Y > 10
- [ ] Skeleton spawns at Y < 15
- [ ] Enemies move toward player
- [ ] Enemies damage player on contact
- [ ] Enemies can be killed
- [ ] Death animation plays correctly

### Save System
- [ ] Auto-save triggers every 30 seconds
- [ ] Manual save (F5) works
- [ ] Load restores player position
- [ ] Load restores modified blocks
- [ ] Save slots 0-3 work correctly

### Combat
- [ ] Player can attack enemies
- [ ] Damage numbers appear
- [ ] Health bar updates correctly
- [ ] Player death stops game

### Performance
- [ ] Game runs at 60 FPS with 20 enemies
- [ ] Save/load completes in < 1 second
- [ ] No memory leaks after 10 minutes of play

## Known Issues
- Document any bugs found during testing

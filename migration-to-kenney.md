# Migrate from Zombie Style to Kenney Platformer Art Deluxe

## Context

The game is currently a zombie-themed Phaser 3 platformer with dark, gory assets (zombie enemies, blood effects, procedurally drawn colored-rectangle levels). The goal is to replace ALL visual assets with the bright, friendly Kenney Platformer Art Deluxe pack -- transforming the game's look from dark/zombie to colorful/cute while keeping all gameplay mechanics intact.

---

## Key Design Decisions

### Tile Size: Keep 32px (scale Kenney 70px tiles down)

Changing to 70px would require recalculating every level dimension, all physics constants, spawn points, patrol ranges, detection ranges, body sizes, camera settings, and HUD positioning. Instead, we'll load Kenney tiles at native resolution and use `setDisplaySize(32, 32)` to fit the current tile grid. This preserves all existing level layouts and physics tuning.

### Enemy Selection (one per level for variety)
- **Level 1** ("Green Meadows"): `slime` -- classic starter enemy (has walk, hit, dead, squashed)
- **Level 2** ("Stone Fortress"): `spider` -- creepier mid-game enemy (has walk1, walk2, hit, dead)
- **Level 3** ("Desert Crossing"): `mouse` -- faster late-game enemy (has walk, hit, dead)

### Player Character: `p1` (the green alien)
- States available: stand, duck, jump, hurt, walk (11 frames)
- Missing vs current: no pistol variants, no wall slide, no roll, no multi-frame death
- Solution: reuse available frames + tweens for missing states

### Blood Effects Replacement
- Hit effect: burst of `star.png` particles (tinted yellow/white)
- Death effect: burst of `particleBrick*` particles + stars ("poof" effect)

---

## Step-by-Step Implementation Plan

### Phase 1: Copy Assets to public/assets/kenney/

Create this directory structure by copying from `kenney_platformer-art-deluxe/`:

```
public/assets/kenney/
  player/         <- Base pack/Player/ (p1_stand, p1_duck, p1_jump, p1_hurt, p1_front.png)
  player/walk/    <- Base pack/Player/p1_walk/PNG/ (p1_walk01..p1_walk11.png)
  enemies/        <- Extra animations and enemies/Enemy sprites/ (slime*, spider*, mouse*.png)
  tiles/          <- Base pack/Tiles/ (grass*, dirt*, stone*, sand*, box*, door*, fence*, sign*, etc.)
  items/          <- Base pack/Items/ (star, fireball, flagGreen*, coinGold, particleBrick*, cloud*, bush, plant, cactus, rock, spikes.png)
  hud/            <- Base pack/HUD/ (hud_heartFull, hud_heartHalf, hud_heartEmpty, hud_p1.png)
  backgrounds/    <- Mushroom expansion/Backgrounds/ (bg_grasslands, bg_castle, bg_desert.png)
```

### Phase 2: Rewrite BootScene.js (asset loading)

**File:** `src/scenes/BootScene.js`

Remove all character/zombie/blood loading. Replace with:

```
Player:    p1_stand, p1_duck, p1_jump, p1_hurt, p1_front, p1_walk_01..p1_walk_11
Enemies:   slime, slime_walk, slime_hit, slime_dead, slime_squashed
           spider, spider_walk1, spider_walk2, spider_hit, spider_dead
           mouse, mouse_walk, mouse_hit, mouse_dead
Tiles:     grassMid, grassCenter, grassLeft, grassRight, grassHalfLeft, grassHalfMid, grassHalfRight,
           dirtCenter, stoneMid, stoneCenter, stoneLeft, stoneRight, stoneHalfLeft, stoneHalfMid, stoneHalfRight,
           sandMid, sandCenter, sandLeft, sandRight, sandHalfLeft, sandHalfMid, sandHalfRight,
           brickWall, stoneWall, box, fence, sign, signExit
Items:     star, fireball, flagGreen, flagGreen2, coinGold,
           particleBrick1a, particleBrick1b, particleBrick2a, particleBrick2b,
           cloud1, cloud2, cloud3, bush, plant, cactus, rock
HUD:       hud_heartFull, hud_heartHalf, hud_heartEmpty, hud_p1
Backgrounds: bg_grasslands, bg_castle, bg_desert
```

Keep the `pixel` texture generation in `create()`.

### Phase 3: Rewrite Player.js

**File:** `src/gameObjects/Player.js`

- **Constructor:** Change initial texture from `'characterIdle_0'` to `'p1_stand'`
- **Scale:** Adjust from 1.5 to ~0.7 (Kenney p1 is ~66x92px; at 0.7 scale = ~46x64, fitting a 32px tile grid)
- **Body size/offset:** Recalculate for new sprite dimensions (~20x50 body, offset ~3x10)
- **Crouch body:** Adjust for p1_duck dimensions

**Animation remapping:**
| Current Key | New Frames | Notes |
|---|---|---|
| `player_idle` | `[p1_stand]` | Single frame, repeat: 0 |
| `player_run` | `[p1_walk_01..p1_walk_11]` | 11 frames, frameRate: 14, repeat: -1 |
| `player_jump` | `[p1_jump]` | Single frame |
| `player_fall` | `[p1_jump]` | Reuse jump frame |
| `player_dead` | `[p1_hurt]` | Single frame + death tween (fade out, float up) |
| `player_hit` | `[p1_hurt]` | Single frame + red tint |
| `player_crouch` | `[p1_duck]` | Single frame |
| `player_roll` | `[p1_duck]` | Single frame + rotation tween (360 deg spin) |
| `player_wall_slide` | `[p1_jump]` | Single frame, context-readable |

**Remove all `player_pistol_*` animations entirely.** Update:
- `updateAnimation()`: Remove all `hasGun` / pistol branches. Always use base animations.
- `shoot()`: Remove `overrideAnim` parameter; shooting no longer changes the animation.
- `startRoll()`: Replace `animationcomplete` listener with rotation tween + timer.
- `die()`: Replace `animationcomplete-player_dead` with a tween (alpha: 0, y: -50, duration: 800).
- Crouch+shoot: just play `player_crouch`, no separate pistol crouch anim.

### Phase 4: Rename Zombie.js -> Enemy.js

**File:** `src/gameObjects/Zombie.js` -> `src/gameObjects/Enemy.js`

- **Constructor:** Accept `enemyType` parameter ('slime', 'spider', 'mouse')
- **Initial texture:** `enemyType` key (e.g., `'slime'`)
- **Scale:** ~1.0 (enemies are ~50-70px, reasonable at native size for 32px tiles)
- **Body size/offset:** Adjust per enemy type (store in a config map)

**Animation remapping (dynamic per enemyType):**
| Current Key | New Pattern | Notes |
|---|---|---|
| `zombie_idle` | `[{enemyType}]` | Single base frame |
| `zombie_walk` | `[{enemyType}_walk]` or `[{enemyType}_walk1, {enemyType}_walk2]` | 1-2 frames looping |
| `zombie_attack` | `[{enemyType}_walk]` + tint flash | No attack art; use timer-based damage instead of `animationcomplete` |
| `zombie_hit` | `[{enemyType}_hit]` | Single frame + red tint |
| `zombie_dead` | `[{enemyType}_dead]` | Single frame + shrink/fade tween |

**Key behavior changes:**
- `stateAttack()`: Replace `animationcomplete-zombie_attack` with `scene.time.delayedCall(500, ...)` for damage timing
- `takeDamage()`: Replace `animationcomplete-zombie_hit` with `scene.time.delayedCall(400, ...)`
- `die()`: Replace `animationcomplete-zombie_dead` with a shrink+fade tween, then destroy
- Rename event `'zombie-killed'` -> `'enemy-killed'`

### Phase 5: Rewrite BloodEffect.js -> HitEffect.js

**File:** `src/gameObjects/BloodEffect.js` -> `src/gameObjects/HitEffect.js`

Replace animation-based blood sprites with particle bursts:

- `playHit(x, y)`: Emit 4-5 `star` particles (tinted yellow/white, small scale, fast fade)
- `playDefeat(x, y)`: Emit 5-6 `particleBrick*` particles + 3 `star` particles flying outward and fading

### Phase 6: Update Bullet.js

**File:** `src/gameObjects/Bullet.js`

- Change texture from `'pixel'` to `'fireball'`
- Change `setDisplaySize(8, 4)` to `setDisplaySize(20, 20)` (round fireball)
- Remove `setTint(0xffff00)` (fireball is already colored)

### Phase 7: Update levels.js (themes)

**File:** `src/data/levels.js`

Replace color-based themes with tile-based themes:

```js
// Level 1
theme: {
  tilePrefix: 'grass',
  fillPrefix: 'dirt',
  background: 'bg_grasslands',
  enemyType: 'slime',
  decoration: ['bush', 'plant', 'rock'],
  flag: 'flagGreen',
  dust: 0xd9c39a,
}

// Level 2
theme: {
  tilePrefix: 'stone',
  fillPrefix: 'stone',
  background: 'bg_castle',
  enemyType: 'spider',
  decoration: ['rock', 'fence'],
  flag: 'flagGreen',
  dust: 0xcfb58d,
}

// Level 3
theme: {
  tilePrefix: 'sand',
  fillPrefix: 'sand',
  background: 'bg_desert',
  enemyType: 'mouse',
  decoration: ['cactus', 'rock'],
  flag: 'flagGreen',
  dust: 0xd6b08a,
}
```

Rename levels: "Graveyard Approach" -> "Green Meadows", "Crypt Overpass" -> "Stone Fortress", "Citadel Gate" -> "Desert Crossing"

### Phase 8: Rewrite GameScene.js (level rendering + references)

**File:** `src/scenes/GameScene.js`

#### `createBackground()` - Complete rewrite
- Replace procedural gradient/moon/hills/mountains/fog with:
  1. Kenney background image (bg_grasslands/bg_castle/bg_desert), scaled to cover viewport, scrollFactor 0.1
  2. Cloud sprites (cloud1, cloud2, cloud3) scattered randomly with scrollFactor 0.15-0.25
  3. Decorative items (bush, plant, rock, cactus) placed along ground line at scrollFactor 1.0

#### `buildLevel()` - Major rewrite
Replace graphics-drawn colored rectangles with Kenney tile images:
- **Ground:** Top row uses `{tilePrefix}Mid` (left edge: `{tilePrefix}Left`, right edge: `{tilePrefix}Right`). Bottom row uses `{fillPrefix}Center`.
- **Platforms:** Use `{tilePrefix}HalfLeft`, `{tilePrefix}HalfMid`, `{tilePrefix}HalfRight`
- **Walls:** Use `brickWall` or `stoneWall` tiles
- Each tile: create as platform sprite with `setDisplaySize(TILE_SIZE, TILE_SIZE)`, no separate invisible collision body needed

#### `createGoal()` - Update
- Replace graphics-drawn flag with `flagGreen` sprite image

#### Other renames:
- `this.bloodEffect` -> `this.hitEffect`
- `new BloodEffect` -> `new HitEffect`
- `spawnZombies()` -> `spawnEnemies()` (pass `level.theme.enemyType`)
- `bulletHitZombie()` -> `bulletHitEnemy()`
- `new Zombie(...)` -> `new Enemy(this, x, y, patrolL, patrolR, theme.enemyType)`
- Event `'zombie-killed'` -> `'enemy-killed'`
- `handleZombieKilled()` -> `handleEnemyKilled()`
- `playZombieDeathSfx` -> `playEnemyDeathSfx`
- `checkBulletHits()`: Update hitbox shrink values for new enemy sprite dimensions
- Import `Enemy` instead of `Zombie`, import `HitEffect` instead of `BloodEffect`

### Phase 9: Update UIScene.js (HUD)

**File:** `src/scenes/UIScene.js`

- Replace graphics-drawn hearts with `hud_heartFull` / `hud_heartEmpty` image sprites
- Remove `drawHeart()` method entirely
- Change "Kills" label to "Defeats"
- Optionally add `hud_p1` portrait next to hearts

### Phase 10: Update MainMenuScene.js

**File:** `src/scenes/MainMenuScene.js`

- Change title from "ZOMBIE PLATFORMER" to "KENNEY PLATFORMER" (or similar)
- Replace `createBackground()`: use `bg_grasslands` image + add ground row of `grassMid` tiles at bottom instead of dark gradients/moon/skyline
- Use brighter, friendlier colors for text

### Phase 11: Update remaining scenes

**Files:** `GameOverScene.js`, `VictoryScene.js`, `LevelTransitionScene.js`

- Update background colors from dark zombie themes to brighter colors
- Change "Total Kills" -> "Total Defeats"
- Change `'#12070c'` / `'#07130d'` to friendlier background colors

### Phase 12: Update audioManager.js

**File:** `src/systems/audioManager.js`

- Rename `playZombieDeathSfx` -> `playEnemyDeathSfx`
- Optionally adjust tone frequencies to be higher-pitched/cheerful (low priority)

### Phase 13: Update runState.js

**File:** `src/state/runState.js`

- Rename `addKill` -> `addDefeat`, `totalKills` -> `totalDefeats` (or keep internal names and only change UI labels)

### Phase 14: Cleanup

- Remove old asset folders: `public/assets/character/`, `public/assets/zombie/`, `public/assets/blood/`
- Remove any unused imports or references

---

## Files to Modify (in order)

1. **New directory:** `public/assets/kenney/` (copy assets)
2. `src/scenes/BootScene.js` - Rewrite preload
3. `src/gameObjects/Player.js` - New textures, animations, remove pistol variants
4. `src/gameObjects/Zombie.js` -> `src/gameObjects/Enemy.js` - Rename + enemyType support
5. `src/gameObjects/BloodEffect.js` -> `src/gameObjects/HitEffect.js` - Particle-based effects
6. `src/gameObjects/Bullet.js` - Fireball texture
7. `src/data/levels.js` - Tile-based themes
8. `src/scenes/GameScene.js` - Tile rendering, renames, background
9. `src/scenes/UIScene.js` - HUD hearts with images
10. `src/scenes/MainMenuScene.js` - New title + background
11. `src/scenes/GameOverScene.js` - Color/text updates
12. `src/scenes/VictoryScene.js` - Color/text updates
13. `src/scenes/LevelTransitionScene.js` - Color/text updates
14. `src/systems/audioManager.js` - Rename function
15. `src/config/gameConfig.js` - Rename ZOMBIE -> ENEMY (optional)

---

## Verification

1. `npm run dev` and visually confirm:
   - Kenney tiles render correctly for ground, platforms, walls across all 3 levels
   - Background images display with parallax clouds
   - Player character (p1) shows correct animations for: idle, walk, jump, fall, crouch, roll, wall slide, hit, death
   - Enemies (slime/spider/mouse) patrol, chase, attack, take hits, and die with correct visuals
   - Fireball bullets render properly
   - Star/brick particle effects replace blood effects
   - HUD shows Kenney heart images
   - Main menu shows updated title and background
2. Play through all 3 levels to verify:
   - Physics feel correct (no tile size mismatches)
   - Collision hitboxes are reasonable
   - Enemy AI still works (patrol bounds, ledge detection, chase, attack)
   - Goal flag renders and level completion triggers
   - Game over and victory screens show correct text
3. Check browser console for missing asset warnings

# 2D Platformer — Game Specification

## Overview

A side-scrolling 2D platformer built with **Phaser 3** featuring a gun-wielding protagonist fighting through zombie-infested levels. The player navigates platforms, avoids hazards, and uses a pistol to eliminate zombies across progressively harder stages.

All character and enemy sprites are 64x64 pixel art from the RgsDev asset pack.

---

## Milestone 1 — Core Movement & World

**Goal:** A playable character running and jumping through a tiled level with working physics.

### Deliverables

- **Project scaffolding** — Phaser 3 project with Vite, a Boot scene, and a Game scene.
- **Spritesheet generation** — Pack the individual PNG frames into atlases (or load as frame sequences) for the main character.
- **Player controller**
  - Idle, Run, Jump, Fall animations with transitions.
  - Arcade physics: gravity, ground collision, platform landing.
  - Horizontal movement (A/D or arrow keys), jump (Space).
  - Double-jump or variable-height jump for game feel.
- **Tilemap level** — A hand-crafted (or procedurally generated) tilemap with:
  - Ground, platforms, and walls using simple colored rectangles or placeholder tiles.
  - A start position and an end-of-level goal marker.
- **Camera** — Smoothly follows the player, clamped to level bounds.
- **Basic HUD** — Lives or health indicator on screen.

### Acceptance Criteria

- [ ] `npm run dev` launches the game in a browser.
- [ ] Player can run left/right, jump, and land on platforms.
- [ ] Animations play correctly for idle, run, jump, and fall states.
- [ ] Camera scrolls with the player through a level wider than the viewport.
- [ ] Falling off the bottom of the level resets the player to the start.

---

## Milestone 2 — Combat & Enemies

**Goal:** The player can shoot zombies, take damage, and die. Zombies patrol and attack.

### Deliverables

- **Shooting mechanic**
  - Aim direction follows player facing.
  - Pistol draw, shoot, and crouch-shoot animations.
  - Bullet projectile with arcade physics; destroys on collision or off-screen.
- **Zombie enemy**
  - Spritesheet with Idle, Walk, Attack, Hit, Dead animations.
  - Patrol AI: walk between two points, reverse on edge/wall.
  - Aggro AI: chase the player when within detection range.
  - Attack: deal damage on contact or within melee range.
  - Health: takes multiple hits before dying (Hit animation on damage, Dead animation on kill).
- **Blood effects** — Shot-damage and splash particle effects on hit/kill.
- **Player damage**
  - Hit animation, brief invincibility frames.
  - Health system (3 HP). Death triggers Dead animation and respawn.
- **Advanced movement** (use remaining character sprites)
  - Wall slide and wall jump.
  - Roll / dodge with i-frames.
  - Crouch.

### Acceptance Criteria

- [ ] Player can shoot bullets that damage and kill zombies.
- [ ] Zombies patrol, detect the player, chase, and deal contact damage.
- [ ] Blood effects play on zombie hit and death.
- [ ] Player Hit and Dead animations play correctly; respawn works.
- [ ] Wall slide, roll, and crouch animations are functional.

---

## Milestone 3 — Levels, UI & Polish

**Goal:** Multiple levels, menus, scoring, and game-feel polish to make it a complete experience.

### Deliverables

- **Level progression**
  - 3 distinct levels with increasing difficulty (more zombies, trickier platforming, tighter spaces).
  - Transition screen between levels with stats (kills, time).
  - Level data stored as Tiled JSON or generated tilemaps.
- **Main menu scene** — Title screen with Start and Controls options.
- **Game Over / Victory screen** — Show final score, restart or quit.
- **Scoring system** — Points for kills, time bonus, combo multiplier for consecutive kills.
- **Sound & music** — Background music track, SFX for jump, shoot, hit, enemy death, and UI (placeholder/free assets).
- **Game-feel polish**
  - Screen shake on player damage and enemy kills.
  - Coyote time (jump grace period after leaving a ledge).
  - Jump buffering (queue jump input slightly before landing).
  - Particle dust on landing and wall slide.
- **Pause menu** — ESC to pause, resume, or quit to main menu.

### Acceptance Criteria

- [ ] 3 levels are playable in sequence with a win condition.
- [ ] Main menu, game over, and victory screens all function.
- [ ] Score displays during gameplay and on end screens.
- [ ] At least basic SFX are present for core actions.
- [ ] Coyote time and jump buffering are implemented.
- [ ] Game can be paused and resumed.

---

## Technical Notes

| Concern | Decision |
|---|---|
| Framework | Phaser 3 (latest) |
| Bundler | Vite |
| Physics | Arcade |
| Language | JavaScript (ES modules) |
| Resolution | 800 x 480, pixel-art scale mode |
| Sprite size | 64x64 per frame |
| Target FPS | 60 |

---

## Asset Inventory (already in project)

| Asset | Frames | Location |
|---|---|---|
| Main Character | 86 | `64x64 Pixel Art …/Main Character/` |
| Zombie | 29 | `64x64 Pixel Art …/Zombie/` |
| Blood — Shot Damage | 5 | `64x64 Pixel Art …/Blood Effect/shot damage/` |
| Blood — Splash | 3 | `64x64 Pixel Art …/Blood Effect/splash/` |

### Assets still needed

- Tileset for platforms/ground (can use colored rectangles initially)
- Background art (parallax layers — can start with solid color gradient)
- UI elements (health bar, score font)
- Audio: music + SFX (source from free libraries like Kenney or OpenGameArt)

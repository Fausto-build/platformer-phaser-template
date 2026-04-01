import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, PLAYER, SCORING } from '../config/gameConfig.js';
import { LEVELS, getLevel } from '../data/levels.js';
import {
  addDefeat,
  addScore,
  beginLevel,
  completeLevel,
  getRunState,
  loseLife,
} from '../state/runState.js';
import Player from '../gameObjects/Player.js';
import Enemy from '../gameObjects/Enemy.js';
import { BulletPool } from '../gameObjects/Bullet.js';
import HitEffect from '../gameObjects/HitEffect.js';
import {
  playHitSfx,
  playUiBlip,
  playEnemyDeathSfx,
  startMusicLoop,
} from '../systems/audioManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.levelIndex = data.levelIndex ?? 0;
    this.level = getLevel(this.levelIndex);
  }

  create() {
    if (!this.level) {
      this.scene.start('VictoryScene');
      return;
    }

    beginLevel(this.levelIndex);

    this.levelWidth = this.level.widthTiles * TILE_SIZE;
    this.levelHeight = this.level.heightTiles * TILE_SIZE;
    this.levelElapsedMs = 0;
    this.levelDefeats = 0;
    this.comboCount = 0;
    this.comboExpiresAt = 0;
    this.levelComplete = false;
    this.gameOverPending = false;
    this.onPausePressed = () => this.pauseGame();

    this.solidTiles = new Set();
    this.createBackground();
    this.platforms = this.physics.add.staticGroup();
    this.buildLevel();
    this.createGoal();
    this.createDustSystems();

    this.hitEffect = new HitEffect(this);
    this.bullets = new BulletPool(this);
    this.physics.add.collider(this.bullets, this.platforms, (bullet) => {
      bullet.deactivate();
    });

    const spawnX = this.tileCenterX(this.level.spawn.x);
    const spawnY = this.tileCenterY(this.level.spawn.y);
    this.player = new Player(this, spawnX, spawnY);
    this.physics.add.collider(this.player, this.platforms);

    this.enemies = this.add.group();
    this.spawnEnemies();

    this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.playerTouchEnemy, null, this);
    this.physics.add.overlap(this.player, this.goal, this.reachGoal, null, this);

    this.physics.world.setBounds(0, 0, this.levelWidth, this.levelHeight);
    this.cameras.main.setBounds(0, 0, this.levelWidth, this.levelHeight);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(GAME_WIDTH * 0.25, GAME_HEIGHT * 0.2);

    this.musicEvent = startMusicLoop(this, this.levelIndex);
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.pauseKey.on('down', this.onPausePressed);

    this.events.on('player-died', this.handlePlayerDeath, this);
    this.events.on('enemy-killed', this.handleEnemyKilled, this);

    if (this.scene.isActive('UIScene')) {
      this.scene.stop('UIScene');
    }
    this.scene.launch('UIScene');

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off('player-died', this.handlePlayerDeath, this);
      this.events.off('enemy-killed', this.handleEnemyKilled, this);
      this.pauseKey?.off('down', this.onPausePressed);
      this.musicEvent?.destroy();
    });
  }

  update(time, delta) {
    if (!this.player || this.levelComplete || this.gameOverPending) {
      return;
    }

    this.levelElapsedMs += delta;

    if (this.comboCount > 0 && this.levelElapsedMs > this.comboExpiresAt) {
      this.comboCount = 0;
    }

    if (!this.player.alive) {
      return;
    }

    this.player.update(time, delta);

    this.enemies.getChildren().forEach((enemy) => {
      if (enemy.active) {
        enemy.update(time);
      }
    });

    this.checkBulletHits();

    if (this.player.y > this.levelHeight + 50 && this.player.alive) {
      this.player.die();
    }
  }

  pauseGame() {
    if (
      this.levelComplete ||
      this.gameOverPending ||
      this.scene.isPaused('GameScene') ||
      this.scene.isActive('PauseScene')
    ) {
      return;
    }

    playUiBlip(this);
    this.scene.pause('UIScene');
    this.scene.launch('PauseScene');
    this.scene.pause();
  }

  createBackground() {
    const theme = this.level.theme;

    // Sky-colored fill behind everything
    const sky = this.add.graphics();
    sky.fillStyle(0x87ceeb, 1);
    sky.fillRect(0, 0, this.levelWidth, this.levelHeight);
    sky.setScrollFactor(0.05);

    // Background image
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, theme.background);
    bg.setDisplaySize(GAME_WIDTH * 1.3, GAME_HEIGHT * 1.3);
    bg.setScrollFactor(0.05);

    // Clouds
    for (let i = 0; i < 10; i++) {
      const cloudKey = `cloud${Phaser.Math.Between(1, 3)}`;
      const cloud = this.add.image(
        Phaser.Math.Between(0, this.levelWidth),
        Phaser.Math.Between(20, 140),
        cloudKey
      );
      cloud.setScrollFactor(0.12 + Math.random() * 0.12);
      cloud.setAlpha(0.5 + Math.random() * 0.4);
      cloud.setScale(0.6 + Math.random() * 0.4);
    }

    // Decorative items along the ground
    const groundY = (this.level.heightTiles - 2) * TILE_SIZE;
    const decorItems = theme.decoration || [];
    if (decorItems.length > 0) {
      for (let x = 80; x < this.levelWidth - 80; x += Phaser.Math.Between(120, 280)) {
        const tileX = Math.floor(x / TILE_SIZE);
        if (this.isHoleTile(tileX)) continue;

        const itemKey = decorItems[Phaser.Math.Between(0, decorItems.length - 1)];
        const decor = this.add.image(x, groundY - 8, itemKey);
        decor.setScale(0.5 + Math.random() * 0.3);
        decor.setOrigin(0.5, 1);
      }
    }
  }

  createGoal() {
    const goalX = this.tileCenterX(this.level.goal.x);
    const goalY = this.tileCenterY(this.level.goal.y) - TILE_SIZE / 2;

    this.goal = this.add.zone(goalX, goalY, TILE_SIZE, TILE_SIZE * 2);
    this.physics.add.existing(this.goal, true);

    const flag = this.add.image(goalX, goalY - 10, this.level.theme.flag);
    flag.setScale(0.6);
  }

  createDustSystems() {
    const dustColor = this.level.theme.dust;

    this.landingDust = this.add.particles(0, 0, 'pixel', {
      tint: [dustColor, 0xffffff],
      alpha: { start: 0.6, end: 0 },
      scale: { start: 4, end: 0.2 },
      speedX: { min: -80, max: 80 },
      speedY: { min: -35, max: 15 },
      lifespan: { min: 180, max: 260 },
      gravityY: 260,
      emitting: false,
    });

    this.wallDust = this.add.particles(0, 0, 'pixel', {
      tint: [dustColor, 0xffffff],
      alpha: { start: 0.35, end: 0 },
      scale: { start: 2, end: 0.1 },
      speedX: { min: -24, max: 24 },
      speedY: { min: -10, max: 36 },
      lifespan: { min: 120, max: 180 },
      gravityY: 80,
      emitting: false,
    });
  }

  buildLevel() {
    const theme = this.level.theme;
    const groundY = this.level.heightTiles - 1;

    // Ground tiles
    for (let tileX = 0; tileX < this.level.widthTiles; tileX += 1) {
      if (this.isHoleTile(tileX)) continue;

      const holeLeft = tileX === 0 || this.isHoleTile(tileX - 1);
      const holeRight = tileX === this.level.widthTiles - 1 || this.isHoleTile(tileX + 1);

      // Top layer: surface tile
      let topKey = `${theme.tilePrefix}Mid`;
      if (holeLeft) topKey = `${theme.tilePrefix}Left`;
      else if (holeRight) topKey = `${theme.tilePrefix}Right`;

      this.placeTile(tileX, groundY - 1, topKey);

      // Bottom layer: fill tile
      this.placeTile(tileX, groundY, `${theme.fillPrefix}Center`);
    }

    // Platforms
    for (const [startX, tileY, width] of this.level.platforms) {
      for (let offset = 0; offset < width; offset += 1) {
        let tileKey;
        if (width === 1) {
          tileKey = `${theme.tilePrefix}HalfMid`;
        } else if (offset === 0) {
          tileKey = `${theme.tilePrefix}HalfLeft`;
        } else if (offset === width - 1) {
          tileKey = `${theme.tilePrefix}HalfRight`;
        } else {
          tileKey = `${theme.tilePrefix}HalfMid`;
        }

        this.placeTile(startX + offset, tileY, tileKey);
      }
    }

    // Walls
    for (const [tileX, startY, height] of this.level.walls) {
      for (let offsetY = 0; offsetY < height; offsetY += 1) {
        this.placeTile(tileX, startY + offsetY, 'brickWall');
      }
    }
  }

  placeTile(tileX, tileY, textureKey) {
    const worldX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = tileY * TILE_SIZE + TILE_SIZE / 2;

    const tile = this.platforms.create(worldX, worldY, textureKey);
    tile.setDisplaySize(TILE_SIZE, TILE_SIZE).refreshBody();
    this.solidTiles.add(`${tileX},${tileY}`);
  }

  isHoleTile(tileX) {
    return this.level.holes.some(([start, end]) => tileX >= start && tileX <= end);
  }

  spawnEnemies() {
    const enemyY = (this.level.heightTiles - 3) * TILE_SIZE;
    const enemyType = this.level.theme.enemyType || 'slime';

    for (const [tileX, patrolLeft, patrolRight] of this.level.enemies) {
      const enemy = new Enemy(
        this,
        tileX * TILE_SIZE,
        enemyY,
        patrolLeft * TILE_SIZE,
        patrolRight * TILE_SIZE,
        enemyType
      );

      enemy.setTarget(this.player);
      this.physics.add.collider(enemy, this.platforms);
      this.enemies.add(enemy);
    }
  }

  bulletHitEnemy(bullet, enemy) {
    if (!bullet.active || !enemy.alive) {
      return;
    }

    bullet.deactivate();
    enemy.takeDamage(this.hitEffect);
  }

  checkBulletHits() {
    const bullets = this.bullets.getChildren();
    const enemies = this.enemies.getChildren();

    for (const bullet of bullets) {
      if (!bullet.active) continue;

      const bulletBounds = bullet.getBounds();

      for (const enemy of enemies) {
        if (!enemy.active || !enemy.alive) continue;

        const enemyBounds = enemy.getBounds();
        enemyBounds.x += 8;
        enemyBounds.y += 6;
        enemyBounds.width -= 16;
        enemyBounds.height -= 6;

        if (enemyBounds.width <= 0 || enemyBounds.height <= 0) continue;

        if (Phaser.Geom.Intersects.RectangleToRectangle(bulletBounds, enemyBounds)) {
          this.bulletHitEnemy(bullet, enemy);
          break;
        }
      }
    }
  }

  playerTouchEnemy(player, enemy) {
    if (!player.alive || !enemy.alive || player.isInvincible) {
      return;
    }

    player.takeDamage(enemy.x);
  }

  handleEnemyKilled() {
    this.levelDefeats += 1;
    addDefeat();

    this.comboCount = this.levelElapsedMs <= this.comboExpiresAt ? this.comboCount + 1 : 1;
    this.comboExpiresAt = this.levelElapsedMs + SCORING.COMBO_WINDOW_MS;

    const scoreGain = SCORING.DEFEAT_POINTS * this.comboCount;
    addScore(scoreGain);
    playEnemyDeathSfx(this);
    this.cameras.main.shake(120, 0.005);
  }

  handlePlayerHit() {
    this.comboCount = 0;
    playHitSfx(this);
    this.cameras.main.shake(140, 0.006);
  }

  spawnLandingDust(x, y) {
    this.landingDust.explode(9, x, y + 20);
  }

  spawnWallDust(x, y, facingRight) {
    this.wallDust.explode(3, x + (facingRight ? -10 : 10), y + 6);
  }

  reachGoal() {
    if (this.levelComplete || !this.player.alive) {
      return;
    }

    this.levelComplete = true;
    this.player.alive = false;
    this.player.body.enable = false;
    this.player.setVelocity(0, 0);
    this.player.anims.play('player_idle', true);

    const timeBonusSeconds = Math.max(
      0,
      Math.floor((this.level.parTimeMs - this.levelElapsedMs) / 1000)
    );
    const timeBonus = timeBonusSeconds * SCORING.TIME_BONUS_PER_SECOND;
    const totalScore = addScore(timeBonus);

    const result = {
      levelIndex: this.levelIndex,
      levelNumber: this.level.id,
      levelName: this.level.name,
      defeats: this.levelDefeats,
      timeMs: this.levelElapsedMs,
      timeBonus,
      totalScore,
    };

    completeLevel(result);

    this.time.delayedCall(650, () => {
      this.scene.stop('UIScene');
      this.scene.start('LevelTransitionScene', {
        result,
        nextLevelIndex: this.levelIndex + 1 < LEVELS.length ? this.levelIndex + 1 : null,
      });
    });
  }

  handlePlayerDeath() {
    if (this.levelComplete || this.gameOverPending) {
      return;
    }

    const remainingLives = loseLife();
    this.comboCount = 0;

    if (remainingLives <= 0) {
      this.gameOverPending = true;
      this.scene.stop('UIScene');
      this.time.delayedCall(800, () => {
        this.scene.start('GameOverScene', {
          finalTimeMs: getRunState().totalTimeMs + this.levelElapsedMs,
        });
      });
      return;
    }

    this.time.delayedCall(PLAYER.RESPAWN_DELAY, () => {
      if (!this.player?.active) {
        return;
      }

      this.player.respawn(
        this.tileCenterX(this.level.spawn.x),
        this.tileCenterY(this.level.spawn.y)
      );
    });
  }

  getHudState() {
    const runState = getRunState();

    return {
      levelNumber: this.level.id,
      levelName: this.level.name,
      health: this.player?.health ?? 0,
      maxHealth: PLAYER.MAX_HEALTH,
      lives: runState.lives,
      defeats: this.levelDefeats,
      totalDefeats: runState.totalDefeats,
      score: runState.score,
      combo: this.comboCount,
      timeMs: this.levelElapsedMs,
      parTimeMs: this.level.parTimeMs,
    };
  }

  tileCenterX(tileX) {
    return tileX * TILE_SIZE + TILE_SIZE / 2;
  }

  tileCenterY(tileY) {
    return tileY * TILE_SIZE + TILE_SIZE / 2;
  }
}

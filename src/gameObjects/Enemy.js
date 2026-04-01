import Phaser from 'phaser';
import { ENEMY as ENEMY_CONFIG, TILE_SIZE } from '../config/gameConfig.js';

const ABOVE_DEADZONE_X = 20;

const ENEMY_DEFS = {
  slime: {
    scale: 1.0,
    bodyW: 40, bodyH: 20, offsetX: 10, offsetY: 30,
    walkFrames: ['slime', 'slime_walk'],
    hitFrame: 'slime_hit',
    deadFrame: 'slime_dead',
  },
  spider: {
    scale: 0.9,
    bodyW: 50, bodyH: 30, offsetX: 11, offsetY: 22,
    walkFrames: ['spider_walk1', 'spider_walk2'],
    hitFrame: 'spider_hit',
    deadFrame: 'spider_dead',
  },
  mouse: {
    scale: 1.0,
    bodyW: 40, bodyH: 24, offsetX: 10, offsetY: 26,
    walkFrames: ['mouse', 'mouse_walk'],
    hitFrame: 'mouse_hit',
    deadFrame: 'mouse_dead',
  },
};

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, patrolLeft, patrolRight, enemyType = 'slime') {
    super(scene, x, y, enemyType);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.enemyType = enemyType;
    const def = ENEMY_DEFS[enemyType] || ENEMY_DEFS.slime;

    this.setScale(def.scale);
    this.body.setSize(def.bodyW, def.bodyH);
    this.body.setOffset(def.offsetX, def.offsetY);
    this.body.setGravityY(ENEMY_CONFIG.GRAVITY);
    this.body.setCollideWorldBounds(false);

    this.patrolLeft = patrolLeft;
    this.patrolRight = patrolRight;

    this.health = ENEMY_CONFIG.HEALTH;
    this.alive = true;
    this.facingRight = false;
    this.state = 'patrol';
    this.lastAttackTime = 0;
    this.target = null;

    this.setVelocityX(ENEMY_CONFIG.SPEED);
    this.facingRight = true;

    this.createAnimations(scene);
  }

  createAnimations(scene) {
    const type = this.enemyType;
    const def = ENEMY_DEFS[type] || ENEMY_DEFS.slime;

    if (scene.anims.exists(`${type}_idle`)) return;

    scene.anims.create({
      key: `${type}_idle`,
      frames: [{ key: type }],
      frameRate: 1,
      repeat: 0,
    });

    scene.anims.create({
      key: `${type}_walk`,
      frames: def.walkFrames.map((k) => ({ key: k })),
      frameRate: 6,
      repeat: -1,
    });

    scene.anims.create({
      key: `${type}_hit`,
      frames: [{ key: def.hitFrame }],
      frameRate: 1,
      repeat: 0,
    });

    scene.anims.create({
      key: `${type}_dead`,
      frames: [{ key: def.deadFrame }],
      frameRate: 1,
      repeat: 0,
    });
  }

  setTarget(player) {
    this.target = player;
  }

  update(time) {
    if (!this.alive) return;
    if (this.state === 'hit' || this.state === 'dead') return;

    if (this.y > 600) {
      this.die();
      return;
    }

    const playerAlive = this.target && this.target.alive;
    const distToPlayer = playerAlive
      ? Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y)
      : Infinity;

    if (playerAlive && distToPlayer < ENEMY_CONFIG.ATTACK_RANGE) {
      this.stateAttack(time);
    } else if (playerAlive && distToPlayer < ENEMY_CONFIG.DETECTION_RANGE) {
      this.stateChase();
    } else {
      this.statePatrol();
    }
  }

  isLedgeAhead(goingRight) {
    if (!this.body.blocked.down) return false;

    const probeX = goingRight ? this.x + TILE_SIZE : this.x - TILE_SIZE;
    const probeY = this.body.bottom + 4;
    const tileX = Math.floor(probeX / TILE_SIZE);
    const tileY = Math.floor(probeY / TILE_SIZE);
    const key = `${tileX},${tileY}`;

    return !this.scene.solidTiles?.has(key);
  }

  statePatrol() {
    this.state = 'patrol';
    const type = this.enemyType;

    const ledgeRight = this.facingRight && this.isLedgeAhead(true);
    const ledgeLeft = !this.facingRight && this.isLedgeAhead(false);

    if (this.x <= this.patrolLeft || this.body.blocked.left || ledgeLeft) {
      this.setVelocityX(ENEMY_CONFIG.SPEED);
      this.facingRight = true;
    } else if (this.x >= this.patrolRight || this.body.blocked.right || ledgeRight) {
      this.setVelocityX(-ENEMY_CONFIG.SPEED);
      this.facingRight = false;
    }

    this.setFlipX(!this.facingRight);
    this.anims.play(`${type}_walk`, true);
  }

  stateChase() {
    this.state = 'chase';
    const type = this.enemyType;

    const dx = this.target.x - this.x;

    if (Math.abs(dx) < ABOVE_DEADZONE_X) {
      this.setVelocityX(0);
      this.setFlipX(!this.facingRight);
      this.anims.play(`${type}_idle`, true);
      return;
    }

    const wantRight = dx > 0;

    if (this.isLedgeAhead(wantRight)) {
      this.setVelocityX(0);
      this.setFlipX(!this.facingRight);
      this.anims.play(`${type}_idle`, true);
      return;
    }

    if (wantRight) {
      this.setVelocityX(ENEMY_CONFIG.CHASE_SPEED);
      this.facingRight = true;
    } else {
      this.setVelocityX(-ENEMY_CONFIG.CHASE_SPEED);
      this.facingRight = false;
    }

    this.setFlipX(!this.facingRight);
    this.anims.play(`${type}_walk`, true);
  }

  stateAttack(time) {
    if (time - this.lastAttackTime < ENEMY_CONFIG.ATTACK_COOLDOWN) {
      this.stateChase();
      return;
    }

    this.state = 'attack';
    this.setVelocityX(0);
    this.lastAttackTime = time;

    this.facingRight = this.target.x > this.x;
    this.setFlipX(!this.facingRight);

    this.anims.play(`${this.enemyType}_walk`, true);
    this.setTint(0xff6666);

    this.scene.time.delayedCall(500, () => {
      if (!this.alive) return;
      this.clearTint();

      const dist = this.target
        ? Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y)
        : Infinity;
      if (dist < ENEMY_CONFIG.ATTACK_RANGE * 2 && this.target.alive) {
        this.target.takeDamage(this.x);
      }
      this.state = 'patrol';
    });
  }

  takeDamage(hitEffect) {
    if (!this.alive) return;

    this.health--;

    if (hitEffect) {
      hitEffect.playHit(this.x, this.y - 10);
    }

    if (this.health <= 0) {
      this.die(hitEffect);
      return;
    }

    this.state = 'hit';
    this.setVelocityX(0);
    this.setTint(0xff0000);
    this.anims.play(`${this.enemyType}_hit`, true);

    this.scene.time.delayedCall(400, () => {
      if (!this.alive) return;
      this.clearTint();
      this.state = 'patrol';
    });
  }

  die(hitEffect) {
    this.alive = false;
    this.state = 'dead';
    this.setVelocityX(0);
    this.body.setAllowGravity(false);
    this.body.enable = false;

    if (hitEffect) {
      hitEffect.playDefeat(this.x, this.y);
    }

    this.anims.play(`${this.enemyType}_dead`, true);

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.1,
      scaleY: 0.1,
      duration: 600,
      onComplete: () => {
        this.destroy();
      },
    });

    this.scene.events.emit('enemy-killed', { x: this.x, y: this.y });
  }
}

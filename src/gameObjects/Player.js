import Phaser from 'phaser';
import { PLAYER, BULLET } from '../config/gameConfig.js';
import { playJumpSfx, playLandSfx, playShootSfx } from '../systems/audioManager.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'p1_stand');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.7);

    this.body.setSize(40, 58);
    this.body.setOffset(13, 34);
    this.body.setGravityY(PLAYER.GRAVITY);
    this.body.setCollideWorldBounds(false);
    this.body.setMaxVelocityX(Math.max(PLAYER.SPEED, PLAYER.ROLL_SPEED, PLAYER.SPEED * 1.2));

    this.health = PLAYER.MAX_HEALTH;
    this.alive = true;
    this.facingRight = true;
    this.hasDoubleJump = true;

    this.isInvincible = false;
    this.lastFireTime = 0;
    this.hasGun = true;

    this.isRolling = false;
    this.isCrouching = false;
    this.isWallSliding = false;
    this.wasOnGround = false;
    this.coyoteUntil = 0;
    this.jumpBufferUntil = 0;
    this.lastWallDustAt = 0;
    this.rollTimer = null;

    this.normalBodySize = { w: 40, h: 58 };
    this.normalBodyOffset = { x: 13, y: 34 };
    this.crouchBodySize = { w: 40, h: 40 };
    this.crouchBodyOffset = { x: 15, y: 31 };

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.jumpKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.fireKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.rollKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    this.jumpKey.on('down', () => {
      this.jumpBufferUntil = this.scene.time.now + PLAYER.JUMP_BUFFER_MS;
    });

    this.rollJustPressed = false;
    this.rollKey.on('down', () => {
      this.rollJustPressed = true;
    });

    this.createAnimations(scene);
  }

  createAnimations(scene) {
    if (scene.anims.exists('player_idle')) {
      return;
    }

    scene.anims.create({ key: 'player_idle', frames: [{ key: 'p1_stand' }], frameRate: 1, repeat: 0 });

    const walkFrames = [];
    for (let i = 1; i <= 11; i++) {
      walkFrames.push({ key: `p1_walk_${String(i).padStart(2, '0')}` });
    }
    scene.anims.create({ key: 'player_run', frames: walkFrames, frameRate: 14, repeat: -1 });

    scene.anims.create({ key: 'player_jump', frames: [{ key: 'p1_jump' }], frameRate: 1, repeat: 0 });
    scene.anims.create({ key: 'player_fall', frames: [{ key: 'p1_jump' }], frameRate: 1, repeat: 0 });
    scene.anims.create({ key: 'player_dead', frames: [{ key: 'p1_hurt' }], frameRate: 1, repeat: 0 });
    scene.anims.create({ key: 'player_hit', frames: [{ key: 'p1_hurt' }], frameRate: 1, repeat: 0 });
    scene.anims.create({ key: 'player_crouch', frames: [{ key: 'p1_duck' }], frameRate: 1, repeat: 0 });
    scene.anims.create({ key: 'player_roll', frames: [{ key: 'p1_duck' }], frameRate: 1, repeat: 0 });
    scene.anims.create({ key: 'player_wall_slide', frames: [{ key: 'p1_jump' }], frameRate: 1, repeat: 0 });
  }

  update(time) {
    if (!this.alive) {
      return;
    }

    const now = this.scene.time.now;
    const onGround = this.body.blocked.down;
    const touchingWallLeft = this.body.blocked.left;
    const touchingWallRight = this.body.blocked.right;
    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;
    const upHeld = this.jumpKey.isDown || this.cursors.up.isDown || this.wasd.up.isDown;
    const wantRoll = this.rollJustPressed;
    const wantFire = this.fireKey.isDown;

    this.rollJustPressed = false;

    if (onGround) {
      this.coyoteUntil = now + PLAYER.COYOTE_TIME_MS;
      this.hasDoubleJump = true;
    }

    if (!this.wasOnGround && onGround) {
      this.scene.spawnLandingDust(this.x, this.y);
      playLandSfx(this.scene);
    }

    this.wasOnGround = onGround;

    if (this.isRolling) {
      return;
    }

    const rollDirection = left ? -1 : right ? 1 : (this.facingRight ? 1 : -1);

    if (wantRoll && onGround) {
      this.exitCrouch();
      this.startRoll(rollDirection);
      return;
    }

    if (onGround && down && !left && !right) {
      this.enterCrouch();
      this.setVelocityX(0);

      if (wantFire && this.hasGun) {
        this.shoot(time);
      }
      this.anims.play('player_crouch', true);
      return;
    }

    this.exitCrouch();

    const pushingWall = (touchingWallLeft && left) || (touchingWallRight && right);
    const bufferedJump = this.jumpBufferUntil >= now;

    if (!onGround && pushingWall && this.body.velocity.y > 0) {
      this.isWallSliding = true;
      this.body.setVelocityY(PLAYER.WALL_SLIDE_SPEED);
      this.anims.play('player_wall_slide', true);

      if (now - this.lastWallDustAt >= PLAYER.WALL_DUST_INTERVAL_MS) {
        this.scene.spawnWallDust(this.x, this.y, touchingWallRight);
        this.lastWallDustAt = now;
      }

      if (bufferedJump) {
        const direction = touchingWallLeft ? 1 : -1;
        this.performJump(direction * PLAYER.SPEED * 1.2);
        this.hasDoubleJump = true;
        this.isWallSliding = false;
      }
      return;
    }

    this.isWallSliding = false;

    if (left) {
      this.setVelocityX(-PLAYER.SPEED);
      this.facingRight = false;
      this.setFlipX(true);
    } else if (right) {
      this.setVelocityX(PLAYER.SPEED);
      this.facingRight = true;
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    if (bufferedJump) {
      const canGroundJump = onGround || now <= this.coyoteUntil;

      if (canGroundJump) {
        this.performJump();
      } else if (this.hasDoubleJump) {
        this.performJump();
        this.hasDoubleJump = false;
      }
    }

    if (!upHeld && this.body.velocity.y < -100) {
      this.setVelocityY(this.body.velocity.y * 0.5);
    }

    if (wantFire && this.hasGun) {
      this.shoot(time);
    }

    this.updateAnimation(onGround, left || right);
  }

  enterCrouch() {
    if (this.isCrouching) {
      return;
    }

    this.isCrouching = true;
    this.applyCompactBody();
  }

  exitCrouch() {
    if (!this.isCrouching) {
      return;
    }

    this.isCrouching = false;
    this.applyNormalBody();
  }

  applyCompactBody() {
    this.body.setSize(this.crouchBodySize.w, this.crouchBodySize.h);
    this.body.setOffset(this.crouchBodyOffset.x, this.crouchBodyOffset.y);
  }

  applyNormalBody() {
    this.body.setSize(this.normalBodySize.w, this.normalBodySize.h);
    this.body.setOffset(this.normalBodyOffset.x, this.normalBodyOffset.y);
  }

  applyNormalBodyPreservingBottom() {
    const previousBottom = this.body.bottom;

    this.applyNormalBody();
    this.body.updateFromGameObject();

    const bottomDelta = previousBottom - this.body.bottom;

    if (bottomDelta !== 0) {
      this.setY(this.y + bottomDelta);
      this.body.updateFromGameObject();
    }
  }

  performJump(horizontalVelocity = null) {
    this.jumpBufferUntil = 0;
    this.coyoteUntil = 0;
    this.setVelocityY(PLAYER.JUMP_VELOCITY);

    if (horizontalVelocity !== null) {
      this.setVelocityX(horizontalVelocity);
      this.facingRight = horizontalVelocity > 0;
      this.setFlipX(!this.facingRight);
    }

    playJumpSfx(this.scene);
  }

  updateAnimation(onGround, moving) {
    if (!onGround) {
      this.anims.play(this.body.velocity.y < 0 ? 'player_jump' : 'player_fall', true);
    } else if (moving) {
      this.anims.play('player_run', true);
    } else {
      this.anims.play('player_idle', true);
    }
  }

  shoot(time) {
    if (time - this.lastFireTime < BULLET.FIRE_RATE) {
      return;
    }

    this.lastFireTime = time;

    const direction = this.facingRight ? 1 : -1;
    const bulletX = this.x + direction * 25;
    const bulletY = this.y - 5;

    this.scene.bullets.fire(bulletX, bulletY, direction);
    playShootSfx(this.scene);
  }

  startRoll(direction = this.facingRight ? 1 : -1) {
    this.isRolling = true;
    this.isInvincible = true;
    this.facingRight = direction >= 0;
    this.setFlipX(!this.facingRight);

    this.rollTimer?.remove(false);
    this.applyCompactBody();
    this.setVelocityY(0);
    this.setVelocityX(direction * PLAYER.ROLL_SPEED);
    this.anims.play('player_roll', true);

    this.scene.tweens.add({
      targets: this,
      angle: direction * 360,
      duration: PLAYER.ROLL_DURATION,
      onComplete: () => {
        this.angle = 0;
      },
    });

    this.rollTimer = this.scene.time.delayedCall(PLAYER.ROLL_DURATION, () => {
      this.isRolling = false;
      this.isInvincible = false;
      this.applyNormalBodyPreservingBottom();
    });
  }

  takeDamage(sourceX = this.x) {
    if (!this.alive || this.isInvincible) {
      return;
    }

    this.health -= 1;
    this.scene.handlePlayerHit();

    const knockbackDirection = this.x < sourceX ? -1 : 1;
    this.setVelocityX(knockbackDirection * 150);
    this.setVelocityY(-180);

    if (this.health <= 0) {
      this.scene.events.emit('player-health-changed', 0);
      this.die();
      return;
    }

    this.scene.events.emit('player-health-changed', this.health);
    this.isInvincible = true;
    this.anims.play('player_hit', true);
    this.setTint(0xff0000);

    const blinkEvent = this.scene.time.addEvent({
      delay: 100,
      repeat: Math.floor(PLAYER.INVINCIBILITY_DURATION / 100) - 1,
      callback: () => {
        this.setAlpha(this.alpha === 1 ? 0.3 : 1);
      },
    });

    this.scene.time.delayedCall(PLAYER.INVINCIBILITY_DURATION, () => {
      this.isInvincible = false;
      this.setAlpha(1);
      if (this.active) {
        this.clearTint();
      }
      blinkEvent.destroy();
    });
  }

  die() {
    if (!this.alive) {
      return;
    }

    this.health = 0;
    this.scene.events.emit('player-health-changed', 0);
    this.alive = false;
    this.setVelocity(0, 0);
    this.body.setAllowGravity(false);
    this.anims.play('player_dead', true);

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y - 50,
      duration: 800,
      onComplete: () => {
        this.scene.time.delayedCall(200, () => {
          this.scene.events.emit('player-died');
        });
      },
    });
  }

  respawn(x, y) {
    this.rollTimer?.remove(false);
    this.setPosition(x, y);
    this.setVelocity(0, 0);
    this.body.enable = true;
    this.body.setAllowGravity(true);
    this.applyNormalBody();

    this.health = PLAYER.MAX_HEALTH;
    this.alive = true;
    this.isInvincible = false;
    this.isRolling = false;
    this.isCrouching = false;
    this.isWallSliding = false;
    this.hasDoubleJump = true;
    this.jumpBufferUntil = 0;
    this.coyoteUntil = 0;
    this.wasOnGround = false;
    this.angle = 0;

    this.clearTint();
    this.setAlpha(1);
    this.anims.play('player_idle', true);
    this.scene.events.emit('player-health-changed', this.health);
  }
}

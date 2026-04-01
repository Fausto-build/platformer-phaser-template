import Phaser from 'phaser';
import { BULLET } from '../config/gameConfig.js';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'fireball');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDisplaySize(20, 20);
    this.body.setAllowGravity(false);
    this.setActive(false);
    this.setVisible(false);
    this.lifeTimer = null;
  }

  fire(x, y, direction) {
    this.lifeTimer?.remove(false);
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.body.enable = true;
    this.setVelocityX(direction * BULLET.SPEED);
    this.setFlipX(direction < 0);

    this.lifeTimer = this.scene.time.delayedCall(BULLET.LIFETIME, () => {
      this.deactivate();
    });
  }

  deactivate() {
    this.lifeTimer?.remove(false);
    this.lifeTimer = null;
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
    this.setVelocity(0, 0);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;

    const cam = this.scene.cameras.main;
    if (this.x < cam.scrollX - 50 || this.x > cam.scrollX + cam.width + 50) {
      this.deactivate();
    }
  }
}

export class BulletPool extends Phaser.Physics.Arcade.Group {
  constructor(scene) {
    super(scene.physics.world, scene, {
      classType: Bullet,
      maxSize: BULLET.POOL_SIZE,
      runChildUpdate: true,
    });

    for (let i = 0; i < BULLET.POOL_SIZE; i++) {
      const bullet = new Bullet(scene, 0, 0);
      this.add(bullet, true);
    }
  }

  fire(x, y, direction) {
    const bullet = this.getFirstDead(false);
    if (bullet) {
      bullet.fire(x, y, direction);
    }
  }
}

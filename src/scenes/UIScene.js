import Phaser from 'phaser';
import { PLAYER } from '../config/gameConfig.js';
import { formatDuration, formatScore } from '../utils/formatters.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    this.gameScene = this.scene.get('GameScene');

    this.add.rectangle(400, 32, 800, 72, 0xf4fbff, 0.88)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0x70c8ec, 0.85);

    this.add.image(42, 36, 'hud_p1')
      .setOrigin(0.5, 0)
      .setScale(0.72);

    this.hearts = [];
    for (let index = 0; index < PLAYER.MAX_HEALTH; index += 1) {
      const heart = this.add.image(688 + index * 30, 56, 'hud_heartEmpty')
        .setOrigin(0.5)
        .setScale(0.48);
      this.hearts.push(heart);
    }

    this.levelText = this.add.text(80, 10, '', {
      fontSize: '18px',
      color: '#21445d',
      fontStyle: 'bold',
    });

    this.scoreText = this.add.text(80, 40, '', {
      fontSize: '18px',
      color: '#2a9168',
      fontStyle: 'bold',
    });

    this.defeatsText = this.add.text(260, 40, '', {
      fontSize: '18px',
      color: '#d16c5a',
      fontStyle: 'bold',
    });

    this.comboText = this.add.text(448, 40, '', {
      fontSize: '18px',
      color: '#c38f1e',
      fontStyle: 'bold',
    });

    this.timeText = this.add.text(654, 10, '', {
      fontSize: '18px',
      color: '#21445d',
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    this.livesText = this.add.text(654, 40, '', {
      fontSize: '18px',
      color: '#21445d',
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    this.add.text(400, 460, 'F shoot   SPACE jump   SHIFT roll   ESC pause', {
      fontSize: '13px',
      color: '#3d6179',
    }).setOrigin(0.5);
  }

  update() {
    if (!this.gameScene || !this.scene.isActive('GameScene')) {
      return;
    }

    const hud = this.gameScene.getHudState();
    if (!hud) {
      return;
    }

    this.levelText.setText(`Level ${hud.levelNumber}: ${hud.levelName}`);
    this.scoreText.setText(`Score ${formatScore(hud.score)}`);
    this.defeatsText.setText(`Defeats ${hud.defeats}/${hud.totalDefeats}`);
    this.comboText.setText(hud.combo > 1 ? `Combo x${hud.combo}` : 'Combo x1');
    this.timeText.setText(`Time ${formatDuration(hud.timeMs)}`);
    this.livesText.setText(`Lives ${hud.lives}`);

    for (let index = 0; index < this.hearts.length; index += 1) {
      this.hearts[index].setTexture(index < hud.health ? 'hud_heartFull' : 'hud_heartEmpty');
    }
  }
}

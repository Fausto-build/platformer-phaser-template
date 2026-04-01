import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';
import { startNewRun } from '../state/runState.js';
import { createPanel, createTextButton } from '../utils/ui.js';
import { playUiBlip } from '../systems/audioManager.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    this.createBackground();

    this.add.text(GAME_WIDTH / 2, 82, 'KENNEY', {
      fontSize: '28px',
      color: '#ffe07c',
      fontStyle: 'bold',
      letterSpacing: 8,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 136, 'PLATFORMER', {
      fontSize: '58px',
      color: '#f8fbff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 174, 'Bright stages, classic jumps, pure arcade energy.', {
      fontSize: '18px',
      color: '#21445d',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    createPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 26, 430, 250);

    this.controlsVisible = false;
    this.controlsText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 36, '', {
      fontSize: '18px',
      color: '#35586f',
      align: 'center',
      lineSpacing: 10,
    }).setOrigin(0.5);

    createTextButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 28, 'Start Run', () => {
      playUiBlip(this);
      startNewRun();
      this.scene.start('GameScene', { levelIndex: 0 });
    });

    createTextButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 34, 'Controls', () => {
      playUiBlip(this);
      this.toggleControls();
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 52, 'ENTER starts the run. C toggles controls.', {
      fontSize: '16px',
      color: '#21445d',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.handleEnter = () => {
      playUiBlip(this);
      startNewRun();
      this.scene.start('GameScene', { levelIndex: 0 });
    };

    this.handleToggleControls = () => {
      playUiBlip(this);
      this.toggleControls();
    };

    this.input.keyboard.once('keydown-ENTER', this.handleEnter);
    this.input.keyboard.on('keydown-C', this.handleToggleControls);

    this.toggleControls();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard.off('keydown-C', this.handleToggleControls);
      this.input.keyboard.off('keydown-ENTER', this.handleEnter);
    });
  }

  createBackground() {
    const background = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_grasslands');
    background.setDisplaySize(GAME_WIDTH + 120, GAME_HEIGHT + 40);

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xe9f9ff, 0.18)
      .setOrigin(0.5);

    for (let index = 0; index < 5; index += 1) {
      const cloud = this.add.image(
        90 + index * 165,
        62 + (index % 2) * 28,
        `cloud${(index % 3) + 1}`
      );
      cloud.setScale(0.45 + index * 0.03);
      cloud.setAlpha(0.72);
    }

    const tilesWide = Math.ceil(GAME_WIDTH / 32);
    for (let tileX = 0; tileX <= tilesWide; tileX += 1) {
      const topKey = tileX === 0 ? 'grassLeft' : tileX === tilesWide ? 'grassRight' : 'grassMid';
      const worldX = tileX * 32 + 16;

      this.add.image(worldX, GAME_HEIGHT - 48, topKey).setDisplaySize(32, 32);
      this.add.image(worldX, GAME_HEIGHT - 16, 'dirtCenter').setDisplaySize(32, 32);
    }

    [
      { x: 92, y: GAME_HEIGHT - 60, key: 'bush', scale: 0.5 },
      { x: 168, y: GAME_HEIGHT - 58, key: 'plant', scale: 0.5 },
      { x: 618, y: GAME_HEIGHT - 56, key: 'rock', scale: 0.48 },
      { x: 712, y: GAME_HEIGHT - 58, key: 'plant', scale: 0.46 },
    ].forEach(({ x, y, key, scale }) => {
      this.add.image(x, y, key).setOrigin(0.5, 1).setScale(scale);
    });
  }

  toggleControls() {
    this.controlsVisible = !this.controlsVisible;
    this.controlsText.setText(
      this.controlsVisible
        ? 'Move: WASD or Arrow Keys\nJump: SPACE\nShoot: F\nRoll: SHIFT\nPause: ESC'
        : 'Three colorful stages. Survive with 3 lives.\nBuild score with fast defeats for combo multipliers.\nReach each flag to push deeper into the platform trail.'
    );
  }
}

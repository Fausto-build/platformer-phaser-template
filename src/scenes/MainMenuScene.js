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
    const panelWidth = 430;
    const panelHeight = 258;
    const panelX = GAME_WIDTH / 2;
    const panelY = GAME_HEIGHT / 2 + 40;
    const panelTop = panelY - (panelHeight / 2);
    const panelBottom = panelY + (panelHeight / 2);

    this.createBackground();

    this.add.text(panelX, 100, 'PLATFORMER', {
      fontSize: '58px',
      color: '#2d5d7b',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    createPanel(this, panelX, panelY, panelWidth, panelHeight);

    this.add.text(panelX, panelTop + 20, 'Bright stages, classic jumps, pure arcade energy.', {
      fontSize: '16px',
      color: '#21445d',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: panelWidth - 88, useAdvancedWrap: true },
      lineSpacing: 4,
    }).setOrigin(0.5, 0);

    this.add.rectangle(panelX, panelTop + 68, panelWidth - 96, 2, 0x6bc5ef, 0.72)
      .setOrigin(0.5);

    this.showingControls = false;
    this.detailsTitle = this.add.text(panelX, panelTop + 80, '', {
      fontSize: '15px',
      color: '#2f7598',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.detailsText = this.add.text(panelX, panelTop + 108, '', {
      fontSize: '13px',
      color: '#35586f',
      align: 'center',
      lineSpacing: 1,
      wordWrap: { width: panelWidth - 112, useAdvancedWrap: true },
    }).setOrigin(0.5, 0);

    createTextButton(this, panelX - 96, panelBottom - 48, 'Start Run', () => {
      playUiBlip(this);
      startNewRun();
      this.scene.start('GameScene', { levelIndex: 0 });
    }, { width: 180, fontSize: '18px' });

    this.detailsToggleButton = createTextButton(this, panelX + 96, panelBottom - 48, 'Controls', () => {
      playUiBlip(this);
      this.toggleControls();
    }, { width: 180, fontSize: '18px' });

    this.add.text(panelX, GAME_HEIGHT - 26, 'ENTER starts the run. C switches info and controls.', {
      fontSize: '16px',
      color: '#21445d',
      fontStyle: 'bold',
    }).setOrigin(0.5, 1);

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

    this.updateDetailsPanel();

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
    this.showingControls = !this.showingControls;
    this.updateDetailsPanel();
  }

  updateDetailsPanel() {
    if (this.showingControls) {
      this.detailsTitle.setText('Controls');
      this.detailsText.setText([
        'Move: WASD or Arrow Keys',
        'Jump: SPACE',
        'Shoot: F',
        'Roll: SHIFT',
        'Pause: ESC',
      ].join('\n'));
      this.detailsToggleButton.text.setText('Info');
      return;
    }

    this.detailsTitle.setText('Game Info');
    this.detailsText.setText([
      'Three colorful stages.',
      'Survive with 3 lives.',
      'Chain quick defeats for combo score.',
      'Reach each flag to go deeper.',
    ].join('\n'));
    this.detailsToggleButton.text.setText('Controls');
  }
}

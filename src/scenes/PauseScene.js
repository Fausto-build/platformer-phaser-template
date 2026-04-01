import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';
import { createPanel, createTextButton } from '../utils/ui.js';
import { playUiBlip } from '../systems/audioManager.js';

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x02070c, 0.62);
    createPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 360, 220);

    this.add.text(GAME_WIDTH / 2, 146, 'Paused', {
      fontSize: '42px',
      color: '#f8fbff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const resume = () => {
      playUiBlip(this);
      this.scene.resume('GameScene');
      this.scene.resume('UIScene');
      this.scene.stop();
    };

    const quit = () => {
      playUiBlip(this);
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('MainMenuScene');
    };

    createTextButton(this, GAME_WIDTH / 2, 228, 'Resume', resume);
    createTextButton(this, GAME_WIDTH / 2, 288, 'Quit To Menu', quit, { width: 250 });

    this.handleResume = resume;
    this.input.keyboard.once('keydown-ESC', this.handleResume);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard.off('keydown-ESC', this.handleResume);
    });
  }
}

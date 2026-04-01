import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';
import { LEVELS } from '../data/levels.js';
import { getRunState, startNewRun } from '../state/runState.js';
import { formatDuration, formatScore } from '../utils/formatters.js';
import { createPanel, createTextButton } from '../utils/ui.js';
import { playUiBlip } from '../systems/audioManager.js';

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  create() {
    const run = getRunState();

    this.cameras.main.setBackgroundColor('#b9ebff');
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_grasslands')
      .setDisplaySize(GAME_WIDTH + 80, GAME_HEIGHT + 20);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xfffbe4, 0.34)
      .setOrigin(0.5);
    createPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 560, 340);

    this.add.text(GAME_WIDTH / 2, 88, 'Victory', {
      fontSize: '50px',
      color: '#3aa56b',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 170, [
      `Final Score: ${formatScore(run.score)}`,
      `Total Defeats: ${run.totalDefeats}`,
      `Levels Cleared: ${run.levelResults.filter(Boolean).length}/${LEVELS.length}`,
      `Total Time: ${formatDuration(run.totalTimeMs)}`,
    ].join('\n'), {
      fontSize: '22px',
      color: '#29465e',
      align: 'center',
      lineSpacing: 12,
    }).setOrigin(0.5);

    createTextButton(this, GAME_WIDTH / 2, 336, 'Play Again', () => {
      playUiBlip(this);
      startNewRun();
      this.scene.start('GameScene', { levelIndex: 0 });
    });

    createTextButton(this, GAME_WIDTH / 2, 392, 'Main Menu', () => {
      playUiBlip(this);
      this.scene.start('MainMenuScene');
    });
  }
}

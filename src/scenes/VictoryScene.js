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
    const panelWidth = 560;
    const panelHeight = 340;
    const panelX = GAME_WIDTH / 2;
    const panelY = GAME_HEIGHT / 2;
    const panelTop = panelY - (panelHeight / 2);
    const panelBottom = panelY + (panelHeight / 2);

    this.cameras.main.setBackgroundColor('#b9ebff');
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_grasslands')
      .setDisplaySize(GAME_WIDTH + 80, GAME_HEIGHT + 20);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xfffbe4, 0.34)
      .setOrigin(0.5);
    createPanel(this, panelX, panelY, panelWidth, panelHeight);

    const titleText = this.add.text(panelX, panelTop + 16, 'Victory', {
      fontSize: '48px',
      color: '#3aa56b',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.add.text(panelX, titleText.y + titleText.height + 20, [
      `Final Score: ${formatScore(run.score)}`,
      `Total Defeats: ${run.totalDefeats}`,
      `Levels Cleared: ${run.levelResults.filter(Boolean).length}/${LEVELS.length}`,
      `Total Time: ${formatDuration(run.totalTimeMs)}`,
    ].join('\n'), {
      fontSize: '22px',
      color: '#29465e',
      align: 'center',
      lineSpacing: 10,
    }).setOrigin(0.5, 0);

    createTextButton(this, panelX, panelBottom - 78, 'Play Again', () => {
      playUiBlip(this);
      startNewRun();
      this.scene.start('GameScene', { levelIndex: 0 });
    });

    createTextButton(this, panelX, panelBottom - 24, 'Main Menu', () => {
      playUiBlip(this);
      this.scene.start('MainMenuScene');
    });
  }
}

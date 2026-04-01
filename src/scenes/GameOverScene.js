import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';
import { LEVELS } from '../data/levels.js';
import { getRunState, startNewRun } from '../state/runState.js';
import { formatDuration, formatScore } from '../utils/formatters.js';
import { createPanel, createTextButton } from '../utils/ui.js';
import { playUiBlip } from '../systems/audioManager.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.finalTimeMs = data.finalTimeMs ?? null;
  }

  create() {
    const run = getRunState();
    const panelWidth = 520;
    const panelHeight = 320;
    const panelX = GAME_WIDTH / 2;
    const panelY = GAME_HEIGHT / 2;
    const panelTop = panelY - (panelHeight / 2);
    const panelBottom = panelY + (panelHeight / 2);

    this.cameras.main.setBackgroundColor('#9cc8ea');
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_castle')
      .setDisplaySize(GAME_WIDTH + 80, GAME_HEIGHT + 20);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xfff1e7, 0.4)
      .setOrigin(0.5);
    createPanel(this, panelX, panelY, panelWidth, panelHeight);

    const titleText = this.add.text(panelX, panelTop + 14, 'Game Over', {
      fontSize: '46px',
      color: '#d86d5b',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.add.text(panelX, titleText.y + titleText.height + 18, [
      `Final Score: ${formatScore(run.score)}`,
      `Total Defeats: ${run.totalDefeats}`,
      `Levels Cleared: ${run.levelResults.filter(Boolean).length}/${LEVELS.length}`,
      `Survival Time: ${formatDuration(this.finalTimeMs ?? run.totalTimeMs)}`,
    ].join('\n'), {
      fontSize: '22px',
      color: '#29465e',
      align: 'center',
      lineSpacing: 10,
    }).setOrigin(0.5, 0);

    createTextButton(this, panelX, panelBottom - 78, 'Restart Run', () => {
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

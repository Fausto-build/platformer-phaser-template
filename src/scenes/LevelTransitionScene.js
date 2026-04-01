import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';
import { LEVELS } from '../data/levels.js';
import { formatDuration, formatScore } from '../utils/formatters.js';
import { createPanel, createTextButton } from '../utils/ui.js';
import { playUiBlip } from '../systems/audioManager.js';

export default class LevelTransitionScene extends Phaser.Scene {
  constructor() {
    super('LevelTransitionScene');
  }

  init(data) {
    this.result = data.result;
    this.nextLevelIndex = data.nextLevelIndex;
  }

  create() {
    const canContinue = Number.isInteger(this.nextLevelIndex);
    const levelTheme = LEVELS[this.result.levelIndex]?.theme;

    this.cameras.main.setBackgroundColor('#b4e6ff');
    this.add.image(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      levelTheme?.background ?? 'bg_grasslands'
    ).setDisplaySize(GAME_WIDTH + 80, GAME_HEIGHT + 20);

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xf3fbff, 0.42)
      .setOrigin(0.5);

    createPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 500, 300);

    this.add.text(GAME_WIDTH / 2, 104, `Level ${this.result.levelNumber} Clear`, {
      fontSize: '36px',
      color: '#2f9d68',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 154, this.result.levelName, {
      fontSize: '22px',
      color: '#29465e',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 214, [
      `Defeats: ${this.result.defeats}`,
      `Time: ${formatDuration(this.result.timeMs)}`,
      `Time Bonus: ${formatScore(this.result.timeBonus)}`,
      `Score: ${formatScore(this.result.totalScore)}`,
    ].join('\n'), {
      fontSize: '20px',
      color: '#35586f',
      align: 'center',
      lineSpacing: 12,
    }).setOrigin(0.5);

    const buttonLabel = canContinue ? 'Continue' : 'View Victory';
    const advance = () => {
      playUiBlip(this);
      if (canContinue) {
        this.scene.start('GameScene', { levelIndex: this.nextLevelIndex });
      } else {
        this.scene.start('VictoryScene');
      }
    };

    createTextButton(this, GAME_WIDTH / 2, 372, buttonLabel, advance);
    this.handleAdvance = advance;
    this.input.keyboard.once('keydown-ENTER', this.handleAdvance);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard.off('keydown-ENTER', this.handleAdvance);
    });
  }
}

import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // --- Loading bar ---
    const { width, height } = this.cameras.main;
    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 15, 320, 30);

    const loadingText = this.add.text(width / 2, height / 2 - 30, 'Loading...', {
      fontSize: '16px',
      fill: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 10, 300 * value, 20);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // --- Player sprites (Kenney p1) ---
    const playerPath = 'assets/kenney/player';
    this.load.image('p1_stand', `${playerPath}/p1_stand.png`);
    this.load.image('p1_duck', `${playerPath}/p1_duck.png`);
    this.load.image('p1_jump', `${playerPath}/p1_jump.png`);
    this.load.image('p1_hurt', `${playerPath}/p1_hurt.png`);
    this.load.image('p1_front', `${playerPath}/p1_front.png`);

    for (let i = 1; i <= 11; i++) {
      const padded = String(i).padStart(2, '0');
      this.load.image(`p1_walk_${padded}`, `${playerPath}/walk/p1_walk${padded}.png`);
    }

    // --- Enemy sprites ---
    const enemyPath = 'assets/kenney/enemies';

    // Slime
    this.load.image('slime', `${enemyPath}/slime.png`);
    this.load.image('slime_walk', `${enemyPath}/slime_walk.png`);
    this.load.image('slime_hit', `${enemyPath}/slime_hit.png`);
    this.load.image('slime_dead', `${enemyPath}/slime_dead.png`);
    this.load.image('slime_squashed', `${enemyPath}/slime_squashed.png`);

    // Spider
    this.load.image('spider', `${enemyPath}/spider.png`);
    this.load.image('spider_walk1', `${enemyPath}/spider_walk1.png`);
    this.load.image('spider_walk2', `${enemyPath}/spider_walk2.png`);
    this.load.image('spider_hit', `${enemyPath}/spider_hit.png`);
    this.load.image('spider_dead', `${enemyPath}/spider_dead.png`);

    // Mouse
    this.load.image('mouse', `${enemyPath}/mouse.png`);
    this.load.image('mouse_walk', `${enemyPath}/mouse_walk.png`);
    this.load.image('mouse_hit', `${enemyPath}/mouse_hit.png`);
    this.load.image('mouse_dead', `${enemyPath}/mouse_dead.png`);

    // --- Tile sprites ---
    const tilePath = 'assets/kenney/tiles';
    const tileNames = [
      'grassMid', 'grassCenter', 'grassLeft', 'grassRight',
      'grassHalfLeft', 'grassHalfMid', 'grassHalfRight',
      'dirtCenter',
      'stoneMid', 'stoneCenter', 'stoneLeft', 'stoneRight',
      'stoneHalfLeft', 'stoneHalfMid', 'stoneHalfRight',
      'sandMid', 'sandCenter', 'sandLeft', 'sandRight',
      'sandHalfLeft', 'sandHalfMid', 'sandHalfRight',
      'brickWall', 'stoneWall',
      'box', 'fence', 'sign', 'signExit',
    ];
    for (const name of tileNames) {
      this.load.image(name, `${tilePath}/${name}.png`);
    }

    // --- Items / effects ---
    const itemPath = 'assets/kenney/items';
    const itemNames = [
      'star', 'fireball', 'flagGreen', 'flagGreen2',
      'coinGold', 'coinSilver',
      'particleBrick1a', 'particleBrick1b', 'particleBrick2a', 'particleBrick2b',
      'cloud1', 'cloud2', 'cloud3',
      'bush', 'plant', 'cactus', 'rock', 'spikes',
    ];
    for (const name of itemNames) {
      this.load.image(name, `${itemPath}/${name}.png`);
    }

    // --- HUD ---
    const hudPath = 'assets/kenney/hud';
    this.load.image('hud_heartFull', `${hudPath}/hud_heartFull.png`);
    this.load.image('hud_heartHalf', `${hudPath}/hud_heartHalf.png`);
    this.load.image('hud_heartEmpty', `${hudPath}/hud_heartEmpty.png`);
    this.load.image('hud_p1', `${hudPath}/hud_p1.png`);

    // --- Backgrounds ---
    const bgPath = 'assets/kenney/backgrounds';
    this.load.image('bg_grasslands', `${bgPath}/bg_grasslands.png`);
    this.load.image('bg_castle', `${bgPath}/bg_castle.png`);
    this.load.image('bg_desert', `${bgPath}/bg_desert.png`);
  }

  create() {
    if (!this.textures.exists('pixel')) {
      const gfx = this.add.graphics();
      gfx.fillStyle(0xffffff, 1);
      gfx.fillRect(0, 0, 1, 1);
      gfx.generateTexture('pixel', 1, 1);
      gfx.destroy();
    }

    this.scene.start('MainMenuScene');
  }
}

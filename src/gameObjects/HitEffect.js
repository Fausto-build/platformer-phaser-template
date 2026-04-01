export default class HitEffect {
  constructor(scene) {
    this.scene = scene;

    this.hitEmitter = scene.add.particles(0, 0, 'star', {
      speed: { min: 80, max: 180 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xffff00, 0xffffff, 0xffdd44],
      lifespan: { min: 200, max: 400 },
      gravityY: 200,
      emitting: false,
    });

    this.defeatEmitter = scene.add.particles(0, 0, 'star', {
      speed: { min: 100, max: 240 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xffff00, 0xffffff],
      lifespan: { min: 300, max: 500 },
      gravityY: 250,
      emitting: false,
    });

    const brickTextures = ['particleBrick1a', 'particleBrick1b', 'particleBrick2a', 'particleBrick2b'];
    this.brickEmitters = brickTextures.map((tex) =>
      scene.add.particles(0, 0, tex, {
        speed: { min: 60, max: 200 },
        scale: { start: 0.5, end: 0.1 },
        alpha: { start: 1, end: 0 },
        lifespan: { min: 400, max: 700 },
        gravityY: 300,
        angle: { min: 200, max: 340 },
        emitting: false,
      })
    );
  }

  playHit(x, y) {
    this.hitEmitter.explode(5, x, y);
  }

  playDefeat(x, y) {
    this.defeatEmitter.explode(4, x, y);
    for (const emitter of this.brickEmitters) {
      emitter.explode(1, x, y);
    }
  }
}

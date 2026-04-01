import Phaser from 'phaser';

const MUSIC_PATTERNS = [
  [220, 330, 392, 330, 262, 330, 392, 494],
  [196, 294, 370, 294, 247, 294, 370, 440],
  [175, 262, 330, 262, 220, 262, 330, 392],
];

function getContext(scene) {
  return scene.sound?.context ?? null;
}

function safeResume(scene) {
  const context = getContext(scene);
  if (context && context.state === 'suspended') {
    context.resume().catch(() => {});
  }
  return context;
}

function playTone(scene, frequency, durationMs, options = {}) {
  const context = safeResume(scene);
  if (!context) return;

  const now = context.currentTime + (options.delayMs ?? 0) / 1000;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const durationSeconds = durationMs / 1000;
  const attack = options.attack ?? 0.01;
  const release = options.release ?? Math.min(0.12, durationSeconds * 0.6);

  oscillator.type = options.type ?? 'square';
  oscillator.frequency.setValueAtTime(frequency, now);

  if (options.slideTo) {
    oscillator.frequency.linearRampToValueAtTime(options.slideTo, now + durationSeconds);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(options.volume ?? 0.035, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds + release);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + durationSeconds + release + 0.02);
}

export function playUiBlip(scene) {
  playTone(scene, 660, 80, { type: 'sine', volume: 0.025, slideTo: 760 });
}

export function playJumpSfx(scene) {
  playTone(scene, 430, 120, { type: 'square', volume: 0.035, slideTo: 620 });
}

export function playShootSfx(scene) {
  playTone(scene, 980, 60, { type: 'sawtooth', volume: 0.03, slideTo: 220, release: 0.05 });
}

export function playHitSfx(scene) {
  playTone(scene, 180, 180, { type: 'triangle', volume: 0.04, slideTo: 90, release: 0.08 });
}

export function playEnemyDeathSfx(scene) {
  playTone(scene, 360, 140, { type: 'triangle', volume: 0.03, slideTo: 620, release: 0.06 });
  playTone(scene, 520, 180, {
    delayMs: 35,
    type: 'square',
    volume: 0.018,
    slideTo: 860,
    release: 0.08,
  });
}

export function playLandSfx(scene) {
  playTone(scene, 150, 70, { type: 'triangle', volume: 0.018, slideTo: 95, release: 0.04 });
}

export function startMusicLoop(scene, patternIndex = 0) {
  const pattern = MUSIC_PATTERNS[patternIndex % MUSIC_PATTERNS.length];
  let noteIndex = 0;

  const event = scene.time.addEvent({
    delay: 220,
    loop: true,
    callback: () => {
      const note = pattern[noteIndex % pattern.length];
      playTone(scene, note, 150, { type: 'triangle', volume: 0.012, release: 0.08 });
      if (noteIndex % 4 === 0) {
        playTone(scene, note / 2, 200, { type: 'sine', volume: 0.008, release: 0.1 });
      }
      noteIndex += 1;
    },
  });

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    event.destroy();
  });

  return event;
}

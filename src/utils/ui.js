export function createPanel(scene, x, y, width, height, alpha = 0.92) {
  const panel = scene.add.rectangle(x, y, width, height, 0xfffbef, alpha);
  panel.setStrokeStyle(3, 0x6bc5ef, 0.95);
  return panel;
}

export function createTextButton(scene, x, y, label, onClick, options = {}) {
  const width = options.width ?? 220;
  const height = options.height ?? 46;
  const background = scene.add.rectangle(x, y, width, height, 0x5fb7e3, 0.98);
  background.setStrokeStyle(2, 0xeefcff, 0.95);
  background.setInteractive({ useHandCursor: true });

  const text = scene.add.text(x, y, label, {
    fontSize: options.fontSize ?? '20px',
    color: '#13314a',
    fontStyle: 'bold',
  }).setOrigin(0.5);
  text.setShadow(0, 1, '#eefcff', 2, false, true);

  const setHovered = (hovered) => {
    background.setFillStyle(hovered ? 0x7ad4f4 : 0x5fb7e3, 0.98);
    text.setScale(hovered ? 1.03 : 1);
  };

  background.on('pointerover', () => setHovered(true));
  background.on('pointerout', () => setHovered(false));
  background.on('pointerdown', () => {
    setHovered(true);
    onClick();
  });

  return { background, text };
}

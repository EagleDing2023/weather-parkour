// All drawing lives here. Game logic only describes what exists.
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  return function render(world) {
    ctx.fillStyle = '#7ec8f2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Camera: shift the world so the player stays centred.
    const p = world.player;
    const camX = p.x + p.w / 2 - canvas.width / 2;
    const camY = p.y + p.h / 2 - canvas.height / 2;
    ctx.save();
    ctx.translate(-Math.round(camX), -Math.round(camY));

    ctx.fillStyle = '#3b5b3a';
    for (const pl of world.platforms) ctx.fillRect(pl.x, pl.y, pl.w, pl.h);

    const t = world.treasureBox;
    ctx.fillStyle = world.opened ? '#8a6b1e' : '#e0b030';
    ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.fillStyle = '#5a3d0a';
    ctx.fillRect(t.x, t.y + t.h * 0.4, t.w, 4); // lid line

    ctx.fillStyle = '#d6402b';
    // Crouching draws shorter, anchored at the feet. Visual only.
    const h = p.crouching ? p.h * 0.7 : p.h;
    ctx.fillRect(p.x, p.y + p.h - h, p.w, h);
    ctx.restore();

    // HUD (screen space)
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(world.elapsed.toFixed(2) + 's', 16, 30);
    if (!world.opened && world.touchingTreasure()) {
      ctx.textAlign = 'center';
      ctx.fillText('Press E or click to open', canvas.width / 2, 60);
      ctx.textAlign = 'start';
    }
  };
}

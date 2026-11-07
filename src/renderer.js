// All drawing lives here. Game logic only describes what exists.
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  return function render(world) {
    ctx.fillStyle = '#7ec8f2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#3b5b3a';
    for (const pl of world.platforms) ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
    const p = world.player;
    ctx.fillStyle = '#d6402b';
    // Crouching draws shorter, anchored at the feet. Visual only.
    const h = p.crouching ? p.h * 0.7 : p.h;
    ctx.fillRect(p.x, p.y + p.h - h, p.w, h);
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(world.elapsed.toFixed(2) + 's', 16, 30);
  };
}

// Turns keyboard events into a plain { left, right, jump, crouch } object.
const KEYS = {
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  jump: ['KeyW', 'ArrowUp'],
  crouch: ['KeyS', 'ArrowDown'],
};

export function createInput() {
  const down = new Set();
  addEventListener('keydown', (e) => {
    // Typing in the menu (search box, dropdown) must not move the player.
    if (e.target instanceof Element && e.target.closest('input, select, textarea')) return;
    down.add(e.code);
    if (e.code.startsWith('Arrow')) e.preventDefault(); // stop page scrolling
  });
  addEventListener('keyup', (e) => down.delete(e.code));
  addEventListener('blur', () => down.clear()); // avoid stuck keys
  return () => Object.fromEntries(
    Object.entries(KEYS).map(([k, codes]) => [k, codes.some((c) => down.has(c))]),
  );
}

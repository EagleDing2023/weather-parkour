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
    down.add(e.code);
    if (e.code.startsWith('Arrow')) e.preventDefault(); // stop page scrolling
  });
  addEventListener('keyup', (e) => down.delete(e.code));
  addEventListener('blur', () => down.clear()); // avoid stuck keys
  return () => Object.fromEntries(
    Object.entries(KEYS).map(([k, codes]) => [k, codes.some((c) => down.has(c))]),
  );
}

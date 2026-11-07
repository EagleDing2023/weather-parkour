// Turns keyboard events into a plain { left, right, jump, crouch } object.
export const KEYS = {
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  jump: ['KeyW', 'ArrowUp', 'Space'],
  crouch: ['KeyS', 'ArrowDown', 'ShiftLeft', 'ShiftRight'],
};

export function createInput() {
  const down = new Set();
  addEventListener('keydown', (e) => {
    // Typing in the menu (search box, dropdown) must not move the player.
    if (e.target instanceof Element && e.target.closest('input, select, textarea')) return;
    down.add(e.code);
    // Stop the page scrolling on arrows and Space, but leave Space alone inside the
    // menu and results screens, where it should press the focused button.
    const inOverlay = e.target instanceof Element && e.target.closest('#menu-screen, #results');
    if (e.code.startsWith('Arrow') || (e.code === 'Space' && !inOverlay)) e.preventDefault();
  });
  addEventListener('keyup', (e) => down.delete(e.code));
  addEventListener('blur', () => down.clear()); // avoid stuck keys
  return () => Object.fromEntries(
    Object.entries(KEYS).map(([k, codes]) => [k, codes.some((c) => down.has(c))]),
  );
}

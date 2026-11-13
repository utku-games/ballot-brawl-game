/**
 * Keyboard and gamepad navigation for menus: moves focus between the visible buttons of the top screen.
 * Left and up go to the previous button, right and down to the next, wrapping around; confirm clicks the focused one.
 * Mouse and touch users never need it, since every control is an ordinary button.
 */

const BUTTON_SELECTOR = '.menu-btn:not(:disabled)';

function buttons(root: HTMLElement): HTMLButtonElement[] {
  return [...root.querySelectorAll<HTMLButtonElement>(BUTTON_SELECTOR)].filter((b) => b.offsetParent !== null);
}

export function moveFocus(root: HTMLElement, step: number): void {
  const list = buttons(root);
  if (list.length === 0) return;
  const index = list.indexOf(document.activeElement as HTMLButtonElement);
  const next = index < 0 ? 0 : (index + step + list.length) % list.length;
  list[next].focus();
  list[next].scrollIntoView({ block: 'nearest' });
}

export function activateFocus(root: HTMLElement): void {
  const focused = document.activeElement;
  if (focused instanceof HTMLButtonElement && root.contains(focused)) focused.click();
  else buttons(root)[0]?.focus();
}

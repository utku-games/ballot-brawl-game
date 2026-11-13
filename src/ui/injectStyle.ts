/**
 * Adds a named stylesheet to the document head once, however many screens ask for it.
 * Each UI module keeps its CSS next to its code and calls this on construction.
 * The id makes repeated calls free and keeps hot reloads from stacking duplicates.
 */

const PREFIX = 'style-';

export function injectStyle(name: string, css: string): void {
  const id = `${PREFIX}${name}`;
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

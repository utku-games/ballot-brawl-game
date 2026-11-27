/**
 * Shows the right controls during a match: the on-screen touch buttons when touch is in use, otherwise a small legend of Player 1's keys or gamepad buttons in the bottom-left corner, clear of the power meter.
 * The device comes from the player's Controls setting, and for Auto from the device last used, so it can switch mid-match when a player picks up a pad or taps the screen.
 * Thin DOM layer; the rules live in input/controlScheme.ts.
 */
import { CONTROL_LEGENDS, InputDevice, resolveDevice, type ControlScheme } from '../input/controlScheme';
import { injectStyle } from './injectStyle';

const LEGEND_CSS = `
.controls-legend { position: fixed; left: max(14px, env(safe-area-inset-left)); bottom: max(12px, env(safe-area-inset-bottom));
  padding: 6px 14px; border-radius: 12px; background: rgba(10,12,20,0.55); color: #f2efe6; font: 600 13px/1.3 system-ui, sans-serif;
  letter-spacing: 0.02em; pointer-events: none; white-space: nowrap; display: none; }
.controls-legend.on { display: block; }
@media (max-width: 760px) { .controls-legend { font-size: 11px; white-space: normal; max-width: 38vw; } }
`;

export class ControlsPresenter {
  private readonly legend: HTMLElement;
  private inMatch = false;
  private shown: InputDevice | null = null;

  constructor(parent: HTMLElement, private readonly touchRoot: HTMLElement | null, private readonly coarsePointer: boolean) {
    injectStyle('controls-legend', LEGEND_CSS);
    this.legend = document.createElement('div');
    this.legend.className = 'controls-legend';
    parent.appendChild(this.legend);
    this.hideAll();
  }

  /** A match started or ended; outside matches neither the buttons nor the legend show. */
  setInMatch(inMatch: boolean): void {
    this.inMatch = inMatch;
    this.shown = null;
    if (!inMatch) this.hideAll();
  }

  /** Call every frame with the setting and the last device used; touches the DOM only when the device changes. */
  update(scheme: ControlScheme, lastUsed: InputDevice | null): void {
    if (!this.inMatch) return;
    const device = resolveDevice(scheme, this.coarsePointer, lastUsed);
    if (device === this.shown) return;
    this.shown = device;
    if (this.touchRoot) this.touchRoot.style.display = device === InputDevice.Touch ? '' : 'none';
    const text = CONTROL_LEGENDS[device];
    this.legend.textContent = text ?? '';
    this.legend.classList.toggle('on', text !== null);
  }

  private hideAll(): void {
    if (this.touchRoot) this.touchRoot.style.display = 'none';
    this.legend.classList.remove('on');
  }
}

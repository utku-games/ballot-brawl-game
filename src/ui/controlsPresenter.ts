/**
 * Shows the right controls during a match: the on-screen touch buttons when touch is in use, otherwise a small legend of Player 1's keys or gamepad buttons, centred just above the power meter (measured, so it never overlaps it on any screen).
 * The device comes from the player's Controls setting, and for Auto from the device last used, so it can switch mid-match when a player picks up a pad or taps the screen.
 * Thin DOM layer; the rules live in input/controlScheme.ts.
 */
import { CONTROL_LEGENDS, InputDevice, resolveDevice, type ControlScheme } from '../input/controlScheme';
import { injectStyle } from './injectStyle';

const LEGEND_CSS = `
.controls-legend { position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(max(10px, env(safe-area-inset-bottom)) + 56px);
  max-width: 92vw; width: max-content; padding: 5px 12px; border-radius: 12px; background: rgba(10,12,20,0.55); color: #f2efe6;
  font: 600 13px/1.35 system-ui, sans-serif; letter-spacing: 0.02em; text-align: center; pointer-events: none; display: none; }
.controls-legend.on { display: block; }
@media (max-width: 760px), (max-height: 500px) { .controls-legend { font-size: 11px; } }
`;

/** The HUD's power meter block (meter, guard and the finisher-ready cue); the legend sits just above it. */
const POWER_SELECTOR = '.hud-power';
/** Gap between the legend and the power meter block, pixels. */
const LEGEND_GAP = 6;

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
    window.addEventListener('resize', () => this.placeLegend());
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
    this.placeLegend();
  }

  /** Moves the legend just above the measured power meter block; keeps the CSS position when the HUD is not there yet. */
  private placeLegend(): void {
    const power = document.querySelector(POWER_SELECTOR);
    if (!this.legend.classList.contains('on') || !power) return;
    const top = power.getBoundingClientRect().top;
    this.legend.style.bottom = `${Math.max(0, window.innerHeight - top + LEGEND_GAP)}px`;
  }

  private hideAll(): void {
    if (this.touchRoot) this.touchRoot.style.display = 'none';
    this.legend.classList.remove('on');
  }
}

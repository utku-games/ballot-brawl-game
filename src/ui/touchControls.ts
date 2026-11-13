/**
 * On-screen touch controls for phones and tablets: a floating joystick on the left half and big action buttons on the right.
 * Punch, Kick and Finisher register a press per tap; Defend counts while held; Swap and Pause are small extra buttons.
 * The controls produce the same ControlFrame as the keyboard, so the match code does not know a touch screen is used.
 */
import { make } from '@utku/engine';
import { EMPTY_FRAME, type ControlFrame } from '../input/controlFrame';
import { inStickZone, knobOffset, stickVector, type ScreenPoint } from '../input/touchLogic';
import { injectStyle } from './injectStyle';
import { TOUCH_CSS } from './touchStyles';

type Action = 'punch' | 'kick' | 'special' | 'swap' | 'pause';

export class TouchControls {
  readonly root: HTMLElement;
  private readonly stick: HTMLElement;
  private readonly knob: HTMLElement;
  private readonly finisher: HTMLElement;
  private readonly swapButton: HTMLElement;
  private stickId: number | null = null;
  private anchor: ScreenPoint = { x: 0, y: 0 };
  private thumb: ScreenPoint = { x: 0, y: 0 };
  private presses = new Set<Action>();
  private defendTouches = new Set<number>();

  constructor(parent: HTMLElement) {
    injectStyle('touch', TOUCH_CSS);
    this.root = make('div', 'touch', null, parent);
    this.stick = make('div', 'touch-stick', null, this.root);
    this.knob = make('div', 'touch-knob', null, this.stick);
    make('div', 'touch-hint', 'Drag here to move', this.root);
    const pad = make('div', 'touch-pad', null, this.root);
    this.finisher = this.button(pad, 'touch-btn finisher', 'FINISH', 'special');
    this.holdButton(pad, 'touch-btn defend', 'DEFEND');
    this.button(pad, 'touch-btn kick', 'KICK', 'kick');
    this.button(pad, 'touch-btn punch', 'PUNCH', 'punch');
    this.swapButton = this.button(this.root, 'touch-btn touch-small touch-swap', 'SWAP', 'swap');
    this.button(this.root, 'touch-btn touch-small touch-pause', 'II', 'pause');
    this.root.addEventListener('pointerdown', (e) => this.stickDown(e));
    this.root.addEventListener('pointermove', (e) => this.stickMove(e));
    this.root.addEventListener('pointerup', (e) => this.stickUp(e));
    this.root.addEventListener('pointercancel', (e) => this.stickUp(e));
  }

  private button(parent: HTMLElement, cls: string, label: string, action: Action): HTMLElement {
    const el = make('div', cls, label, parent);
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.presses.add(action);
      el.classList.add('down');
    });
    const release = (): void => el.classList.remove('down');
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('pointerleave', release);
    return el;
  }

  private holdButton(parent: HTMLElement, cls: string, label: string): void {
    const el = make('div', cls, label, parent);
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      this.defendTouches.add(e.pointerId);
      el.classList.add('down');
    });
    const release = (e: PointerEvent): void => {
      this.defendTouches.delete(e.pointerId);
      if (this.defendTouches.size === 0) el.classList.remove('down');
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  }

  private stickDown(e: PointerEvent): void {
    if (this.stickId !== null || !inStickZone(e.clientX, window.innerWidth)) return;
    this.stickId = e.pointerId;
    this.root.setPointerCapture(e.pointerId);
    this.anchor = { x: e.clientX, y: e.clientY };
    this.thumb = { ...this.anchor };
    this.stick.style.left = `${e.clientX}px`;
    this.stick.style.top = `${e.clientY}px`;
    this.stick.classList.add('on');
    this.drawKnob();
  }

  private stickMove(e: PointerEvent): void {
    if (e.pointerId !== this.stickId) return;
    this.thumb = { x: e.clientX, y: e.clientY };
    this.drawKnob();
  }

  private stickUp(e: PointerEvent): void {
    if (e.pointerId !== this.stickId) return;
    this.stickId = null;
    this.stick.classList.remove('on');
  }

  private drawKnob(): void {
    const k = knobOffset(this.anchor, this.thumb);
    this.knob.style.transform = `translate(${k.x}px, ${k.y}px)`;
  }

  /** Lights the Finisher button and shows Swap only when there are teammates. */
  setState(finisherReady: boolean, canSwap: boolean): void {
    this.finisher.classList.toggle('ready', finisherReady);
    this.swapButton.style.display = canSwap ? '' : 'none';
  }

  /** Current frame; presses are reported once and then cleared. */
  takeFrame(): ControlFrame {
    const stick = this.stickId === null ? { x: 0, y: 0 } : stickVector(this.anchor, this.thumb);
    const p = this.presses;
    this.presses = new Set();
    return {
      ...EMPTY_FRAME,
      moveX: stick.x,
      moveY: stick.y,
      punch: p.has('punch'),
      kick: p.has('kick'),
      special: p.has('special'),
      swap: p.has('swap'),
      pause: p.has('pause'),
      defend: this.defendTouches.size > 0,
    };
  }

  dispose(): void {
    this.root.remove();
  }
}

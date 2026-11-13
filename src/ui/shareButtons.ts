/**
 * Share buttons for menu screens: one shares a result card with its image, the other shares a challenge link.
 * The result button renders the card image as soon as it appears, so a tap can open the share sheet at once.
 * After each attempt the button shows how it went (shared, link copied or failed) and can be pressed again.
 */
import { prepareCardFile, shareCard, shareChallenge, SHARE_OUTCOME_LABEL, ShareOutcome } from '../share/shareAction';
import type { ShareCard } from '../share/shareCards';
import type { ShareTarget } from '../share/shareLink';
import { button } from './screenKit';

const SHARE_LABEL = 'Share';
const BUSY_LABEL = 'Sharing...';

function wire(b: HTMLButtonElement, idle: string, run: () => Promise<ShareOutcome>): void {
  let busy = false;
  b.addEventListener('click', () => {
    if (busy) return;
    busy = true;
    b.textContent = BUSY_LABEL;
    void run().then((outcome) => {
      busy = false;
      b.textContent = outcome === ShareOutcome.Cancelled ? idle : SHARE_OUTCOME_LABEL[outcome];
    });
  });
}

/** Adds a button that shares card, with its image where the device supports it. */
export function shareResultButton(parent: HTMLElement, card: Readonly<ShareCard>): HTMLButtonElement {
  let file: File | null = null;
  void prepareCardFile(card).then((f) => {
    file = f;
  });
  const b = button(parent, SHARE_LABEL, () => undefined);
  wire(b, SHARE_LABEL, () => shareCard(card, file));
  return b;
}

/** Adds a button labelled label that shares a link opening target, with an invitation text. */
export function shareChallengeButton(parent: HTMLElement, label: string, text: string, target: Readonly<ShareTarget>): HTMLButtonElement {
  const b = button(parent, label, () => undefined, 'small');
  wire(b, label, () => shareChallenge(text, target));
  return b;
}

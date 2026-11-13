/**
 * Shares a result card from the browser: the system share sheet with the card image where the device supports it,
 * the share sheet with text and link otherwise, and on desktops a copied link plus a downloaded card image.
 * Challenge links share only a short invitation and the link, without an image.
 * It is the only module that touches navigator.share, the clipboard and downloads, and it never throws to the caller.
 */
import { cardImage } from './cardImage';
import { GAME_NAME, type ShareCard } from './shareCards';
import { shareUrl, type ShareTarget } from './shareLink';

export enum ShareOutcome {
  Shared = 'shared',
  Copied = 'copied',
  Cancelled = 'cancelled',
  Failed = 'failed',
}

/** Button labels after a share attempt. */
export const SHARE_OUTCOME_LABEL: Readonly<Record<ShareOutcome, string>> = {
  [ShareOutcome.Shared]: 'Shared!',
  [ShareOutcome.Copied]: 'Link copied!',
  [ShareOutcome.Cancelled]: 'Share',
  [ShareOutcome.Failed]: 'Could not share',
};

const CARD_FILE_NAME = 'ballot-brawl-result.png';
const PNG_TYPE = 'image/png';
const ABORT_ERROR = 'AbortError';

/** The game's own address without a query, which share links build on. */
export function gameBaseUrl(): string {
  return `${location.origin}${location.pathname}`;
}

function linkFor(card: Readonly<ShareCard>): string {
  return card.target ? shareUrl(gameBaseUrl(), card.target) : gameBaseUrl();
}

/** Renders card's image ahead of the tap, since share sheets need the call to follow the tap quickly; null on failure. */
export async function prepareCardFile(card: Readonly<ShareCard>): Promise<File | null> {
  try {
    const blob = await cardImage(card, location.host);
    return new File([blob], CARD_FILE_NAME, { type: PNG_TYPE });
  } catch {
    return null;
  }
}

function download(file: File): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = CARD_FILE_NAME;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function viaShareSheet(data: ShareData): Promise<ShareOutcome> {
  try {
    await navigator.share(data);
    return ShareOutcome.Shared;
  } catch (e) {
    return e instanceof DOMException && e.name === ABORT_ERROR ? ShareOutcome.Cancelled : ShareOutcome.Failed;
  }
}

async function viaClipboard(message: string, file: File | null): Promise<ShareOutcome> {
  try {
    await navigator.clipboard.writeText(message);
  } catch {
    return ShareOutcome.Failed;
  }
  if (file) download(file);
  return ShareOutcome.Copied;
}

function canShareFiles(file: File): boolean {
  try {
    return navigator.canShare?.({ files: [file] }) ?? false;
  } catch {
    return false;
  }
}

/** Shares card with its link and its prepared image file (null when not ready) using the best channel the device offers. */
export async function shareCard(card: Readonly<ShareCard>, file: File | null): Promise<ShareOutcome> {
  const url = linkFor(card);
  const message = `${card.text} ${url}`;
  const canShare = typeof navigator.share === 'function';
  if (canShare && file && canShareFiles(file)) {
    return viaShareSheet({ title: GAME_NAME, text: message, files: [file] });
  }
  if (canShare) return viaShareSheet({ title: GAME_NAME, text: card.text, url });
  return viaClipboard(message, file);
}

/** Shares a link that opens target, with a short invitation, for challenge buttons. */
export async function shareChallenge(text: string, target: Readonly<ShareTarget>): Promise<ShareOutcome> {
  const url = shareUrl(gameBaseUrl(), target);
  if (typeof navigator.share === 'function') return viaShareSheet({ title: GAME_NAME, text, url });
  return viaClipboard(`${text} ${url}`, null);
}

/**
 * Paints a share card as a 1200 by 630 PNG: the game name, the fighters' portraits with the winner ringed in gold,
 * the headline and subtitle, and the parody disclaimer.
 * It is a thin DOM adapter over the pure share card and reports a canvas that cannot export through PlatformError.
 * Portraits are the same-origin face images the menus use, so the canvas stays exportable.
 */
import { faceUrl } from '../core/assets';
import { PlatformError } from '../core/errors';
import { fighterById } from '../roster/roster';
import { THEME } from '../ui/theme';
import { GAME_NAME, type ShareCard } from './shareCards';

const WIDTH = 1200;
const HEIGHT = 630;
const PNG_TYPE = 'image/png';
const BACKDROP_TOP = '#2a1f5c';
const PORTRAIT_SIZE = 220;
const PORTRAIT_GAP = 60;
const PORTRAIT_TOP = 140;
const RING_WIDTH = 10;
const LOSER_ALPHA = 0.55;
const NAME_GAP = 36;
const TITLE_Y = 80;
const HEADLINE_Y = 470;
const SUBTITLE_Y = 530;
const FOOTER_Y = 600;
const TEXT_MARGIN = 80;
const TITLE_FONT = `44px ${THEME.font}`;
const HEADLINE_FONT = `52px ${THEME.font}`;
const NAME_FONT = `bold 24px ${THEME.bodyFont}`;
const SUBTITLE_FONT = `bold 32px ${THEME.bodyFont}`;
const FOOTER_FONT = `20px ${THEME.bodyFont}`;
const DISCLAIMER = 'Unofficial parody. Nobody depicted endorses it.';
/** Portraits shrink to fit four across. */
const MAX_ROW_WIDTH = WIDTH - 2 * TEXT_MARGIN;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function paintBackground(ctx: CanvasRenderingContext2D): void {
  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, BACKDROP_TOP);
  grad.addColorStop(1, THEME.backdrop);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function centeredText(ctx: CanvasRenderingContext2D, text: string, y: number, font: string, color: string): void {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, WIDTH / 2, y, WIDTH - 2 * TEXT_MARGIN);
}

function paintPortrait(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, x: number, size: number, winner: boolean, dim: boolean): void {
  const r = size / 2;
  const cx = x + r;
  const cy = PORTRAIT_TOP + r;
  ctx.save();
  ctx.globalAlpha = dim ? LOSER_ALPHA : 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = THEME.panel;
  ctx.fill();
  ctx.clip();
  if (img) ctx.drawImage(img, x, PORTRAIT_TOP, size, size);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = RING_WIDTH;
  ctx.strokeStyle = winner ? THEME.gold : THEME.panelEdge;
  ctx.stroke();
}

async function paintFighters(ctx: CanvasRenderingContext2D, card: Readonly<ShareCard>): Promise<void> {
  const n = card.fighters.length;
  const size = Math.min(PORTRAIT_SIZE, (MAX_ROW_WIDTH - (n - 1) * PORTRAIT_GAP) / n);
  const rowWidth = n * size + (n - 1) * PORTRAIT_GAP;
  const images = await Promise.all(card.fighters.map((id) => loadImage(faceUrl(id))));
  card.fighters.forEach((id, i) => {
    const x = (WIDTH - rowWidth) / 2 + i * (size + PORTRAIT_GAP);
    const winner = card.winnerIds.includes(id);
    paintPortrait(ctx, images[i], x, size, winner, card.winnerIds.length > 0 && !winner);
    ctx.font = NAME_FONT;
    ctx.fillStyle = winner ? THEME.gold : THEME.ink;
    ctx.textAlign = 'center';
    ctx.fillText(fighterById(id).name, x + size / 2, PORTRAIT_TOP + size + NAME_GAP, size + PORTRAIT_GAP);
  });
}

/** Paints card and returns it as a PNG blob; footer is the address shown under the disclaimer. */
export async function cardImage(card: Readonly<ShareCard>, footer: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new PlatformError('2D canvas is not available');
  await document.fonts.ready;
  paintBackground(ctx);
  centeredText(ctx, GAME_NAME.toUpperCase(), TITLE_Y, TITLE_FONT, THEME.gold);
  await paintFighters(ctx, card);
  centeredText(ctx, card.headline, HEADLINE_Y, HEADLINE_FONT, THEME.ink);
  centeredText(ctx, card.subtitle, SUBTITLE_Y, SUBTITLE_FONT, THEME.inkSoft);
  centeredText(ctx, `${DISCLAIMER}  ${footer}`, FOOTER_Y, FOOTER_FONT, THEME.inkSoft);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new PlatformError('Could not export the share card'))), PNG_TYPE);
  });
}

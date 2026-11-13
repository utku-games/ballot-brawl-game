/**
 * Tests for the projectile part lists used by Throw finishers.
 * Every projectile except None must produce valid parts centred on the projectile anchor, and None must be empty.
 * Every thrower in the roster must have a projectile that draws something, and every Brawl item and the anvil draw
 * valid parts.
 */
import { describe, expect, it } from 'vitest';
import { ROSTER } from '../roster/roster';
import { FinisherStyle, Projectile } from '../roster/signatureTypes';
import { Anchor } from './partSpec';
import { projectileParts } from './projectileParts';
import { anvilParts, itemParts } from './extraParts';
import { ItemKind } from '../fight/fightTypes';

/** Projectiles stay within this distance of their centre, meters. */
const MAX_EXTENT = 0.6;

describe('projectileParts', () => {
  it('gives every projectile valid parts on the projectile anchor', () => {
    for (const p of Object.values(Projectile)) {
      const parts = projectileParts(p);
      expect(parts.length > 0, p).toBe(p !== Projectile.None);
      for (const s of parts) {
        expect(s.anchor, p).toBe(Anchor.Projectile);
        expect(s.size.every((v) => v > 0), p).toBe(true);
        expect(s.position.every((v) => Math.abs(v) < MAX_EXTENT), p).toBe(true);
      }
    }
  });

  it('draws something for every thrower in the roster', () => {
    for (const f of ROSTER.filter((x) => x.signature.style === FinisherStyle.Throw)) {
      expect(projectileParts(f.signature.projectile).length, f.id).toBeGreaterThan(0);
    }
  });
});

describe('extraParts', () => {
  it('gives every item and the anvil valid parts on the projectile anchor', () => {
    for (const parts of [...Object.values(ItemKind).map(itemParts), anvilParts()]) {
      expect(parts.length).toBeGreaterThan(0);
      for (const s of parts) {
        expect(s.anchor).toBe(Anchor.Projectile);
        expect(s.size.every((v) => v > 0)).toBe(true);
      }
    }
  });
});

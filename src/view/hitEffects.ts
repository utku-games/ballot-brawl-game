/**
 * Particle bursts for combat feedback built on the engine ParticlePool: sparks on hits, blue flecks on blocks,
 * a golden explosion for finishers and a puff of dust when someone hits the floor.
 * Bursts are described as data so each event kind only names its colour, count, speed and size.
 * Two pools are used: an additive one for glowing sparks and a normal one for dust.
 */
import * as THREE from 'three';
import { ParticlePool } from '@utku/engine';

export enum BurstKind {
  Punch = 'punch',
  Kick = 'kick',
  Block = 'block',
  GuardBreak = 'guardBreak',
  Finisher = 'finisher',
  Dust = 'dust',
}

interface BurstStyle {
  color: number;
  count: number;
  speed: number;
  size: number;
  life: number;
  gravity: number;
  glow: boolean;
}

const STYLES: Readonly<Record<BurstKind, BurstStyle>> = {
  [BurstKind.Punch]: { color: 0xfff1a8, count: 14, speed: 4, size: 0.18, life: 0.3, gravity: 4, glow: true },
  [BurstKind.Kick]: { color: 0xffa040, count: 22, speed: 5.5, size: 0.24, life: 0.4, gravity: 5, glow: true },
  [BurstKind.Block]: { color: 0x6ac8ff, count: 16, speed: 3.5, size: 0.16, life: 0.3, gravity: 0, glow: true },
  [BurstKind.GuardBreak]: { color: 0xc070ff, count: 30, speed: 5, size: 0.22, life: 0.6, gravity: 2, glow: true },
  [BurstKind.Finisher]: { color: 0xffd23a, count: 90, speed: 9, size: 0.35, life: 0.9, gravity: 3, glow: true },
  [BurstKind.Dust]: { color: 0xb8a890, count: 18, speed: 2, size: 0.4, life: 0.7, gravity: -1, glow: false },
};

const GLOW_CAPACITY = 600;
const DUST_CAPACITY = 200;
const DRAG = 2.5;
const SIZE_END_RATIO = 0.2;

export class HitEffects {
  private readonly glow = new ParticlePool(GLOW_CAPACITY, true);
  private readonly dust = new ParticlePool(DUST_CAPACITY, false);
  private readonly color = new THREE.Color();

  constructor(private readonly scene: THREE.Scene) {
    scene.add(this.glow.points, this.dust.points);
  }

  burst(kind: BurstKind, x: number, y: number, z: number): void {
    const style = STYLES[kind];
    const pool = style.glow ? this.glow : this.dust;
    this.color.setHex(style.color);
    for (let i = 0; i < style.count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const lift = Math.random();
      const speed = style.speed * (0.4 + Math.random() * 0.6);
      pool.emit({
        x, y, z,
        vx: Math.cos(angle) * speed * (1 - lift * 0.5),
        vy: lift * speed,
        vz: Math.sin(angle) * speed * (1 - lift * 0.5),
        r: this.color.r, g: this.color.g, b: this.color.b,
        life: style.life * (0.6 + Math.random() * 0.4),
        sizeStart: style.size,
        sizeEnd: style.size * SIZE_END_RATIO,
        alpha: 1,
        gravity: style.gravity,
        drag: DRAG,
      });
    }
  }

  update(dt: number): void {
    this.glow.update(dt);
    this.dust.update(dt);
  }

  dispose(): void {
    this.scene.remove(this.glow.points, this.dust.points);
    this.glow.dispose();
    this.dust.dispose();
  }
}

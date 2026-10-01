import { afterEach, describe, expect, it, vi } from 'vitest';

const { octetsForces } = vi.hoisted(() => ({ octetsForces: { valeur: undefined as Buffer | undefined } }));

vi.mock('node:crypto', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:crypto')>();
  return {
    ...original,
    randomBytes: (taille: number) => octetsForces.valeur ?? original.randomBytes(taille),
  };
});

import { genererIdentifiant } from '../../../server/utils/identifiant.js';

afterEach(() => {
  octetsForces.valeur = undefined;
});

describe('genererIdentifiant', () => {
  it('CA1 — renvoie 32 caractères [a-z0-9]', () => {
    for (let i = 0; i < 200; i++) {
      expect(genererIdentifiant()).toMatch(/^[a-z0-9]{32}$/);
    }
  });

  it('CA1 — deux tirages successifs sont différents', () => {
    const ids = new Set(Array.from({ length: 200 }, () => genererIdentifiant()));
    expect(ids.size).toBe(200);
  });

  it('CA1 — rejette les octets biaisés (>= 252) : ils ne produisent aucun caractère', () => {
    // 64 octets : 32 octets biaisés (255) suivis de 64-32 octets valides (0 => "a").
    const octets = Buffer.alloc(64, 0);
    octets.fill(255, 0, 32);
    octetsForces.valeur = octets;
    expect(genererIdentifiant()).toBe('a'.repeat(32));
  });

  it('CA1 — chaque octet < 252 est converti modulo 36', () => {
    const octets = Buffer.alloc(64, 0);
    for (let i = 0; i < 64; i++) octets[i] = 251 - i; // tous < 252
    octetsForces.valeur = octets;
    const attendu = Array.from({ length: 32 }, (_, i) => 'abcdefghijklmnopqrstuvwxyz0123456789'[(251 - i) % 36]).join('');
    expect(genererIdentifiant()).toBe(attendu);
  });
});

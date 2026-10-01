import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const MESSAGE = 'Service temporairement indisponible. Veuillez réessayer plus tard.';

const { lireMock } = vi.hoisted(() => ({ lireMock: vi.fn() }));

vi.mock('../../../server/data/valkey.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../../server/data/valkey.js')>();
  return { ...original, lire: lireMock };
});

import { buildApp } from '../../../server/api/app.js';
import {
  MemoirePleineError,
  ServiceIndisponibleError,
} from '../../../server/data/valkey.js';

describe('gestion des pannes', () => {
  let ecritures: string[];

  beforeEach(() => {
    ecritures = [];
    const capture = (chunk: unknown) => {
      ecritures.push(String(chunk));
      return true;
    };
    vi.spyOn(process.stdout, 'write').mockImplementation(capture as never);
    vi.spyOn(process.stderr, 'write').mockImplementation(capture as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    lireMock.mockReset();
  });

  it('CA1 — Valkey arrêté : GET /api/sante répond 500 avec le message générique', async () => {
    lireMock.mockRejectedValue(new ServiceIndisponibleError());
    const app = await buildApp({ clientDir: '/inexistant' });
    const reponse = await app.inject({ method: 'GET', url: '/api/sante' });
    expect(reponse.statusCode).toBe(500);
    expect(reponse.json()).toEqual({ erreur: MESSAGE });
    await app.close();
  });

  it('CA1 — MemoirePleineError et erreur inconnue donnent le même 500 générique', async () => {
    const app = await buildApp({ clientDir: '/inexistant' });
    for (const erreur of [new MemoirePleineError(), new Error('secret interne')]) {
      lireMock.mockRejectedValueOnce(erreur);
      const reponse = await app.inject({ method: 'GET', url: '/api/sante' });
      expect(reponse.statusCode).toBe(500);
      expect(reponse.json()).toEqual({ erreur: MESSAGE });
      expect(reponse.body).not.toContain('secret interne');
    }
    await app.close();
  });

  it('CA1 — Valkey joignable : GET /api/sante répond 200', async () => {
    lireMock.mockResolvedValue(null);
    const app = await buildApp({ clientDir: '/inexistant' });
    const reponse = await app.inject({ method: 'GET', url: '/api/sante' });
    expect(reponse.statusCode).toBe(200);
    expect(reponse.json()).toEqual({ statut: 'ok' });
    await app.close();
  });

  it('CA3 — une panne provoquée n’écrit rien sur stdout ni stderr', async () => {
    const app = await buildApp({ clientDir: '/inexistant' });
    for (const erreur of [
      new ServiceIndisponibleError(),
      new MemoirePleineError(),
      new Error('boom'),
    ]) {
      lireMock.mockRejectedValueOnce(erreur);
      const reponse = await app.inject({ method: 'GET', url: '/api/sante' });
      expect(reponse.statusCode).toBe(500);
    }
    await app.close();
    expect(ecritures).toEqual([]);
  });
});

describe('absence de journalisation', () => {
  function fichiers(dossier: string): string[] {
    return readdirSync(dossier).flatMap((nom) => {
      const chemin = join(dossier, nom);
      if (statSync(chemin).isDirectory()) return fichiers(chemin);
      return /\.(ts|tsx)$/.test(nom) ? [chemin] : [];
    });
  }

  const racine = resolve(__dirname, '../../..');
  const sources = ['server', 'shared', 'src'].flatMap((d) => fichiers(join(racine, d)));

  it('CA4 — aucun appel console.* dans server, shared et src', () => {
    expect(sources.length).toBeGreaterThan(0);
    const fautifs = sources.filter((f) => /\bconsole\s*\./.test(readFileSync(f, 'utf8')));
    expect(fautifs).toEqual([]);
  });

  it('CA4 — aucun logger (pino, winston, morgan, bunyan, logger Fastify activé)', () => {
    const motif =
      /from\s+['"](pino|winston|morgan|bunyan|log4js|debug|loglevel|@fastify\/(?:request-logger))['"]|logger\s*:(?!\s*false)|\.log\.(info|warn|error|debug|trace|fatal)\(|\breq\.log\b|\brequest\.log\b/;
    const fautifs = sources.filter((f) => motif.test(readFileSync(f, 'utf8')));
    expect(fautifs).toEqual([]);
  });

  it('CA4 — aucune dépendance de journalisation dans package.json', () => {
    const pkg = JSON.parse(readFileSync(join(racine, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    const deps = Object.keys(pkg.dependencies ?? {});
    expect(deps.filter((d) => /^(pino|winston|morgan|bunyan|log4js|debug)/.test(d))).toEqual([]);
  });
});

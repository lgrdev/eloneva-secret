import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { Redis } from 'iovalkey';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  MemoirePleineError,
  ServiceIndisponibleError,
  ecrireAvecDuree,
  fermerValkey,
  lire,
} from '../../../server/data/valkey.js';

const RACINE = resolve(import.meta.dirname, '../../..');
const CONF = resolve(RACINE, 'valkey.conf');
const PREFIXE = `eloneva-test-${process.pid}`;
const conteneurs: string[] = [];

function portLibre(): Promise<number> {
  return new Promise((ok, ko) => {
    const s = createServer();
    s.once('error', ko);
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address() as { port: number };
      s.close(() => ok(port));
    });
  });
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function attendreValkey(port: number): Promise<void> {
  const limite = Date.now() + 30_000;
  while (Date.now() < limite) {
    const c = new Redis({
      host: '127.0.0.1',
      port,
      lazyConnect: true,
      retryStrategy: () => null,
      connectTimeout: 500,
      maxRetriesPerRequest: 0,
    });
    c.on('error', () => undefined);
    try {
      await c.connect();
      if ((await c.ping()) === 'PONG') {
        c.disconnect();
        return;
      }
    } catch {
      // pas encore prêt
    }
    c.disconnect();
    await pause(300);
  }
  throw new Error('Valkey de test non joignable');
}

async function demarrer(nom: string, argsServeur: string[] = []): Promise<number> {
  const port = await portLibre();
  const nomComplet = `${PREFIXE}-${nom}`;
  conteneurs.push(nomComplet);
  execFileSync('docker', [
    'run', '-d', '--rm', '--name', nomComplet,
    '-p', `127.0.0.1:${port}:6379`,
    '-v', `${CONF}:/etc/valkey.conf:ro`,
    'valkey/valkey', 'valkey-server', '/etc/valkey.conf', ...argsServeur,
  ], { stdio: 'pipe' });
  await attendreValkey(port);
  return port;
}

async function pointerSur(port: number): Promise<void> {
  await fermerValkey();
  process.env['VALKEY_HOST'] = '127.0.0.1';
  process.env['VALKEY_PORT'] = String(port);
}

afterAll(async () => {
  await fermerValkey();
  for (const nom of conteneurs) {
    try {
      execFileSync('docker', ['stop', '-t', '1', nom], { stdio: 'pipe' });
    } catch {
      // déjà arrêté
    }
  }
}, 60_000);

describe('CA1 — durée de vie', () => {
  beforeAll(async () => {
    await pointerSur(await demarrer('ttl'));
  }, 60_000);

  it('CA1 — un enregistrement n’est plus lisible une fois sa durée de vie écoulée', async () => {
    await ecrireAvecDuree('ca1-cle', 'valeur', 1);
    expect(await lire('ca1-cle')).toBe('valeur');
    await pause(1600);
    expect(await lire('ca1-cle')).toBeNull();
  }, 15_000);
});

describe('CA2 — mémoire pleine', () => {
  beforeAll(async () => {
    await pointerSur(await demarrer('oom', ['--maxmemory', '10mb']));
  }, 60_000);

  it('CA2 — écriture refusée avec MemoirePleineError, anciennes données lisibles', async () => {
    await ecrireAvecDuree('ca2-ancien', 'conserve', 3600);
    const gros = 'x'.repeat(200_000);
    let refus: unknown;
    for (let i = 0; i < 200 && refus === undefined; i++) {
      try {
        await ecrireAvecDuree(`ca2-remplissage-${i}`, gros, 3600);
      } catch (e) {
        refus = e;
      }
    }
    expect(refus).toBeInstanceOf(MemoirePleineError);
    expect(await lire('ca2-ancien')).toBe('conserve');
    expect(await lire('ca2-remplissage-0')).toBe(gros);
  }, 60_000);
});

describe('CA3 — Valkey injoignable', () => {
  it('CA3 — lève ServiceIndisponibleError quand aucun serveur n’écoute', async () => {
    await pointerSur(await portLibre());
    await expect(lire('ca3-cle')).rejects.toBeInstanceOf(ServiceIndisponibleError);
    await expect(ecrireAvecDuree('ca3-cle', 'v', 10)).rejects.toBeInstanceOf(ServiceIndisponibleError);
  }, 15_000);

  it('CA3 — lève ServiceIndisponibleError quand Valkey est arrêté en cours de route', async () => {
    const port = await demarrer('arret');
    await pointerSur(port);
    await ecrireAvecDuree('ca3-arret', 'v', 60);
    execFileSync('docker', ['stop', '-t', '1', `${PREFIXE}-arret`], { stdio: 'pipe' });
    await expect(lire('ca3-arret')).rejects.toBeInstanceOf(ServiceIndisponibleError);
  }, 60_000);
});

describe('CA4 — configuration', () => {
  it('CA4 — valkey.conf désactive RDB et AOF et impose noeviction', () => {
    const lignes = readFileSync(CONF, 'utf8')
      .split('\n')
      .map((l) => l.trim().replace(/\s+/g, ' '))
      .filter((l) => l !== '' && !l.startsWith('#'));
    expect(lignes).toContain('save ""');
    expect(lignes).toContain('appendonly no');
    expect(lignes).toContain('maxmemory-policy noeviction');
  });

  it('CA4 — l’instance lancée avec la conf applique ces réglages', async () => {
    const port = await demarrer('conf');
    const c = new Redis({ host: '127.0.0.1', port });
    c.on('error', () => undefined);
    try {
      const lire1 = async (k: string) => ((await c.config('GET', k)) as string[])[1];
      expect(await lire1('save')).toBe('');
      expect(await lire1('appendonly')).toBe('no');
      expect(await lire1('maxmemory-policy')).toBe('noeviction');
    } finally {
      c.disconnect();
    }
  }, 60_000);
});

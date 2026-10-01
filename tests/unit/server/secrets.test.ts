import { execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { Redis } from 'iovalkey';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../../../server/api/app.js';
import { MAX_TIRAGES } from '../../../server/api/secrets.js';
import { fermerValkey } from '../../../server/data/valkey.js';

const MESSAGE_RG7 = 'Service temporairement indisponible. Veuillez réessayer plus tard.';
const RACINE = resolve(import.meta.dirname, '../../..');
const CONF = resolve(RACINE, 'valkey.conf');
const PREFIXE = `eloneva-test-secrets-${process.pid}`;
const conteneurs: string[] = [];
const clients: Redis[] = [];

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

function nouveauClient(port: number): Redis {
  const c = new Redis({
    host: '127.0.0.1',
    port,
    lazyConnect: true,
    retryStrategy: () => null,
    connectTimeout: 500,
    maxRetriesPerRequest: 0,
  });
  c.on('error', () => undefined);
  clients.push(c);
  return c;
}

async function attendreValkey(port: number): Promise<void> {
  const limite = Date.now() + 30_000;
  while (Date.now() < limite) {
    const c = nouveauClient(port);
    try {
      await c.connect();
      if ((await c.ping()) === 'PONG') return;
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
  execFileSync(
    'docker',
    [
      'run', '-d', '--rm', '--name', nomComplet,
      '-p', `127.0.0.1:${port}:6379`,
      '-v', `${CONF}:/etc/valkey.conf:ro`,
      'valkey/valkey', 'valkey-server', '/etc/valkey.conf', ...argsServeur,
    ],
    { stdio: 'pipe' },
  );
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
  for (const c of clients) c.disconnect();
  for (const nom of conteneurs) {
    try {
      execFileSync('docker', ['stop', '-t', '1', nom], { stdio: 'pipe' });
    } catch {
      // déjà arrêté
    }
  }
}, 60_000);

const corps = (o: Record<string, unknown>) => ({
  method: 'POST' as const,
  url: '/api/secrets',
  payload: o,
});

const valide = { type: 'message', duree: '1h', contenu: 'bonjour' };

describe('POST /api/secrets sur un vrai Valkey', () => {
  let direct: Redis;
  let app: FastifyInstance;
  let seq = 0;
  let maintenant: Date;
  let ecritures: string[];

  /** Générateur déterministe unique par test, pour ne pas dépendre du hasard. */
  const idUnique = () => `${String(++seq).padStart(4, '0')}${'z'.repeat(28)}`;

  beforeAll(async () => {
    const port = await demarrer('principal');
    await pointerSur(port);
    direct = nouveauClient(port);
    await direct.connect();
  }, 60_000);

  beforeEach(async () => {
    await direct.flushall();
    maintenant = new Date('2030-01-01T10:00:00.000Z');
    app = await buildApp({
      clientDir: '/inexistant',
      generateurIdentifiant: idUnique,
      maintenant: () => maintenant,
    });
  });

  afterEach(async () => {
    await app.close();
    vi.restoreAllMocks();
  });

  const nbCles = async () => (await direct.keys('secret:*')).length;

  it('CA1 — une création valide renvoie 201, un identifiant de 32 caractères [a-z0-9] et expireLe = heure + durée', async () => {
    const appReelle = await buildApp({ clientDir: '/inexistant', maintenant: () => maintenant });
    const r = await appReelle.inject(corps({ type: 'mot-de-passe', duree: '4h', contenu: 'abc' }));
    await appReelle.close();
    expect(r.statusCode).toBe(201);
    const { identifiant, expireLe } = r.json<{ identifiant: string; expireLe: string }>();
    expect(identifiant).toMatch(/^[a-z0-9]{32}$/);
    expect(expireLe).toBe('2030-01-01T14:00:00.000Z');
    const stocke = JSON.parse((await direct.get(`secret:${identifiant}`)) as string);
    expect(stocke).toEqual({ type: 'mot-de-passe', contenu: 'abc', expireLe });
  });

  it('CA1 — expireLe = heure de création + durée pour chaque durée autorisée', async () => {
    const attendu: Record<string, number> = {
      '1h': 3600, '4h': 14400, '24h': 86400, '7j': 604800, '14j': 1209600,
    };
    for (const [duree, secondes] of Object.entries(attendu)) {
      const r = await app.inject(corps({ ...valide, duree }));
      expect(r.statusCode).toBe(201);
      expect(r.json().expireLe).toBe(new Date(maintenant.getTime() + secondes * 1000).toISOString());
    }
  });

  it('CA2 — l’enregistrement Valkey a un TTL égal à la durée choisie (1 h, 4 h, 24 h, 7 j, 14 j)', async () => {
    const attendu: Record<string, number> = {
      '1h': 3600, '4h': 14400, '24h': 86400, '7j': 604800, '14j': 1209600,
    };
    for (const [duree, secondes] of Object.entries(attendu)) {
      const r = await app.inject(corps({ ...valide, duree }));
      expect(r.statusCode).toBe(201);
      const ttl = await direct.ttl(`secret:${r.json().identifiant}`);
      expect(ttl).toBeGreaterThan(secondes - 5);
      expect(ttl).toBeLessThanOrEqual(secondes);
    }
  });

  it('CA3 — type hors liste, durée hors liste, contenu absent ou vide : 400 et rien stocké', async () => {
    const invalides: Record<string, unknown>[] = [
      { ...valide, type: 'image' },
      { ...valide, duree: '2h' },
      { type: 'message', duree: '1h' },
      { ...valide, contenu: '' },
      { ...valide, contenu: 42 },
      { duree: '1h', contenu: 'x' },
      { type: 'message', contenu: 'x' },
      {},
    ];
    for (const payload of invalides) {
      const r = await app.inject(corps(payload));
      expect(r.statusCode, JSON.stringify(payload)).toBe(400);
    }
    const json = await app.inject({
      method: 'POST', url: '/api/secrets',
      headers: { 'content-type': 'application/json' }, payload: '{pas du json',
    });
    expect(json.statusCode).toBe(400);
    expect(await nbCles()).toBe(0);
  });

  it('CA4 — un contenu de plus de 10 Ko (octets) est refusé en 413 et rien n’est stocké', async () => {
    const r = await app.inject(corps({ ...valide, contenu: 'a'.repeat(10241) }));
    expect(r.statusCode).toBe(413);
    // Mesure en octets : 5121 caractères de 2 octets = 10242 octets
    const multi = await app.inject(corps({ ...valide, contenu: 'é'.repeat(5121) }));
    expect(multi.statusCode).toBe(413);
    // Corps HTTP très volumineux : 413 natif
    const enorme = await app.inject(corps({ ...valide, contenu: 'a'.repeat(200_000) }));
    expect(enorme.statusCode).toBe(413);
    expect(await nbCles()).toBe(0);
  });

  it('CA4 — exactement 10 Ko (10240 octets) est accepté', async () => {
    const r = await app.inject(corps({ ...valide, contenu: 'a'.repeat(10240) }));
    expect(r.statusCode).toBe(201);
    const r2 = await app.inject(corps({ ...valide, contenu: 'é'.repeat(5120) }));
    expect(r2.statusCode).toBe(201);
  });

  it('CA5 — le contenu est stocké tel quel, y compris un lien http://', async () => {
    const contenu = ' http://exemple.test/a?b=c  \n{"x":1}<script>é😀';
    const r = await app.inject(corps({ type: 'lien', duree: '24h', contenu }));
    expect(r.statusCode).toBe(201);
    const stocke = JSON.parse((await direct.get(`secret:${r.json().identifiant}`)) as string);
    expect(stocke.contenu).toBe(contenu);
    expect(stocke.type).toBe('lien');
  });

  it('CA6 — en cas de collision, un nouvel identifiant est tiré et le secret existant n’est pas écrasé', async () => {
    const existant = JSON.stringify({ type: 'message', contenu: 'ORIGINAL', expireLe: '2031-01-01T00:00:00.000Z' });
    const a = 'a'.repeat(32);
    const b = 'b'.repeat(32);
    await direct.set(`secret:${a}`, existant, 'EX', 3600);
    const sequence = [a, a, b];
    const appCollision = await buildApp({
      clientDir: '/inexistant',
      generateurIdentifiant: () => sequence.shift() as string,
      maintenant: () => maintenant,
    });
    const r = await appCollision.inject(corps({ ...valide, contenu: 'NOUVEAU' }));
    await appCollision.close();
    expect(r.statusCode).toBe(201);
    expect(r.json().identifiant).toBe(b);
    expect(await direct.get(`secret:${a}`)).toBe(existant);
    expect(JSON.parse((await direct.get(`secret:${b}`)) as string).contenu).toBe('NOUVEAU');
  });

  it('CA6 — collisions permanentes : MAX_TIRAGES tirages puis 500 générique, secret existant intact', async () => {
    const a = 'c'.repeat(32);
    const existant = JSON.stringify({ type: 'message', contenu: 'ORIGINAL', expireLe: '2031-01-01T00:00:00.000Z' });
    await direct.set(`secret:${a}`, existant, 'EX', 3600);
    const generateur = vi.fn(() => a);
    const appCollision = await buildApp({
      clientDir: '/inexistant',
      generateurIdentifiant: generateur,
    });
    const r = await appCollision.inject(corps(valide));
    await appCollision.close();
    expect(generateur).toHaveBeenCalledTimes(MAX_TIRAGES);
    expect(r.statusCode).toBe(500);
    expect(r.json()).toEqual({ erreur: MESSAGE_RG7 });
    expect(await direct.get(`secret:${a}`)).toBe(existant);
    expect(await nbCles()).toBe(1);
  });

  it('CA8 — une création (succès et refus) n’écrit rien sur stdout ni stderr', async () => {
    ecritures = [];
    const capture = (chunk: unknown) => {
      ecritures.push(String(chunk));
      return true;
    };
    vi.spyOn(process.stdout, 'write').mockImplementation(capture as never);
    vi.spyOn(process.stderr, 'write').mockImplementation(capture as never);
    const logs = ['log', 'info', 'warn', 'error', 'debug'].map((m) =>
      vi.spyOn(console, m as 'log').mockImplementation(() => undefined),
    );
    expect((await app.inject(corps(valide))).statusCode).toBe(201);
    expect((await app.inject(corps({ ...valide, type: 'x' }))).statusCode).toBe(400);
    expect((await app.inject(corps({ ...valide, contenu: 'a'.repeat(10241) }))).statusCode).toBe(413);
    for (const l of logs) expect(l).not.toHaveBeenCalled();
    expect(ecritures).toEqual([]);
  });
});

describe('CA7 — pannes Valkey (vrai Valkey, sans mock)', () => {
  it('CA7 — Valkey indisponible (aucun serveur) : 500 avec le message générique RG-7, rien d’interne', async () => {
    await pointerSur(await portLibre());
    const app = await buildApp({ clientDir: '/inexistant' });
    const r = await app.inject(corps(valide));
    await app.close();
    expect(r.statusCode).toBe(500);
    expect(r.json()).toEqual({ erreur: MESSAGE_RG7 });
  }, 15_000);

  it('CA7 — Valkey arrêté en cours de route : 500 générique', async () => {
    const port = await demarrer('arret');
    await pointerSur(port);
    const app = await buildApp({ clientDir: '/inexistant' });
    expect((await app.inject(corps(valide))).statusCode).toBe(201);
    execFileSync('docker', ['stop', '-t', '1', `${PREFIXE}-arret`], { stdio: 'pipe' });
    const r = await app.inject(corps(valide));
    await app.close();
    expect(r.statusCode).toBe(500);
    expect(r.json()).toEqual({ erreur: MESSAGE_RG7 });
  }, 60_000);

  it('CA7 — mémoire pleine réelle (maxmemory 10 Mo) : 500 générique, rien d’interne', async () => {
    const port = await demarrer('oom', ['--maxmemory', '10mb']);
    await pointerSur(port);
    const direct = nouveauClient(port);
    await direct.connect();
    // Remplissage par blocs puis par petites valeurs, jusqu'au refus d'une petite écriture.
    let plein = false;
    for (const taille of [200_000, 1000, 10]) {
      for (let i = 0; i < 100_000 && !plein; i++) {
        try {
          await direct.set(`remplissage:${taille}:${i}`, 'x'.repeat(taille));
        } catch (e) {
          expect((e as Error).message.startsWith('OOM')).toBe(true);
          if (taille === 10) plein = true;
          break;
        }
      }
    }
    expect(plein).toBe(true);
    const app = await buildApp({ clientDir: '/inexistant' });
    const r = await app.inject(corps(valide));
    await app.close();
    expect(r.statusCode).toBe(500);
    expect(r.json()).toEqual({ erreur: MESSAGE_RG7 });
    expect(r.body).not.toMatch(/OOM|maxmemory/i);
  }, 90_000);
});

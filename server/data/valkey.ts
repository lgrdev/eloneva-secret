import { Redis } from 'iovalkey';
import { chargerConfig } from '../utils/config.js';

/** Écriture refusée par Valkey : mémoire pleine (politique noeviction). */
export class MemoirePleineError extends Error {
  constructor() {
    super('Mémoire Valkey pleine');
    this.name = 'MemoirePleineError';
  }
}

/** Valkey est injoignable ou ne répond pas. */
export class ServiceIndisponibleError extends Error {
  constructor() {
    super('Service Valkey indisponible');
    this.name = 'ServiceIndisponibleError';
  }
}

const DELAI_CONNEXION_MS = 1000;
const DELAI_COMMANDE_MS = 2000;

let client: Redis | undefined;

function creerClient(): Redis {
  const config = chargerConfig();
  const nouveau = new Redis({
    host: config.valkeyHost,
    port: config.valkeyPort,
    password: config.valkeyPassword,
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 0,
    retryStrategy: () => null,
    connectTimeout: DELAI_CONNEXION_MS,
    commandTimeout: DELAI_COMMANDE_MS,
  });
  // Évite l'événement 'error' non géré ; les erreurs sont traduites à l'appel.
  nouveau.on('error', () => undefined);
  return nouveau;
}

async function obtenirClient(): Promise<Redis> {
  if (client === undefined || client.status === 'end') {
    client?.disconnect();
    client = creerClient();
  }
  if (client.status === 'wait') {
    try {
      await client.connect();
    } catch {
      client.disconnect();
      client = undefined;
      throw new ServiceIndisponibleError();
    }
  }
  return client;
}

function traduireErreur(erreur: unknown): Error {
  const message = erreur instanceof Error ? erreur.message : '';
  if (message.startsWith('OOM')) {
    return new MemoirePleineError();
  }
  return new ServiceIndisponibleError();
}

async function executer<T>(action: (c: Redis) => Promise<T>): Promise<T> {
  const c = await obtenirClient();
  try {
    return await action(c);
  } catch (erreur) {
    throw traduireErreur(erreur);
  }
}

/** Écrit `valeur` sous `cle` ; l'enregistrement expire après `secondes` secondes. */
export async function ecrireAvecDuree(cle: string, valeur: string, secondes: number): Promise<void> {
  if (!Number.isInteger(secondes) || secondes <= 0) {
    throw new RangeError('Durée de vie invalide');
  }
  await executer((c) => c.set(cle, valeur, 'EX', secondes));
}

/**
 * Écrit `valeur` sous `cle` uniquement si la clé n'existe pas (SET NX EX).
 * Renvoie `false` si la clé existe déjà (rien n'est écrasé).
 */
export async function ecrireSiAbsente(cle: string, valeur: string, secondes: number): Promise<boolean> {
  if (!Number.isInteger(secondes) || secondes <= 0) {
    throw new RangeError('Durée de vie invalide');
  }
  return (await executer((c) => c.set(cle, valeur, 'EX', secondes, 'NX'))) === 'OK';
}

/** Lit la valeur de `cle`, ou `null` si absente ou expirée. */
export async function lire(cle: string): Promise<string | null> {
  return executer((c) => c.get(cle));
}

/** Supprime `cle` ; renvoie `true` si elle existait. */
export async function supprimer(cle: string): Promise<boolean> {
  return (await executer((c) => c.del(cle))) > 0;
}

/** Ferme la connexion (arrêt propre, tests). */
export async function fermerValkey(): Promise<void> {
  const c = client;
  client = undefined;
  if (c !== undefined && c.status !== 'end') {
    c.disconnect();
  }
}

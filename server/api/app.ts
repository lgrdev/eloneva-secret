import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { enregistrerGestionErreurs } from '../utils/erreurs.js';
import { routeSante } from './sante.js';
import { routeSecrets } from './secrets.js';
import type { GenerateurIdentifiant } from '../utils/identifiant.js';

export interface AppOptions {
  /** Dossier du front construit ; servi si présent. */
  clientDir?: string | undefined;
  /** Générateur d'identifiant, injectable pour les tests (collision). */
  generateurIdentifiant?: GenerateurIdentifiant | undefined;
  /** Horloge injectable pour les tests. */
  maintenant?: (() => Date) | undefined;
}

export async function buildApp(options: AppOptions = {}): Promise<FastifyInstance> {
  // Zéro trace : aucune journalisation.
  const app = Fastify({ logger: false });

  enregistrerGestionErreurs(app);
  routeSante(app);
  routeSecrets(app, {
    generateur: options.generateurIdentifiant,
    maintenant: options.maintenant,
  });

  const clientDir = resolve(options.clientDir ?? 'dist/client');
  if (existsSync(clientDir)) {
    await app.register(fastifyStatic, { root: clientDir });
    app.setNotFoundHandler((requete, reponse) => {
      if (requete.method === 'GET' && !requete.url.startsWith('/api/')) {
        return reponse.sendFile('index.html');
      }
      return reponse.status(404).send({ erreur: 'Introuvable' });
    });
  } else {
    app.setNotFoundHandler((_requete, reponse) =>
      reponse.status(404).send({ erreur: 'Introuvable' }),
    );
  }

  return app;
}

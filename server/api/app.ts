import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { santeReponseSchema } from '../../shared/schemas/index.js';

export interface AppOptions {
  /** Dossier du front construit ; servi si présent. */
  clientDir?: string | undefined;
}

export async function buildApp(options: AppOptions = {}): Promise<FastifyInstance> {
  // Zéro trace : aucune journalisation.
  const app = Fastify({ logger: false });

  app.get('/api/sante', async () => santeReponseSchema.parse({ statut: 'ok' }));

  app.setErrorHandler((_erreur, _requete, reponse) => {
    void reponse.status(500).send({ erreur: 'Erreur interne' });
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

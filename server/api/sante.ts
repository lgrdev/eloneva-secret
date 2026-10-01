import type { FastifyInstance } from 'fastify';
import { lire } from '../data/valkey.js';
import { santeReponseSchema } from '../../shared/schemas/index.js';

/** GET /api/sante : 200 si Valkey est joignable ; sinon l'erreur part au gestionnaire global (500). */
export function routeSante(app: FastifyInstance): void {
  app.get('/api/sante', async () => {
    await lire('sante:sonde');
    return santeReponseSchema.parse({ statut: 'ok' });
  });
}

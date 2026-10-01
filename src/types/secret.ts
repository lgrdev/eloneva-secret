/** Valeurs de contrat de `POST /api/secrets` (définies côté front en attendant le schéma partagé). */
export const TYPES_SECRET = ['message', 'mot-de-passe', 'lien'] as const;
export type TypeSecret = (typeof TYPES_SECRET)[number];

export const DUREES = ['1h', '4h', '24h', '7j', '14j'] as const;
export type DureeSecret = (typeof DUREES)[number];

export const DUREE_PAR_DEFAUT: DureeSecret = '24h';

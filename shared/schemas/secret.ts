import { z } from 'zod';

export const TYPES_SECRET = ['message', 'mot-de-passe', 'lien'] as const;
export const DUREES_SECRET = ['1h', '4h', '24h', '7j', '14j'] as const;

/** Durée de vie en secondes pour chaque durée choisie. */
export const DUREES_SECONDES = {
  '1h': 3600,
  '4h': 14400,
  '24h': 86400,
  '7j': 604800,
  '14j': 1209600,
} as const satisfies Record<(typeof DUREES_SECRET)[number], number>;

/** Taille maximale du contenu : 10 Ko, mesurée en octets UTF-8. */
export const TAILLE_MAX_CONTENU_OCTETS = 10 * 1024;

export const MESSAGE_CONTENU_TROP_VOLUMINEUX = 'Le contenu dépasse la taille maximale de 10 Ko.';

export const creationSecretSchema = z.object({
  type: z.enum(TYPES_SECRET),
  duree: z.enum(DUREES_SECRET),
  contenu: z
    .string()
    .min(1)
    .refine((valeur) => new TextEncoder().encode(valeur).length <= TAILLE_MAX_CONTENU_OCTETS, {
      message: MESSAGE_CONTENU_TROP_VOLUMINEUX,
    }),
});

export const reponseCreationSchema = z.object({
  identifiant: z.string().regex(/^[a-z0-9]{32}$/),
  expireLe: z.string().datetime(),
});

export type CreationSecret = z.infer<typeof creationSecretSchema>;
export type ReponseCreation = z.infer<typeof reponseCreationSchema>;

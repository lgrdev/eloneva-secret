import { z } from 'zod';

export const MESSAGE_SERVICE_INDISPONIBLE =
  'Service temporairement indisponible. Veuillez réessayer plus tard.';

export const erreurReponseSchema = z.object({
  erreur: z.string(),
});

export type ErreurReponse = z.infer<typeof erreurReponseSchema>;

import { z } from 'zod';

export const santeReponseSchema = z.object({
  statut: z.literal('ok'),
});

export type SanteReponse = z.infer<typeof santeReponseSchema>;

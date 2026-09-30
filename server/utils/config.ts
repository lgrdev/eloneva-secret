import { z } from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().min(1).default('0.0.0.0'),
  CLIENT_DIR: z.string().min(1).optional(),
});

export interface Config {
  port: number;
  host: string;
  clientDir: string | undefined;
}

export function chargerConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = configSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error('Configuration invalide');
  }
  return {
    port: parsed.data.PORT,
    host: parsed.data.HOST,
    clientDir: parsed.data.CLIENT_DIR,
  };
}

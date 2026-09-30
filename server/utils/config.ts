import { z } from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().min(1).default('0.0.0.0'),
  CLIENT_DIR: z.string().min(1).optional(),
  VALKEY_HOST: z.string().min(1).default('127.0.0.1'),
  VALKEY_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  VALKEY_PASSWORD: z.string().min(1).optional(),
});

export interface Config {
  port: number;
  host: string;
  clientDir: string | undefined;
  valkeyHost: string;
  valkeyPort: number;
  valkeyPassword: string | undefined;
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
    valkeyHost: parsed.data.VALKEY_HOST,
    valkeyPort: parsed.data.VALKEY_PORT,
    valkeyPassword: parsed.data.VALKEY_PASSWORD,
  };
}

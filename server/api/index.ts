import { chargerConfig } from '../utils/config.js';
import { buildApp } from './app.js';

const config = chargerConfig();
const app = await buildApp({ clientDir: config.clientDir });

try {
  await app.listen({ port: config.port, host: config.host });
} catch {
  process.exit(1);
}

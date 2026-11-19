import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

// Keep chat credentials separate from the project's tracked .env file.
config({ path: fileURLToPath(new URL('./.env', import.meta.url)), quiet: true });
config({
  path: fileURLToPath(new URL('./.env.chat.local', import.meta.url)),
  override: true,
  quiet: true
});

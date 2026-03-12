import { defineConfig } from 'vitest/config';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/** Load root .env into process.env for tests (e.g., GOOGLE_GENERATIVE_AI_API_KEY) */
function loadRootEnv(): Record<string, string> {
  try {
    const content = readFileSync(resolve(__dirname, '../../.env'), 'utf-8');
    const env: Record<string, string> = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx);
      const val = trimmed.slice(eqIdx + 1);
      if (!process.env[key]) env[key] = val;
    }
    return env;
  } catch {
    return {};
  }
}

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: loadRootEnv(),
  },
});

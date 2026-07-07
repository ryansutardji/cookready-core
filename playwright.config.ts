import { defineConfig } from '@playwright/test';
import { getLocalSupabaseEnv, writeLocalEnvOverrideFile } from './e2e/supabase-local-env';

const local = getLocalSupabaseEnv();
writeLocalEnvOverrideFile();

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:8082',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx expo start --web --port 8082 --clear',
    url: 'http://localhost:8082',
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      ...process.env,
      EXPO_PUBLIC_SUPABASE_URL: local.apiUrl,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: local.anonKey,
      CI: '1',
      EXPO_NO_TELEMETRY: '1',
    },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});

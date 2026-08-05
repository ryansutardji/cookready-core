import { restoreEnvLocalFile } from './supabase-local-env';

// Restores .env.local to whatever it held before the e2e run overwrote it
// with the local Supabase stack's URL/anon key (or removes it if there was
// nothing there before). Without this, the override leaks into normal
// `npx expo start` sessions after the suite finishes — see
// supabase-local-env.ts's writeLocalEnvOverrideFile() for the write side.
export default function globalTeardown(): void {
  restoreEnvLocalFile();
}

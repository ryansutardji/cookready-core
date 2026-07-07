import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';

export type LocalSupabaseEnv = {
  apiUrl: string;
  anonKey: string;
};

let cached: LocalSupabaseEnv | null = null;

export function getLocalSupabaseEnv(): LocalSupabaseEnv {
  if (cached) return cached;

  let output: string;
  try {
    output = execSync('npx supabase status -o env', { encoding: 'utf-8' });
  } catch {
    throw new Error(
      "Local Supabase stack isn't running — run 'npx supabase start' first, then re-run the e2e suite."
    );
  }

  const vars: Record<string, string> = {};
  for (const line of output.split('\n')) {
    const match = line.match(/^([A-Z_]+)="(.*)"$/);
    if (match) vars[match[1]] = match[2];
  }

  if (!vars.API_URL || !vars.ANON_KEY) {
    throw new Error(
      "Could not parse API_URL/ANON_KEY from 'npx supabase status -o env' output. Is the local stack running?"
    );
  }

  cached = { apiUrl: vars.API_URL, anonKey: vars.ANON_KEY };
  return cached;
}

// Expo's dev-mode web client bundle inlines EXPO_PUBLIC_* values by reading
// .env* files directly off disk (merged over process.env), not from the
// spawned process's environment — so overriding webServer.env alone is not
// enough for the web client bundle. .env.local outranks .env in that merge
// and is already gitignored, so writing it here is the reliable way to point
// the local Expo web build at the local Supabase stack without touching .env.
export function writeLocalEnvOverrideFile(): void {
  const { apiUrl, anonKey } = getLocalSupabaseEnv();
  const contents = `EXPO_PUBLIC_SUPABASE_URL=${apiUrl}\nEXPO_PUBLIC_SUPABASE_ANON_KEY=${anonKey}\n`;
  writeFileSync(path.join(__dirname, '..', '.env.local'), contents);
}

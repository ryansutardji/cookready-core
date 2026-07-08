import { execSync } from 'child_process';
import { existsSync, renameSync, unlinkSync, writeFileSync } from 'fs';
import path from 'path';

const ENV_LOCAL_PATH = path.join(__dirname, '..', '.env.local');
const ENV_LOCAL_BACKUP_PATH = path.join(__dirname, '..', '.env.local.e2e-backup');

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
  // Back up whatever .env.local currently holds (e.g. the developer's own
  // production/local preference, or nothing at all) before overwriting it,
  // but only if a backup isn't already there — a leftover backup means a
  // previous run crashed before restoreEnvLocalFile() ran, and its content is
  // the real "pre-e2e" state we still need to preserve.
  if (!existsSync(ENV_LOCAL_BACKUP_PATH) && existsSync(ENV_LOCAL_PATH)) {
    renameSync(ENV_LOCAL_PATH, ENV_LOCAL_BACKUP_PATH);
  }

  const { apiUrl, anonKey } = getLocalSupabaseEnv();
  const contents = `EXPO_PUBLIC_SUPABASE_URL=${apiUrl}\nEXPO_PUBLIC_SUPABASE_ANON_KEY=${anonKey}\n`;
  writeFileSync(ENV_LOCAL_PATH, contents);
}

// Called from Playwright's globalTeardown so the local-stack override never
// outlives the e2e run — without this, .env.local stays pointed at the local
// Supabase stack after the suite finishes and silently hijacks the next
// `npx expo start` session (see project memory:
// "Expo Web Dev-Mode Env Var Gotcha" — .env.local outranks .env for EVERY
// platform, not just --web, so this isn't just a web-dev concern).
export function restoreEnvLocalFile(): void {
  if (existsSync(ENV_LOCAL_BACKUP_PATH)) {
    renameSync(ENV_LOCAL_BACKUP_PATH, ENV_LOCAL_PATH);
    return;
  }
  // No pre-existing .env.local before this run — remove the one we wrote.
  if (existsSync(ENV_LOCAL_PATH)) {
    unlinkSync(ENV_LOCAL_PATH);
  }
}

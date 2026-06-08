---
name: project-migration-sync
description: The local and remote migration histories are out of sync — remote has migrations applied directly that never went through local files, and vice versa. Repair is required before db push.
metadata:
  type: project
---

The local supabase migrations directory and the remote project's migration history are diverged. Several migrations were applied directly to the remote (via MCP `apply_migration` or the dashboard) without corresponding local files, and some local files were never applied to the remote.

**Why:** Development pattern mixes direct remote edits (via MCP) with local file-based migrations. This creates a split history.

**How to apply:** Before running `supabase db push`, always check `npx supabase migration list` first. If there are remote-only migrations that appear as gaps, use `migration repair --status reverted` to mark them reverted in the history table so push doesn't block on them. For local-only migrations that are already applied on remote, use `migration repair --status applied` to mark them applied. Only then will push cleanly apply just the new pending migrations.

The ingredients already in remote that may not be in local migration files include:
- White Miso Paste (Spice/Sauce, tub, 500g)
- Shichimi Togarashi (Spice/Sauce, jar, 40g) — NOTE: remote value is 40g, spec originally said 50g

When writing new ingredient migrations, use `ON CONFLICT (name) DO NOTHING` to handle idempotency in case ingredients were previously inserted directly on remote.

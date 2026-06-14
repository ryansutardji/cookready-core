let pendingLockoutUntil: string | null = null;

export function setPendingLockout(until: string): void {
  pendingLockoutUntil = until;
}

export function consumePendingLockout(): string | null {
  const val = pendingLockoutUntil;
  pendingLockoutUntil = null;
  return val;
}

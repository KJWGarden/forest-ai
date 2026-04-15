export const GUEST_USER_ID_PREFIX = "guest_";

export function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createUserId() {
  return `${GUEST_USER_ID_PREFIX}${createId()}`;
}

export function isGuestUserId(userId: string | null | undefined) {
  return Boolean(userId && userId.startsWith(GUEST_USER_ID_PREFIX));
}

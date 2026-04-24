export interface OAuthUserInput {
  id?: string;
  username?: string | null;
  name?: string | null;
  email?: string | null;
}

function normalizeUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "");
}

export function resolveOAuthUsername(
  user: OAuthUserInput,
  fallbackSeed: string,
): string {
  const candidates = [
    user.username,
    user.name,
    user.email?.split("@")[0],
  ].filter((candidate): candidate is string => typeof candidate === "string");

  for (const candidate of candidates) {
    const normalized = normalizeUsername(candidate);
    if (normalized) {
      return normalized;
    }
  }

  const normalizedSeed = normalizeUsername(fallbackSeed);
  if (normalizedSeed) {
    return `user-${normalizedSeed.slice(0, 8)}`;
  }

  return "user";
}

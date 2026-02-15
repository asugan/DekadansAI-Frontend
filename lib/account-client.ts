type JsonObject = Record<string, unknown>;

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export interface RateLimitKey {
  id: string;
  name: string | null;
  start: string | null;
  enabled: boolean;
  windowMs: number;
  max: number;
  used: number;
  remaining: number;
  lastRequestAt: string | null;
  resetAt: string;
}

export interface RateLimitSnapshot {
  generatedAt: string;
  defaults: {
    windowMs: number;
    max: number;
  };
  overview: {
    activeKeys: number;
    totalMax: number;
    totalUsed: number;
    totalRemaining: number;
    nextResetAt: string | null;
  };
  keys: RateLimitKey[];
}

function asObject(value: unknown): JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }

  return {};
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }

  return fallback;
}

function normalizeSnapshot(payload: unknown): RateLimitSnapshot {
  const root = asObject(payload);
  const defaults = asObject(root.defaults);
  const overview = asObject(root.overview);
  const keysRaw = Array.isArray(root.keys) ? root.keys : [];

  const keys = keysRaw
    .map((entry) => {
      const key = asObject(entry);
      const id = typeof key.id === "string" ? key.id : "";
      if (!id) return null;

      return {
        id,
        name: typeof key.name === "string" ? key.name : null,
        start: typeof key.start === "string" ? key.start : null,
        enabled: asBoolean(key.enabled, true),
        windowMs: Math.max(1, asNumber(key.windowMs, asNumber(defaults.windowMs, 86400000))),
        max: Math.max(0, asNumber(key.max, asNumber(defaults.max, 800))),
        used: Math.max(0, asNumber(key.used, 0)),
        remaining: Math.max(0, asNumber(key.remaining, 0)),
        lastRequestAt: typeof key.lastRequestAt === "string" ? key.lastRequestAt : null,
        resetAt:
          typeof key.resetAt === "string"
            ? key.resetAt
            : new Date(Date.now() + Math.max(1, asNumber(key.windowMs, 86400000))).toISOString()
      } satisfies RateLimitKey;
    })
    .filter((entry): entry is RateLimitKey => entry !== null);

  return {
    generatedAt:
      typeof root.generatedAt === "string" ? root.generatedAt : new Date().toISOString(),
    defaults: {
      windowMs: Math.max(1, asNumber(defaults.windowMs, 86400000)),
      max: Math.max(0, asNumber(defaults.max, 800))
    },
    overview: {
      activeKeys: Math.max(0, asNumber(overview.activeKeys, keys.filter((item) => item.enabled).length)),
      totalMax: Math.max(0, asNumber(overview.totalMax, 0)),
      totalUsed: Math.max(0, asNumber(overview.totalUsed, 0)),
      totalRemaining: Math.max(0, asNumber(overview.totalRemaining, 0)),
      nextResetAt: typeof overview.nextResetAt === "string" ? overview.nextResetAt : null
    },
    keys
  };
}

function parseErrorMessage(payload: unknown, fallback: string): string {
  const parsed = asObject(payload);
  const error = parsed.error;
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}

export async function getRateLimitSnapshot(): Promise<RateLimitSnapshot> {
  const response = await fetch("/api/account/rate-limit", {
    method: "GET",
    credentials: "include",
    cache: "no-store"
  });

  const responsePayload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiRequestError(
      parseErrorMessage(responsePayload, "Rate limit bilgisi alinamadi"),
      response.status
    );
  }

  return normalizeSnapshot(responsePayload);
}

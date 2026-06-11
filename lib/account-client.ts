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
  lastRequestAt: string | null;
}

export interface RateLimitSnapshot {
  generatedAt: string;
  defaults: {
    windowMs: number;
    max: number;
  };
  account: {
    quota: {
      windowMs: number;
      max: number;
      used: number;
      remaining: number;
      resetAt: string;
    };
    burst: {
      windowMs: number;
      max: number;
      used: number;
      remaining: number;
      resetAt: string;
    };
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

export interface BillingSnapshot {
  generatedAt: string;
  weeklyPlan: {
    active: boolean;
    customerExists: boolean;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string | null;
  enabled: boolean;
  requestCost: number;
}

export interface ModelsSnapshot {
  generatedAt: string;
  data: ModelInfo[];
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
  const account = asObject(root.account);
  const quota = asObject(account.quota);
  const burst = asObject(account.burst);
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
        lastRequestAt: typeof key.lastRequestAt === "string" ? key.lastRequestAt : null
      } satisfies RateLimitKey;
    })
    .filter((entry): entry is RateLimitKey => entry !== null);

  return {
    generatedAt:
      typeof root.generatedAt === "string" ? root.generatedAt : new Date().toISOString(),
    defaults: {
      windowMs: Math.max(1, asNumber(defaults.windowMs, 18000000)),
      max: Math.max(0, asNumber(defaults.max, 500))
    },
    account: {
      quota: {
        windowMs: Math.max(1, asNumber(quota.windowMs, asNumber(defaults.windowMs, 18000000))),
        max: Math.max(0, asNumber(quota.max, asNumber(defaults.max, 500))),
        used: Math.max(0, asNumber(quota.used, asNumber(overview.totalUsed, 0))),
        remaining: Math.max(0, asNumber(quota.remaining, asNumber(overview.totalRemaining, 0))),
        resetAt:
          typeof quota.resetAt === "string"
            ? quota.resetAt
            : new Date(Date.now() + Math.max(1, asNumber(defaults.windowMs, 18000000))).toISOString()
      },
      burst: {
        windowMs: Math.max(1, asNumber(burst.windowMs, 20000)),
        max: Math.max(0, asNumber(burst.max, 5)),
        used: Math.max(0, asNumber(burst.used, 0)),
        remaining: Math.max(0, asNumber(burst.remaining, 0)),
        resetAt:
          typeof burst.resetAt === "string"
            ? burst.resetAt
            : new Date(Date.now() + Math.max(1, asNumber(burst.windowMs, 20000))).toISOString()
      }
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

function normalizeBillingSnapshot(payload: unknown): BillingSnapshot {
  const root = asObject(payload);
  const weeklyPlan = asObject(root.weeklyPlan);

  return {
    generatedAt:
      typeof root.generatedAt === "string" ? root.generatedAt : new Date().toISOString(),
    weeklyPlan: {
      active: asBoolean(weeklyPlan.active, false),
      customerExists: asBoolean(weeklyPlan.customerExists, false)
    }
  };
}

function normalizeModelsSnapshot(payload: unknown): ModelsSnapshot {
  const root = asObject(payload);
  const rawModels = Array.isArray(root.data) ? root.data : [];

  const data = rawModels
    .map((entry) => {
      const model = asObject(entry);
      const id = typeof model.id === "string" ? model.id.trim() : "";
      if (!id) return null;

      return {
        id,
        name: typeof model.name === "string" && model.name.trim() ? model.name : id,
        provider:
          typeof model.provider === "string" && model.provider.trim() ? model.provider : null,
        enabled: asBoolean(model.enabled, true),
        requestCost: Math.max(1, asNumber(model.requestCost, 1))
      } satisfies ModelInfo;
    })
    .filter((entry): entry is ModelInfo => entry !== null);

  return {
    generatedAt:
      typeof root.generatedAt === "string" ? root.generatedAt : new Date().toISOString(),
    data
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

export async function getBillingSnapshot(): Promise<BillingSnapshot> {
  const response = await fetch("/api/account/billing", {
    method: "GET",
    credentials: "include",
    cache: "no-store"
  });

  const responsePayload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiRequestError(
      parseErrorMessage(responsePayload, "Billing bilgisi alinamadi"),
      response.status
    );
  }

  return normalizeBillingSnapshot(responsePayload);
}

export async function getModelsSnapshot(): Promise<ModelsSnapshot> {
  const response = await fetch("/api/account/models", {
    method: "GET",
    credentials: "include",
    cache: "no-store"
  });

  const responsePayload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiRequestError(
      parseErrorMessage(responsePayload, "Model listesi alinamadi"),
      response.status
    );
  }

  return normalizeModelsSnapshot(responsePayload);
}

const DEFAULT_BACKEND_BASE_URL = "http://localhost:4000";

export function getBackendBaseUrl(): string {
  const rawValue = process.env.BACKEND_BASE_URL || DEFAULT_BACKEND_BASE_URL;

  try {
    const parsed = new URL(rawValue);
    return parsed.toString().replace(/\/$/, "");
  } catch {
    throw new Error(`Invalid BACKEND_BASE_URL: ${rawValue}`);
  }
}

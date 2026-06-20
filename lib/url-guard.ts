const UNSAFE_PROD_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "host.docker.internal", "ngrok", "lvh.me"];

function isUnsafeProductionUrl(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return UNSAFE_PROD_HOSTS.some((host) => normalized.includes(host));
}

export function assertSafeProductionUrl(name: string, value: string): void {
  if (process.env.NODE_ENV === "production" && (!value || isUnsafeProductionUrl(value))) {
    throw new Error(`${name} must be a production URL when NODE_ENV=production`);
  }
}

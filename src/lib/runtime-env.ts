/**
 * Server-only env access.
 * Computed keys stay runtime values. Next.js inlines static
 * `process.env.NAME` references from the build environment.
 */

export function readRuntimeEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Prisma CLI (`migrate deploy`) requires DIRECT_URL whenever the schema
 * declares `directUrl`. The query engine uses DATABASE_URL. Copy it when
 * DIRECT_URL is unset so Railway can run with one variable. A real
 * DIRECT_URL (Neon on Vercel) is left as-is.
 */
export function ensureDatabaseEnv(): string | undefined {
  const databaseUrl = readRuntimeEnv("DATABASE_URL");
  if (!readRuntimeEnv("DIRECT_URL") && databaseUrl) {
    process.env.DIRECT_URL = databaseUrl;
  }
  return databaseUrl;
}

/** Code or error name only — Prisma messages can contain the connection host. */
export function dbErrorCode(err: unknown): string {
  if (err && typeof err === "object") {
    const record = err as { code?: unknown; errorCode?: unknown; name?: unknown };
    if (typeof record.code === "string" && record.code) return record.code;
    if (typeof record.errorCode === "string" && record.errorCode) {
      return record.errorCode;
    }
    if (typeof record.name === "string" && record.name) return record.name;
  }
  return "unknown";
}

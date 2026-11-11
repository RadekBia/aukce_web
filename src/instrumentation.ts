/**
 * Railway's pre-deploy migrate was not creating tables in the database the
 * app queries (public schema was empty, P2021). Run migrate deploy in the
 * same Node process that can already reach DATABASE_URL.
 * Skipped during `next build` — the private Railway host is not reachable then.
 * Vercel does not set RAILWAY_ENVIRONMENT, so production there is unchanged.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const onRailway = Boolean(
    process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID,
  );
  if (!onRailway) return;

  const { ensureDatabaseEnv } = await import("@/lib/runtime-env");
  const { runMigrateDeploy } = await import("@/lib/migrate-deploy");
  ensureDatabaseEnv();
  await runMigrateDeploy();
}

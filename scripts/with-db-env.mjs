/**
 * Run a command with DIRECT_URL defaulting to DATABASE_URL.
 * Used by Railway pre-deploy (`prisma migrate deploy`) and by the Next start
 * process. Does not print either value.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...process.env };
const databaseUrl = env.DATABASE_URL?.trim();
if (!env.DIRECT_URL?.trim() && databaseUrl) {
  env.DATABASE_URL = databaseUrl;
  env.DIRECT_URL = databaseUrl;
}

const bin = path.join(root, "node_modules", ".bin");
env.PATH = `${bin}${path.delimiter}${env.PATH ?? ""}`;

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("usage: node scripts/with-db-env.mjs <command> [args...]");
  process.exit(1);
}

const child = spawn(args[0], args.slice(1), {
  cwd: root,
  env,
  stdio: "inherit",
});

child.on("error", () => {
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

import { spawn } from "node:child_process";
import path from "node:path";

export type MigrateResult = {
  ok: boolean;
  exitCode: number;
  /** True when Prisma reported that migrations were applied or already up to date. */
  settled: boolean;
};

function scrub(message: string): string {
  return message
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "<url>")
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "<ip>")
    .replace(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/gi, "<host>")
    .replace(/\s+/g, " ")
    .trim()
    .slice(-400);
}

/** Apply committed migrations to DATABASE_URL / DIRECT_URL. Does not print the URL. */
export function runMigrateDeploy(): Promise<MigrateResult> {
  const prismaJs = path.join(process.cwd(), "node_modules/prisma/build/index.js");
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    const child = spawn(process.execPath, [prismaJs, "migrate", "deploy"], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const collect = (buf: Buffer) => {
      chunks.push(buf);
    };
    child.stdout?.on("data", collect);
    child.stderr?.on("data", collect);
    child.on("error", () => {
      console.error("prisma migrate deploy could not start");
      resolve({ ok: false, exitCode: 127, settled: false });
    });
    child.on("exit", (code) => {
      const exitCode = code ?? 1;
      const text = Buffer.concat(chunks).toString("utf8");
      const settled = /successfully applied|No pending migrations/i.test(text);
      if (exitCode !== 0) {
        console.error("prisma migrate deploy failed", exitCode, scrub(text));
      }
      resolve({ ok: exitCode === 0, exitCode, settled });
    });
  });
}

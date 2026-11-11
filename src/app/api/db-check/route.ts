import { readdirSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma as sharedPrisma } from "@/lib/prisma";
import { readRuntimeEnv } from "@/lib/runtime-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hostKind(hostname: string): string {
  const host = hostname.toLowerCase();
  if (host.includes("neon.tech")) return host.includes("pooler") ? "neon-pooler" : "neon-direct";
  if (host.endsWith(".railway.internal") || host.endsWith(".internal")) return "railway-internal";
  if (host.includes("rlwy.net") || host.endsWith(".railway.app")) return "railway-public";
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") return "local";
  if (host.includes("pooler")) return "other-pooler";
  return "other";
}

function describeUrl(raw: string | undefined) {
  if (!raw) return { set: false as const };
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { set: true as const, parse: "fail" as const };
  }
  return {
    set: true as const,
    parse: "ok" as const,
    proto: parsed.protocol.replace(":", ""),
    kind: hostKind(parsed.hostname),
    pooler: parsed.hostname.toLowerCase().includes("pooler"),
    sslmode: parsed.searchParams.get("sslmode"),
    pgbouncer: parsed.searchParams.get("pgbouncer"),
    schema: parsed.searchParams.has("schema"),
  };
}

function scrub(message: string): string {
  const cleaned = message
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "<url>")
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "<ip>")
    .replace(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/gi, "<host>")
    .replace(/:[0-9]{2,5}\b/g, ":<port>")
    .replace(/\s+/g, " ")
    .trim();
  const marker = cleaned.lastIndexOf("invocation");
  const focus = marker >= 0 ? cleaned.slice(marker) : cleaned;
  return focus.slice(0, 500);
}

function engineFiles(): string[] {
  try {
    const dir = path.join(process.cwd(), "node_modules/.prisma/client");
    return readdirSync(dir).filter(
      (name) => name.includes("libquery") || name.includes("schema-engine"),
    );
  } catch {
    return [];
  }
}

export async function GET() {
  const databaseUrl = readRuntimeEnv("DATABASE_URL");
  const directUrl = readRuntimeEnv("DIRECT_URL");
  const body: Record<string, unknown> = {
    database: describeUrl(databaseUrl),
    direct: describeUrl(directUrl),
    engineFiles: engineFiles(),
  };

  const prisma = new PrismaClient(
    databaseUrl ? { datasourceUrl: databaseUrl } : undefined,
  );
  async function probe(
    label: string,
    run: () => Promise<unknown>,
  ): Promise<void> {
    try {
      await run();
      body[label] = "ok";
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const record = err as { code?: unknown; errorCode?: unknown; name?: unknown };
      body[label] = {
        name: typeof record.name === "string" ? record.name : "Error",
        code:
          typeof record.code === "string"
            ? record.code
            : typeof record.errorCode === "string"
              ? record.errorCode
              : null,
        reason: scrub(message),
      };
    }
  }

  await probe("select1", () => prisma.$queryRaw`SELECT 1`);
  await probe("freshFind", () => prisma.auction.findMany({ take: 1 }));
  await probe("sharedFind", () => sharedPrisma.auction.findMany({ take: 1 }));
  await prisma.$disconnect().catch(() => undefined);

  return NextResponse.json(body);
}

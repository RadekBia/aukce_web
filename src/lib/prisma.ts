import { PrismaClient } from "@prisma/client";
import { ensureDatabaseEnv } from "@/lib/runtime-env";

const databaseUrl = ensureDatabaseEnv();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  // Pass the runtime URL explicitly so a build-time snapshot cannot win.
  return databaseUrl
    ? new PrismaClient({ datasourceUrl: databaseUrl })
    : new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

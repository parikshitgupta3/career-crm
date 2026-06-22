import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

function normalizeDatabaseUrl(rawUrl: string) {
  const parsed = new URL(rawUrl);

  parsed.searchParams.delete("channel_binding");
  if (!parsed.searchParams.get("sslmode")) {
    parsed.searchParams.set("sslmode", "require");
  }

  if (parsed.hostname.includes("-pooler.")) {
    parsed.hostname = parsed.hostname.replace("-pooler", "");
  }

  return parsed.toString();
}

neonConfig.poolQueryViaFetch = true;

const normalizedUrl = normalizeDatabaseUrl(databaseUrl);

try {
  const parsedForLog = new URL(normalizedUrl);
  console.info("[prisma] connecting to", parsedForLog.hostname);
} catch {
  console.warn("[prisma] could not parse DATABASE_URL for logging");
}

const adapter = new PrismaNeon({ connectionString: normalizedUrl });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

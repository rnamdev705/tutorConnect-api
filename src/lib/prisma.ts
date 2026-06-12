import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

const RETRY_ATTEMPTS = 4;
const RETRY_BASE_MS = 1200;

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Use Neon's WebSocket driver when hosted on Neon (handles free-tier suspend/wake better than raw TCP). */
function usesNeonDriver() {
  const url = process.env.DATABASE_URL ?? "";
  return url.includes("neon.tech") || process.env.USE_NEON_DRIVER === "true";
}

function createBasePrismaClient() {
  const log: Prisma.LogLevel[] =
    process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];

  if (usesNeonDriver()) {
    neonConfig.webSocketConstructor = ws;
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
    return new PrismaClient({ adapter, log });
  }

  return new PrismaClient({ log });
}

async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = RETRY_ATTEMPTS,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isPrismaConnectionError(error) || attempt === maxAttempts) {
        throw error;
      }

      const delayMs = RETRY_BASE_MS * attempt;
      console.warn(`[db] transient error (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms…`);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

function createPrismaClient() {
  const base = createBasePrismaClient();

  return base.$extends({
    query: {
      $allOperations({ args, query }) {
        return executeWithRetry(() => query(args));
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** Retry connect while Neon free-tier compute wakes up (can take several seconds). */
export async function connectDatabase(maxAttempts = 6): Promise<void> {
  await executeWithRetry(async () => {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
  }, maxAttempts);
}

export function isPrismaConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P1001" || error.code === "P1002" || error.code === "P1017";
  }

  if (error instanceof Error) {
    return (
      error.message.includes("Can't reach database server") ||
      error.message.includes("Connection terminated") ||
      error.message.includes("terminating connection due to administrator command") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ETIMEDOUT")
    );
  }

  return false;
}

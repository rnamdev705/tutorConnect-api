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

/**
 * Neon WebSocket driver is for serverless/edge (Vercel, Cloudflare Workers).
 * Node.js Express should use the default Prisma TCP driver with the pooled DATABASE_URL.
 */
function usesNeonWebSocketDriver() {
  return process.env.USE_NEON_DRIVER === "true";
}

function createBasePrismaClient() {
  const log: Prisma.LogLevel[] =
    process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];

  if (usesNeonWebSocketDriver()) {
    neonConfig.webSocketConstructor = ws;
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
    return new PrismaClient({ adapter, log });
  }

  return new PrismaClient({ log });
}

function collectErrorText(error: unknown, depth = 0): string[] {
  if (!error || depth > 6) return [];

  if (typeof error === "string") return [error];

  if (error instanceof Error) {
    const parts = [error.message];
    if ("code" in error && typeof error.code === "string") {
      parts.push(error.code);
    }
    if (error.cause) {
      parts.push(...collectErrorText(error.cause, depth + 1));
    }
    return parts;
  }

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts: string[] = [];

    if (typeof record.message === "string") parts.push(record.message);
    if (typeof record.code === "string") parts.push(record.code);

    const nested = (record as { [key: symbol]: unknown })[Symbol.for("kError")];
    if (nested) parts.push(...collectErrorText(nested, depth + 1));

    if (Array.isArray((error as AggregateError).errors)) {
      for (const inner of (error as AggregateError).errors) {
        parts.push(...collectErrorText(inner, depth + 1));
      }
    }

    return parts;
  }

  return [String(error)];
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

  const text = collectErrorText(error).join(" ").toLowerCase();

  return (
    text.includes("can't reach database server") ||
    text.includes("connection terminated") ||
    text.includes("terminating connection due to administrator command") ||
    text.includes("econnrefused") ||
    text.includes("etimedout") ||
    text.includes("enotfound") ||
    text.includes("socket hang up") ||
    text.includes("connection reset")
  );
}

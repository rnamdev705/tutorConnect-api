import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client.
 * In development, reuses the same instance across hot-reloads to avoid connection exhaustion.
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

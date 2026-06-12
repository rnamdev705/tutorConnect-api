import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { isPrismaConnectionError } from "../lib/prisma.js";

/** Application-level error with an HTTP status code. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Global error handler — never leaks stack traces or internal details in production.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        ...(err.code && { code: err.code }),
      },
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File too large"
        : err.code === "LIMIT_UNEXPECTED_FILE"
          ? "Unexpected file field"
          : "Upload failed";
    res.status(400).json({ error: { message, code: err.code } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "Validation failed",
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  if (isPrismaConnectionError(err)) {
    console.error("[db] connection error:", err);
    res.status(503).json({
      error: {
        message:
          "Database is temporarily unavailable. Wait a few seconds and try again (Neon may be waking up).",
        code: "DB_UNAVAILABLE",
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.error("[db] prisma error:", err.code, err.message);
    res.status(500).json({
      error: {
        message: env.isProduction ? "Internal server error" : `Database error (${err.code})`,
        code: err.code,
      },
    });
    return;
  }

  console.error("[unhandled]", err);

  res.status(500).json({
    error: {
      message: env.isProduction
        ? "Internal server error"
        : err instanceof Error
          ? err.message
          : "Internal server error",
    },
  });
}

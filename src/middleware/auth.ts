import type { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt.js";
import { AppError } from "./errorHandler.js";

/** Extracts a Bearer token from the Authorization header. */
function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

/**
 * Requires a valid JWT. Attaches `req.user` on success.
 * Responds with 401 when the token is missing, expired, or invalid.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new AppError(401, "Authentication required", "UNAUTHORIZED");
    }

    const payload = verifyToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Requires the authenticated user to have one of the given roles.
 * Must be used after `requireAuth`.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, "Authentication required", "UNAUTHORIZED"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError(403, "Insufficient permissions", "FORBIDDEN"));
      return;
    }

    next();
  };
}

import type { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

/** Signs a JWT for an authenticated user. */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(
    { email: payload.email, role: payload.role },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
      subject: payload.sub,
    },
  );
}

/**
 * Verifies a JWT and returns the payload.
 * @throws {AppError} 401 when the token is missing, expired, or invalid.
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (typeof decoded === "string" || !decoded.sub || !decoded.email || !decoded.role) {
      throw new AppError(401, "Invalid or expired token", "INVALID_TOKEN");
    }

    return {
      sub: decoded.sub,
      email: String(decoded.email),
      role: decoded.role as Role,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(401, "Token expired", "TOKEN_EXPIRED");
    }
    throw new AppError(401, "Invalid or expired token", "INVALID_TOKEN");
  }
}

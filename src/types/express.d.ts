import type { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth` after a valid JWT is verified. */
      user?: {
        id: string;
        email: string;
        role: Role;
      };
    }
  }
}

export {};

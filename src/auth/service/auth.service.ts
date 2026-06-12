import bcrypt from "bcryptjs";
import { signToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { LoginInput, RegisterInput } from "../schema/auth.schema.js";

const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

function buildAuthResponse(user: { id: string; email: string; role: import("@prisma/client").Role }) {
  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

export async function register(input: RegisterInput) {
  const email = input.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "An account with this email already exists", "EMAIL_TAKEN");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: input.role,
      },
    });

    if (input.role === "TUTOR") {
      await tx.tutorProfile.create({
        data: {
          tutorId: created.id,
          displayName: input.displayName.trim(),
          qualifications: [],
          experiences: [],
        },
      });
    }

    return created;
  });

  return buildAuthResponse(user);
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!user) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  if (input.role && user.role !== input.role) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  return buildAuthResponse(user);
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });

  if (!user) {
    throw new AppError(401, "Invalid or expired token", "INVALID_TOKEN");
  }

  return user;
}

import bcrypt from "bcryptjs";
import { signToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { LoginInput, RegisterInput, UpdateMeInput } from "../schema/auth.schema.js";

const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  displayName: true,
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
        displayName: input.displayName.trim(),
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

export async function updateMe(userId: string, input: UpdateMeInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(401, "Invalid or expired token", "INVALID_TOKEN");
  }

  const data: { displayName?: string; passwordHash?: string } = {};

  if (input.displayName !== undefined) {
    data.displayName = input.displayName.trim();
  }

  if (input.password) {
    if (!input.currentPassword) {
      throw new AppError(400, "Current password is required", "VALIDATION_ERROR");
    }

    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppError(401, "Current password is incorrect", "INVALID_CREDENTIALS");
    }

    data.passwordHash = await bcrypt.hash(input.password, 12);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.user.update({
      where: { id: userId },
      data,
      select: publicUserSelect,
    });

    if (data.displayName !== undefined && user.role === "TUTOR") {
      await tx.tutorProfile.updateMany({
        where: { tutorId: userId },
        data: { displayName: data.displayName },
      });
    }

    return saved;
  });

  return updated;
}

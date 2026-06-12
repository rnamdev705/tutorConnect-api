import type { Role, TuitionCase } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";

/**
 * Returns a case the user may view, or throws 404.
 * We use 404 (not 403) when access is denied to avoid leaking case existence.
 */
export async function getViewableCase(
  userId: string,
  role: Role,
  caseId: string,
): Promise<TuitionCase> {
  const tuitionCase = await prisma.tuitionCase.findUnique({ where: { id: caseId } });

  if (!tuitionCase) {
    throw new AppError(404, "Case not found", "NOT_FOUND");
  }

  if (role === "PARENT" && tuitionCase.ownerId === userId) {
    return tuitionCase;
  }

  if (role === "TUTOR") {
    const invitation = await prisma.caseInvitation.findUnique({
      where: { caseId_tutorId: { caseId, tutorId: userId } },
    });
    if (invitation) return tuitionCase;
  }

  throw new AppError(404, "Case not found", "NOT_FOUND");
}

/** Returns a case only if the user is the owning parent. */
export async function getOwnedCase(
  userId: string,
  caseId: string,
): Promise<TuitionCase> {
  const tuitionCase = await prisma.tuitionCase.findUnique({ where: { id: caseId } });

  if (!tuitionCase) {
    throw new AppError(404, "Case not found", "NOT_FOUND");
  }

  if (tuitionCase.ownerId !== userId) {
    throw new AppError(403, "Only the case owner can perform this action", "FORBIDDEN");
  }

  return tuitionCase;
}

import { CaseStatus, Role, type TuitionCase } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type {
  CaseListQuery,
  CreateCaseInput,
  InviteTutorInput,
  UpdateCaseInput,
} from "../schema/case.schema.js";
import { getOwnedCase, getViewableCase } from "./caseAccess.service.js";

function serializeCase(tuitionCase: TuitionCase) {
  return {
    ...tuitionCase,
    budgetPerHour: Number(tuitionCase.budgetPerHour),
  };
}

function buildListWhere(userId: string, role: Role, query: CaseListQuery) {
  const base =
    role === "PARENT"
      ? { ownerId: userId }
      : { invitations: { some: { tutorId: userId } } };

  return {
    ...base,
    ...(query.search && {
      title: { contains: query.search, mode: "insensitive" as const },
    }),
    ...(query.subject && { subject: query.subject }),
    ...(query.level && { level: query.level }),
    ...(query.status && { status: query.status }),
  };
}

export async function createCase(ownerId: string, input: CreateCaseInput) {
  const tuitionCase = await prisma.tuitionCase.create({
    data: {
      title: input.title,
      subject: input.subject,
      level: input.level,
      location: input.location,
      budgetPerHour: input.budgetPerHour,
      status: input.status ?? CaseStatus.OPEN,
      ownerId,
    },
  });

  return serializeCase(tuitionCase);
}

export async function listCases(userId: string, role: Role, query: CaseListQuery) {
  const where = buildListWhere(userId, role, query);
  const skip = (query.page - 1) * query.limit;

  const [cases, total] = await Promise.all([
    prisma.tuitionCase.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit,
    }),
    prisma.tuitionCase.count({ where }),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

  return {
    data: cases.map(serializeCase),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
    },
  };
}

export async function getCaseById(userId: string, role: Role, caseId: string) {
  await getViewableCase(userId, role, caseId);

  const tuitionCase = await prisma.tuitionCase.findUnique({
    where: { id: caseId },
    include: {
      invitations: {
        include: {
          tutor: {
            select: {
              id: true,
              email: true,
              tutorProfile: { select: { id: true, displayName: true } },
            },
          },
        },
      },
    },
  });

  return {
    ...serializeCase(tuitionCase!),
    invitations: tuitionCase!.invitations.map((inv) => ({
      id: inv.id,
      tutorId: inv.tutorId,
      createdAt: inv.createdAt,
      tutor: {
        id: inv.tutor.id,
        email: inv.tutor.email,
        displayName: inv.tutor.tutorProfile?.displayName ?? null,
        profileId: inv.tutor.tutorProfile?.id ?? null,
      },
    })),
  };
}

export async function updateCase(
  ownerId: string,
  caseId: string,
  input: UpdateCaseInput,
) {
  await getOwnedCase(ownerId, caseId);

  const tuitionCase = await prisma.tuitionCase.update({
    where: { id: caseId },
    data: input,
  });

  return serializeCase(tuitionCase);
}

export async function inviteTutor(
  ownerId: string,
  caseId: string,
  input: InviteTutorInput,
) {
  await getOwnedCase(ownerId, caseId);

  const tutor = await prisma.user.findUnique({
    where: { id: input.tutorId },
    select: { id: true, role: true },
  });

  if (!tutor || tutor.role !== Role.TUTOR) {
    throw new AppError(404, "Tutor not found", "NOT_FOUND");
  }

  const invitation = await prisma.caseInvitation.upsert({
    where: { caseId_tutorId: { caseId, tutorId: input.tutorId } },
    update: {},
    create: { caseId, tutorId: input.tutorId },
    include: {
      tutor: {
        select: {
          id: true,
          email: true,
          tutorProfile: { select: { displayName: true } },
        },
      },
    },
  });

  return {
    id: invitation.id,
    caseId: invitation.caseId,
    tutorId: invitation.tutorId,
    createdAt: invitation.createdAt,
    tutor: {
      id: invitation.tutor.id,
      email: invitation.tutor.email,
      displayName: invitation.tutor.tutorProfile?.displayName ?? null,
    },
  };
}

export async function revokeInvitation(
  ownerId: string,
  caseId: string,
  tutorId: string,
) {
  await getOwnedCase(ownerId, caseId);

  const invitation = await prisma.caseInvitation.findUnique({
    where: { caseId_tutorId: { caseId, tutorId } },
  });

  if (!invitation) {
    throw new AppError(404, "Invitation not found", "NOT_FOUND");
  }

  await prisma.caseInvitation.delete({
    where: { caseId_tutorId: { caseId, tutorId } },
  });
}

import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { TutorListQuery, UpsertProfileInput } from "../schema/tutor.schema.js";
import { getOwnedProfile, getViewableProfile } from "./profileAccess.service.js";

function serializeProfile(profile: {
  id: string;
  tutorId: string;
  displayName: string;
  qualifications: string[];
  experiences: string[];
  createdAt: Date;
  updatedAt: Date;
}) {
  return profile;
}

export async function listTutors(query: TutorListQuery) {
  const where = query.search
    ? { displayName: { contains: query.search, mode: "insensitive" as const } }
    : {};

  const skip = (query.page - 1) * query.limit;

  const [profiles, total] = await Promise.all([
    prisma.tutorProfile.findMany({
      where,
      orderBy: { displayName: "asc" },
      skip,
      take: query.limit,
      select: {
        id: true,
        tutorId: true,
        displayName: true,
        qualifications: true,
        experiences: true,
      },
    }),
    prisma.tutorProfile.count({ where }),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

  return {
    data: profiles,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
    },
  };
}

export async function getProfileById(profileId: string) {
  const profile = await getViewableProfile(profileId);
  return serializeProfile(profile);
}

export async function getMyProfile(tutorId: string) {
  const profile = await getOwnedProfile(tutorId);
  return serializeProfile(profile);
}

export async function upsertMyProfile(tutorId: string, input: UpsertProfileInput) {
  const profile = await prisma.tutorProfile.upsert({
    where: { tutorId },
    create: {
      tutorId,
      displayName: input.displayName,
      qualifications: input.qualifications,
      experiences: input.experiences,
    },
    update: {
      displayName: input.displayName,
      qualifications: input.qualifications,
      experiences: input.experiences,
    },
  });

  return serializeProfile(profile);
}

export async function requireMyProfile(tutorId: string) {
  const profile = await prisma.tutorProfile.findUnique({ where: { tutorId } });

  if (!profile) {
    throw new AppError(
      404,
      "Create your profile before uploading documents",
      "NOT_FOUND",
    );
  }

  return profile;
}

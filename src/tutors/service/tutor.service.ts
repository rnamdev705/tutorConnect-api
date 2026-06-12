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

type TutorListRow = {
  id: string;
  tutorId: string;
  displayName: string;
  qualifications: string[];
  experiences: string[];
};

const TUTOR_SEARCH_WHERE = `
  "displayName" ILIKE $1
  OR EXISTS (SELECT 1 FROM unnest(qualifications) AS q WHERE q ILIKE $1)
  OR EXISTS (SELECT 1 FROM unnest(experiences) AS e WHERE e ILIKE $1)
`;

export async function listTutors(query: TutorListQuery) {
  const search = query.search?.trim();
  const skip = (query.page - 1) * query.limit;

  if (search) {
    const pattern = `%${search}%`;
    const whereClause = TUTOR_SEARCH_WHERE;

    const [profiles, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<TutorListRow[]>(
        `SELECT id, "tutorId", "displayName", qualifications, experiences
         FROM tutor_profiles
         WHERE ${whereClause}
         ORDER BY "displayName" ASC
         LIMIT $2 OFFSET $3`,
        pattern,
        query.limit,
        skip,
      ),
      prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*)::bigint AS count FROM tutor_profiles WHERE ${whereClause}`,
        pattern,
      ),
    ]);

    const total = Number(countRows[0]?.count ?? 0);
    const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

    return {
      data: profiles,
      meta: { page: query.page, limit: query.limit, total, totalPages },
    };
  }

  const [profiles, total] = await Promise.all([
    prisma.tutorProfile.findMany({
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
    prisma.tutorProfile.count(),
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

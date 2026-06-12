import type { TutorProfile } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";

export async function getViewableProfile(profileId: string): Promise<TutorProfile> {
  const profile = await prisma.tutorProfile.findUnique({ where: { id: profileId } });

  if (!profile) {
    throw new AppError(404, "Profile not found", "NOT_FOUND");
  }

  return profile;
}

export async function getOwnedProfile(
  tutorId: string,
): Promise<TutorProfile> {
  const profile = await prisma.tutorProfile.findUnique({ where: { tutorId } });

  if (!profile) {
    throw new AppError(404, "Profile not found", "NOT_FOUND");
  }

  return profile;
}

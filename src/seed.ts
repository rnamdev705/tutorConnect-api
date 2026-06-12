import "dotenv/config";
import { CaseStatus, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const hash = (password: string) => bcrypt.hash(password, 12);

const DEMO_PASSWORD = "Demo1234!";

async function main() {
  console.log("Clearing existing data…");
  await prisma.document.deleteMany();
  await prisma.caseInvitation.deleteMany();
  await prisma.tuitionCase.deleteMany();
  await prisma.tutorProfile.deleteMany();
  await prisma.user.deleteMany();

  const pw = await hash(DEMO_PASSWORD);

  const sarahChen = await prisma.user.create({
    data: {
      email: "sarah.chen@demo.com",
      passwordHash: pw,
      role: "PARENT",
    },
  });
  const rajKumar = await prisma.user.create({
    data: {
      email: "raj.kumar@demo.com",
      passwordHash: pw,
      role: "PARENT",
    },
  });

  const aliceTan = await prisma.user.create({
    data: {
      email: "alice.tan@demo.com",
      passwordHash: pw,
      role: "TUTOR",
    },
  });
  const benjaminLim = await prisma.user.create({
    data: {
      email: "benjamin.lim@demo.com",
      passwordHash: pw,
      role: "TUTOR",
    },
  });

  const p5MathCase = await prisma.tuitionCase.create({
    data: {
      title: "Weekly P5 Math tuition near Bishan — PSLE prep",
      subject: "Math",
      level: "P5",
      location: "Bishan (near Bishan MRT)",
      budgetPerHour: 40,
      status: CaseStatus.OPEN,
      owner: { connect: { id: sarahChen.id } },
    },
  });
  await prisma.tuitionCase.create({
    data: {
      title: "S3 English composition & comprehension",
      subject: "English",
      level: "S3",
      location: "Tampines",
      budgetPerHour: 50,
      status: CaseStatus.OPEN,
      owner: { connect: { id: sarahChen.id } },
    },
  });
  await prisma.tuitionCase.create({
    data: {
      title: "JC1 H2 Chemistry — concept gaps after promos",
      subject: "Chemistry",
      level: "JC1",
      location: "Online (Zoom)",
      budgetPerHour: 70,
      status: CaseStatus.OPEN,
      owner: { connect: { id: rajKumar.id } },
    },
  });

  await prisma.caseInvitation.create({
    data: {
      tuitionCase: { connect: { id: p5MathCase.id } },
      tutor: { connect: { id: aliceTan.id } },
    },
  });

  const aliceProfile = await prisma.tutorProfile.create({
    data: {
      displayName: "Alice Tan",
      qualifications: ["BSc Mathematics, NUS, 2020"],
      experiences: ["3 years teaching P5–P6 Math", "MOE-registered tutor"],
      tutor: { connect: { id: aliceTan.id } },
    },
  });
  await prisma.tutorProfile.create({
    data: {
      displayName: "Benjamin Lim",
      qualifications: ["BA English Literature, NTU, 2019"],
      experiences: ["4 years English composition coaching"],
      tutor: { connect: { id: benjaminLim.id } },
    },
  });

  await prisma.document.create({
    data: {
      originalName: "P5_SA2_Math_paper_2024.pdf",
      storagePath: `cases/${p5MathCase.id}/p5-sa2-math.pdf`,
      mimeType: "application/pdf",
      sizeBytes: 284_512,
      uploadedBy: { connect: { id: sarahChen.id } },
      tuitionCase: { connect: { id: p5MathCase.id } },
    },
  });
  await prisma.document.create({
    data: {
      originalName: "NUS_degree_certificate.pdf",
      storagePath: `profiles/${aliceProfile.id}/degree.pdf`,
      mimeType: "application/pdf",
      sizeBytes: 520_000,
      uploadedBy: { connect: { id: aliceTan.id } },
      profile: { connect: { id: aliceProfile.id } },
    },
  });

  console.log("Seed complete");
  console.log("Password for all accounts:", DEMO_PASSWORD);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

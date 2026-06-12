import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();

async function main(): Promise<void> {
  await prisma.$connect();

  app.listen(env.PORT, () => {
    console.log(`TutorConnect API running on http://localhost:${env.PORT}`);
    console.log(`API base:     http://localhost:${env.PORT}${env.API_PREFIX}`);
    console.log(`API docs:     http://localhost:${env.PORT}/api-docs`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

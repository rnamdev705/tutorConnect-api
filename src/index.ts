import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { startDatabaseKeepAlive, stopDatabaseKeepAlive } from "./lib/dbKeepAlive.js";
import { connectDatabase, prisma } from "./lib/prisma.js";

const app = createApp();

async function main(): Promise<void> {
  await connectDatabase();
  startDatabaseKeepAlive();

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

async function shutdown() {
  stopDatabaseKeepAlive();
  await prisma.$disconnect();
}

process.on("SIGINT", async () => {
  await shutdown();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await shutdown();
  process.exit(0);
});

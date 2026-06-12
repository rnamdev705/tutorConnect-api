import { apiReference } from "@scalar/express-api-reference";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { generateOpenApiDocument } from "./lib/openapi.js";
import apiRoutes from "./routes/index.js";

/** Creates and configures the Express application. */
export function createApp(): express.Application {
  const app = express();
  const openApiDocument = generateOpenApiDocument();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/api-docs.json", (_req, res) => {
    res.json(openApiDocument);
  });

  app.use(
    "/api-docs",
    apiReference({
      theme: "kepler",
      spec: {
        content: openApiDocument,
      },
    }),
  );

  app.use(env.API_PREFIX, apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

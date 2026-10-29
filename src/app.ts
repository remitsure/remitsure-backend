import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { healthRoutes, type HealthDeps } from "./routes/health.js";
import { payeeRoutes } from "./routes/payees.js";
import { remittanceRoutes } from "./routes/remittances.js";
import type { ReadRepository } from "./repositories/types.js";

export interface AppDeps extends HealthDeps {
  repo: ReadRepository;
  corsOrigins: string[];
  logLevel?: string;
  /** Disable in tests so request floods do not trip the limiter. */
  rateLimit?: boolean;
}

export async function buildApp(deps: AppDeps) {
  const app = Fastify({ logger: deps.logLevel ? { level: deps.logLevel } : false });

  await app.register(helmet);
  await app.register(cors, { origin: deps.corsOrigins });
  if (deps.rateLimit !== false) {
    await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
  }

  // Log the real error, but never leak internals (like database hosts) to clients.
  app.setErrorHandler((err: { statusCode?: number; message: string }, req, reply) => {
    const status = err.statusCode && err.statusCode < 500 ? err.statusCode : 500;
    if (status >= 500) req.log.error({ err }, "request failed");
    return reply
      .code(status)
      .send(status >= 500 ? { error: "internal_error" } : { error: err.message });
  });

  await app.register(healthRoutes, { checkDb: deps.checkDb, indexerStatus: deps.indexerStatus });
  await app.register(payeeRoutes, { repo: deps.repo });
  await app.register(remittanceRoutes, { repo: deps.repo });

  return app;
}

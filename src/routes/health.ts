import type { FastifyInstance } from "fastify";

export interface HealthDeps {
  checkDb: () => Promise<boolean>;
  indexerStatus: () => { lastLedger: number | null; running: boolean };
}

export async function healthRoutes(app: FastifyInstance, deps: HealthDeps) {
  // Liveness. Kept dependency free so uptime pings never wake the database.
  app.get("/health", async () => ({ status: "ok" }));

  app.get("/health/ready", async (_req, reply) => {
    const db = await deps.checkDb().catch(() => false);
    const indexer = deps.indexerStatus();
    const body = { status: db ? "ok" : "degraded", db, indexer };
    return reply.code(db ? 200 : 503).send(body);
  });
}

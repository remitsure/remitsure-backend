import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ReadRepository } from "../repositories/types.js";
import { page, stellarAccount } from "./validation.js";

const listQuery = z.object({
  sender: stellarAccount.optional(),
  payee: stellarAccount.optional(),
  status: z.enum(["PENDING", "CLAIMED", "REJECTED", "REFUNDED"]).optional(),
  ...page,
});

export async function remittanceRoutes(app: FastifyInstance, deps: { repo: ReadRepository }) {
  app.get("/remittances", async (req, reply) => {
    const parsed = listQuery.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_query", issues: parsed.error.issues });
    }
    const items = await deps.repo.listRemittances(parsed.data);
    return { items, limit: parsed.data.limit, offset: parsed.data.offset };
  });

  // Public receipt. Anyone with the id can check where the money went.
  app.get("/remittances/:id", async (req, reply) => {
    const parsed = z.object({ id: z.coerce.number().int().positive() }).safeParse(req.params);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_id" });
    const r = await deps.repo.getRemittance(parsed.data.id);
    if (!r) return reply.code(404).send({ error: "not_found" });
    return r;
  });

  app.get("/stats", async () => deps.repo.stats());
}

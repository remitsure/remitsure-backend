import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ReadRepository } from "../repositories/types.js";
import { page, stellarAccount } from "./validation.js";

const listQuery = z.object({
  q: z.string().trim().min(1).max(64).optional(),
  category: z.enum(["SCHOOL", "LANDLORD", "HOSPITAL", "UTILITY", "OTHER"]).optional(),
  verified: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  ...page,
});

export async function payeeRoutes(app: FastifyInstance, deps: { repo: ReadRepository }) {
  app.get("/payees", async (req, reply) => {
    const parsed = listQuery.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_query", issues: parsed.error.issues });
    }
    const items = await deps.repo.listPayees(parsed.data);
    return { items, limit: parsed.data.limit, offset: parsed.data.offset };
  });

  app.get("/payees/:address", async (req, reply) => {
    const parsed = z.object({ address: stellarAccount }).safeParse(req.params);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_address" });
    const payee = await deps.repo.getPayee(parsed.data.address);
    if (!payee) return reply.code(404).send({ error: "not_found" });
    return payee;
  });
}

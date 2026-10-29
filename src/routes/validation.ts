import { z } from "zod";

export const stellarAccount = z.string().regex(/^G[A-Z2-7]{55}$/, "must be a Stellar public key");

export const page = {
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
};

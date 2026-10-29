import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import type { ReadRepository } from "../repositories/types.js";
import { memoryRepo, SCHOOL, SENDER, STRANGER } from "./fakes.js";

function app(repo: ReadRepository = memoryRepo(), checkDb = async () => true) {
  return buildApp({
    repo,
    corsOrigins: ["http://localhost:3000"],
    rateLimit: false,
    checkDb,
    indexerStatus: () => ({ lastLedger: 123, running: true }),
  });
}

describe("health", () => {
  it("liveness is always ok", async () => {
    const res = await (await app()).inject("/health");
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });

  it("readiness reports a down database as 503", async () => {
    const res = await (
      await app(memoryRepo(), async () => {
        throw new Error("db down");
      })
    ).inject("/health/ready");
    expect(res.statusCode).toBe(503);
    expect(res.json()).toMatchObject({ status: "degraded", db: false });
  });
});

describe("payees", () => {
  it("searches by name", async () => {
    const a = await app();
    expect((await a.inject("/payees?q=green")).json().items).toHaveLength(1);
    expect((await a.inject("/payees?q=hospital")).json().items).toHaveLength(0);
  });

  it("filters by category and verified", async () => {
    const a = await app();
    expect((await a.inject("/payees?category=SCHOOL&verified=true")).json().items).toHaveLength(1);
    expect((await a.inject("/payees?category=LANDLORD")).json().items).toHaveLength(0);
  });

  it("rejects an unknown category", async () => {
    expect((await (await app()).inject("/payees?category=BANK")).statusCode).toBe(400);
  });

  it("gets one payee and 404s the rest", async () => {
    const a = await app();
    expect((await a.inject(`/payees/${SCHOOL}`)).json().name).toBe("Greenfield College");
    expect((await a.inject(`/payees/${STRANGER}`)).statusCode).toBe(404);
    expect((await a.inject("/payees/not-a-key")).statusCode).toBe(400);
  });
});

describe("remittances", () => {
  it("lists by sender and payee", async () => {
    const a = await app();
    expect((await a.inject(`/remittances?sender=${SENDER}`)).json().items).toHaveLength(1);
    expect((await a.inject(`/remittances?payee=${SCHOOL}`)).json().items).toHaveLength(1);
    expect((await a.inject(`/remittances?sender=${STRANGER}`)).json().items).toHaveLength(0);
  });

  it("rejects a bad sender address", async () => {
    expect((await (await app()).inject("/remittances?sender=nope")).statusCode).toBe(400);
  });

  it("returns a receipt with the payee profile", async () => {
    const res = await (await app()).inject("/remittances/1");
    expect(res.statusCode).toBe(200);
    expect(res.json().payeeProfile.name).toBe("Greenfield College");
  });

  it("404s an unknown remittance", async () => {
    expect((await (await app()).inject("/remittances/42")).statusCode).toBe(404);
  });

  it("returns stats", async () => {
    const res = await (await app()).inject("/stats");
    expect(res.json()).toEqual({
      remittances: 1,
      pending: 1,
      claimed: 0,
      payees: 1,
      verifiedPayees: 1,
    });
  });
});

describe("errors", () => {
  it("hides internal error details", async () => {
    const broken = {
      ...memoryRepo(),
      listPayees: async () => {
        throw new Error("Can't reach database server at db.internal:5432");
      },
    };
    const res = await (await app(broken)).inject("/payees");
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ error: "internal_error" });
  });
});

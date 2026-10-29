import { describe, expect, it } from "vitest";
import { loadConfig } from "../config.js";

const base = { DATABASE_URL: "postgresql://u:p@localhost:5432/remitsure" };

describe("loadConfig", () => {
  it("applies defaults", () => {
    const c = loadConfig(base);
    expect(c.PORT).toBe(4000);
    expect(c.INDEXER_ENABLED).toBe(true);
    expect(c.REMITSURE_CONTRACT_ID).toBeUndefined();
  });

  it("splits CORS origins", () => {
    const c = loadConfig({ ...base, CORS_ORIGINS: "https://a.app, https://b.app" });
    expect(c.CORS_ORIGINS).toEqual(["https://a.app", "https://b.app"]);
  });

  it("treats an empty contract id as unset", () => {
    expect(
      loadConfig({ ...base, REMITSURE_CONTRACT_ID: "" }).REMITSURE_CONTRACT_ID,
    ).toBeUndefined();
  });

  it("fails loudly without a database url", () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
  });
});

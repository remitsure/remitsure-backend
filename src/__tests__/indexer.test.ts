import { describe, expect, it } from "vitest";
import { oldestRetainedLedger } from "../indexer/indexer.js";

describe("oldestRetainedLedger", () => {
  it("reads the oldest ledger from the RPC retention error", () => {
    const err = {
      code: -32600,
      message: "startLedger must be within the ledger range: 5525444 - 5646403",
    };
    expect(oldestRetainedLedger(err)).toBe(5525444);
  });

  it("returns null for other errors", () => {
    expect(oldestRetainedLedger(new Error("socket hang up"))).toBeNull();
    expect(oldestRetainedLedger({ code: -32600, message: "invalid filter" })).toBeNull();
    expect(oldestRetainedLedger("boom")).toBeNull();
    expect(oldestRetainedLedger(null)).toBeNull();
  });
});

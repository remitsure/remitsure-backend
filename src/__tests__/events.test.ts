import { Address, nativeToScVal, xdr } from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";
import { decodeEvent } from "../indexer/events.js";
import { SCHOOL, SENDER } from "./fakes.js";

const sym = (s: string) => xdr.ScVal.scvSymbol(s);
const u64 = (n: number) => nativeToScVal(n, { type: "u64" });
const addr = (a: string) => new Address(a).toScVal();
const str = (s: string) => xdr.ScVal.scvString(s);
const unitEnum = (variant: string) => xdr.ScVal.scvVec([sym(variant)]);

function map(entries: Record<string, xdr.ScVal>) {
  return xdr.ScVal.scvMap(
    Object.entries(entries)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => new xdr.ScMapEntry({ key: sym(k), val: v })),
  );
}

describe("decodeEvent", () => {
  it("decodes payee_registered with its category", () => {
    const ev = decodeEvent(
      [sym("payee_registered"), addr(SCHOOL)],
      map({ name: str("Greenfield College"), category: unitEnum("School") }),
    );
    expect(ev).toEqual({
      type: "payee_registered",
      payee: SCHOOL,
      name: "Greenfield College",
      category: "SCHOOL",
    });
  });

  it("decodes remittance_sent", () => {
    const ev = decodeEvent(
      [sym("remittance_sent"), u64(7)],
      map({
        sender: addr(SENDER),
        payee: addr(SCHOOL),
        token: addr(SENDER),
        amount: nativeToScVal(2500000000n, { type: "i128" }),
        reference: str("Term 1 fees"),
        expires_at: u64(1790000000),
      }),
    );
    expect(ev).toMatchObject({
      type: "remittance_sent",
      id: 7,
      sender: SENDER,
      payee: SCHOOL,
      amount: "2500000000",
      reference: "Term 1 fees",
      expiresAt: 1790000000,
    });
  });

  it("decodes remittance_refunded", () => {
    const ev = decodeEvent(
      [sym("remittance_refunded"), u64(3)],
      map({ sender: addr(SENDER), amount: nativeToScVal(5n, { type: "i128" }) }),
    );
    expect(ev).toEqual({ type: "remittance_refunded", id: 3, sender: SENDER, amount: "5" });
  });

  it("ignores events it does not store", () => {
    expect(decodeEvent([sym("admin_changed")], xdr.ScVal.scvVoid())).toBeNull();
    expect(decodeEvent([sym("something_else"), u64(1)], xdr.ScVal.scvVoid())).toBeNull();
  });
});

import { scValToNative, xdr } from "@stellar/stellar-sdk";
import type { PayeeCategory } from "../repositories/types.js";

/**
 * Typed versions of the events emitted by remitsure-contracts
 * (contracts/remittance/src/events.rs). If the contract changes an event, this file
 * must change with it.
 */
export type RemitEvent =
  | { type: "payee_registered"; payee: string; name: string; category: PayeeCategory }
  | { type: "payee_verified"; payee: string; verified: boolean }
  | {
      type: "remittance_sent";
      id: number;
      sender: string;
      payee: string;
      token: string;
      amount: string;
      reference: string;
      expiresAt: number;
    }
  | { type: "remittance_claimed"; id: number; payee: string; amount: string }
  | { type: "remittance_rejected"; id: number; payee: string; amount: string }
  | { type: "remittance_refunded"; id: number; sender: string; amount: string };

type Data = Record<string, unknown>;

const str = (v: unknown) => String(v);
const num = (v: unknown) => Number(v);

const categories: Record<string, PayeeCategory> = {
  School: "SCHOOL",
  Landlord: "LANDLORD",
  Hospital: "HOSPITAL",
  Utility: "UTILITY",
  Other: "OTHER",
};

/** Unit enum variants decode as a one element array, for example ["School"]. */
function category(v: unknown): PayeeCategory {
  const name = Array.isArray(v) ? v[0] : v;
  return categories[String(name)] ?? "OTHER";
}

/** Decode one raw Soroban event. Returns null for events this indexer does not store. */
export function decodeEvent(topics: xdr.ScVal[], value: xdr.ScVal): RemitEvent | null {
  const [nameVal, keyVal] = topics;
  if (!nameVal || !keyVal) return null;

  const name = scValToNative(nameVal);
  const key = scValToNative(keyVal);
  const raw = scValToNative(value) as Data | undefined;
  const d: Data = raw && typeof raw === "object" ? raw : {};

  switch (name) {
    case "payee_registered":
      return { type: name, payee: str(key), name: str(d.name), category: category(d.category) };
    case "payee_verified":
      return { type: name, payee: str(key), verified: Boolean(d.verified) };
    case "remittance_sent":
      return {
        type: name,
        id: num(key),
        sender: str(d.sender),
        payee: str(d.payee),
        token: str(d.token),
        amount: str(d.amount),
        reference: str(d.reference),
        expiresAt: num(d.expires_at),
      };
    case "remittance_claimed":
    case "remittance_rejected":
      return { type: name, id: num(key), payee: str(d.payee), amount: str(d.amount) };
    case "remittance_refunded":
      return { type: name, id: num(key), sender: str(d.sender), amount: str(d.amount) };
    default:
      return null;
  }
}

/** Short label for logs. */
export function describe(event: RemitEvent): string {
  return "id" in event ? `${event.type} #${event.id}` : `${event.type} ${event.payee}`;
}

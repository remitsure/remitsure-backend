import type {
  PayeeView,
  ReadRepository,
  RemittanceDetail,
  RemittanceView,
} from "../repositories/types.js";

export const SENDER = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7";
export const SCHOOL = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
export const STRANGER = "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ";

export const school: PayeeView = {
  address: SCHOOL,
  name: "Greenfield College",
  category: "SCHOOL",
  verified: true,
  registeredAt: "2026-10-01T00:00:00.000Z",
};

export const remittance: RemittanceView = {
  id: 1,
  sender: SENDER,
  payee: SCHOOL,
  token: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  amount: "2500000000",
  reference: "Term 1 fees, Ada Obi, JSS2",
  expiresAt: "2026-11-30T00:00:00.000Z",
  status: "PENDING",
  sentAt: "2026-10-28T00:00:00.000Z",
  sentTx: "abc123",
  settledAt: null,
  settledTx: null,
};

export function memoryRepo(
  payees: PayeeView[] = [school],
  remittances: RemittanceView[] = [remittance],
): ReadRepository {
  return {
    async listPayees({ q, category, verified, limit, offset }) {
      return payees
        .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()))
        .filter((p) => !category || p.category === category)
        .filter((p) => verified === undefined || p.verified === verified)
        .slice(offset, offset + limit);
    },
    async getPayee(address) {
      return payees.find((p) => p.address === address) ?? null;
    },
    async listRemittances({ sender, payee, status, limit, offset }) {
      return remittances
        .filter((r) => !sender || r.sender === sender)
        .filter((r) => !payee || r.payee === payee)
        .filter((r) => !status || r.status === status)
        .slice(offset, offset + limit);
    },
    async getRemittance(id): Promise<RemittanceDetail | null> {
      const r = remittances.find((x) => x.id === id);
      if (!r) return null;
      return { ...r, payeeProfile: payees.find((p) => p.address === r.payee) ?? null };
    },
    async stats() {
      return {
        remittances: remittances.length,
        pending: remittances.filter((r) => r.status === "PENDING").length,
        claimed: remittances.filter((r) => r.status === "CLAIMED").length,
        payees: payees.length,
        verifiedPayees: payees.filter((p) => p.verified).length,
      };
    },
  };
}

import type { Payee, PrismaClient, Remittance } from "@prisma/client";
import type { PayeeView, ReadRepository, RemittanceView } from "./types.js";

const payeeView = (p: Payee): PayeeView => ({
  address: p.address,
  name: p.name,
  category: p.category,
  verified: p.verified,
  registeredAt: p.registeredAt.toISOString(),
});

const remittanceView = (r: Remittance): RemittanceView => ({
  id: r.id,
  sender: r.sender,
  payee: r.payee,
  token: r.token,
  amount: r.amount,
  reference: r.reference,
  expiresAt: r.expiresAt.toISOString(),
  status: r.status,
  sentAt: r.sentAt.toISOString(),
  sentTx: r.sentTx,
  settledAt: r.settledAt?.toISOString() ?? null,
  settledTx: r.settledTx,
});

export function prismaReadRepository(db: PrismaClient): ReadRepository {
  return {
    async listPayees({ q, category, verified, limit, offset }) {
      const rows = await db.payee.findMany({
        where: {
          category,
          verified,
          name: q ? { contains: q, mode: "insensitive" } : undefined,
        },
        orderBy: [{ verified: "desc" }, { name: "asc" }],
        take: limit,
        skip: offset,
      });
      return rows.map(payeeView);
    },

    async getPayee(address) {
      const p = await db.payee.findUnique({ where: { address } });
      return p ? payeeView(p) : null;
    },

    async listRemittances({ sender, payee, status, limit, offset }) {
      const rows = await db.remittance.findMany({
        where: { sender, payee, status },
        orderBy: { id: "desc" },
        take: limit,
        skip: offset,
      });
      return rows.map(remittanceView);
    },

    async getRemittance(id) {
      const r = await db.remittance.findUnique({ where: { id } });
      if (!r) return null;
      const p = await db.payee.findUnique({ where: { address: r.payee } });
      return { ...remittanceView(r), payeeProfile: p ? payeeView(p) : null };
    },

    async stats() {
      const [remittances, pending, claimed, payees, verifiedPayees] = await Promise.all([
        db.remittance.count(),
        db.remittance.count({ where: { status: "PENDING" } }),
        db.remittance.count({ where: { status: "CLAIMED" } }),
        db.payee.count(),
        db.payee.count({ where: { verified: true } }),
      ]);
      return { remittances, pending, claimed, payees, verifiedPayees };
    },
  };
}

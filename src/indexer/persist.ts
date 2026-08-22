import type { Prisma, PrismaClient } from "@prisma/client";
import type { RemitEvent } from "./events.js";

export interface EventMeta {
  ledger: number;
  ledgerClosedAt: Date;
  txHash: string;
}

type Tx = Prisma.TransactionClient;

const settled = {
  remittance_claimed: "CLAIMED",
  remittance_rejected: "REJECTED",
  remittance_refunded: "REFUNDED",
} as const;

/** Apply one decoded event to the database. Safe to replay. */
export async function applyEvent(tx: Tx, event: RemitEvent, meta: EventMeta): Promise<void> {
  switch (event.type) {
    case "payee_registered":
      await tx.payee.upsert({
        where: { address: event.payee },
        update: { name: event.name, category: event.category },
        create: {
          address: event.payee,
          name: event.name,
          category: event.category,
          registeredAt: meta.ledgerClosedAt,
        },
      });
      return;

    case "payee_verified":
      // updateMany so a verify for a payee we have not indexed yet is a no op, not a crash.
      await tx.payee.updateMany({
        where: { address: event.payee },
        data: { verified: event.verified },
      });
      return;

    case "remittance_sent":
      await tx.remittance.upsert({
        where: { id: event.id },
        update: {},
        create: {
          id: event.id,
          sender: event.sender,
          payee: event.payee,
          token: event.token,
          amount: event.amount,
          reference: event.reference,
          expiresAt: new Date(event.expiresAt * 1000),
          sentAt: meta.ledgerClosedAt,
          sentTx: meta.txHash,
        },
      });
      return;

    case "remittance_claimed":
    case "remittance_rejected":
    case "remittance_refunded":
      await tx.remittance.updateMany({
        where: { id: event.id },
        data: {
          status: settled[event.type],
          settledAt: meta.ledgerClosedAt,
          settledTx: meta.txHash,
        },
      });
      return;
  }
}

export async function loadCursor(db: PrismaClient, contractId: string): Promise<number | null> {
  const row = await db.indexerCursor.findUnique({ where: { contractId } });
  return row?.lastLedger ?? null;
}

export async function saveCursor(tx: Tx, contractId: string, lastLedger: number): Promise<void> {
  await tx.indexerCursor.upsert({
    where: { contractId },
    update: { lastLedger },
    create: { contractId, lastLedger },
  });
}

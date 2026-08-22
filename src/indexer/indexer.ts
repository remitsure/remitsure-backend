import type { PrismaClient } from "@prisma/client";
import { rpc } from "@stellar/stellar-sdk";
import type { FastifyBaseLogger } from "fastify";
import { decodeEvent, describe } from "./events.js";
import { applyEvent, loadCursor, saveCursor } from "./persist.js";

export interface IndexerOptions {
  db: PrismaClient;
  rpcUrl: string;
  contractId: string;
  pollMs: number;
  startLedger?: number;
  log: FastifyBaseLogger;
}

export interface Indexer {
  start(): void;
  stop(): Promise<void>;
  status(): { lastLedger: number | null; running: boolean };
}

const PAGE_LIMIT = 200;

/** Polls Soroban RPC for contract events and writes them to Postgres. */
export function createIndexer(opts: IndexerOptions): Indexer {
  const server = new rpc.Server(opts.rpcUrl);
  let lastLedger: number | null = null;
  let running = false;
  let timer: NodeJS.Timeout | undefined;
  let inFlight: Promise<void> | undefined;

  async function resolveStartLedger(): Promise<number> {
    const saved = await loadCursor(opts.db, opts.contractId);
    if (saved !== null) return saved + 1;
    if (opts.startLedger) return opts.startLedger;
    return (await server.getLatestLedger()).sequence;
  }

  async function tick(): Promise<void> {
    const startLedger = lastLedger === null ? await resolveStartLedger() : lastLedger + 1;
    const res = await server.getEvents({
      startLedger,
      filters: [{ type: "contract", contractIds: [opts.contractId] }],
      limit: PAGE_LIMIT,
    });

    for (const ev of res.events) {
      const decoded = decodeEvent(ev.topic, ev.value);
      if (!decoded) continue;
      await opts.db.$transaction(async (tx) => {
        await applyEvent(tx, decoded, {
          ledger: ev.ledger,
          ledgerClosedAt: new Date(ev.ledgerClosedAt),
          txHash: ev.txHash,
        });
        await saveCursor(tx, opts.contractId, ev.ledger);
      });
      opts.log.info({ event: describe(decoded) }, "indexed event");
    }

    // Move the cursor even when nothing happened, so the next poll does not rescan.
    const done = res.events.length < PAGE_LIMIT ? res.latestLedger : res.events.at(-1)!.ledger;
    lastLedger = done;
  }

  function schedule() {
    if (!running) return;
    timer = setTimeout(() => {
      inFlight = tick()
        .catch((err) => opts.log.error({ err }, "indexer tick failed"))
        .finally(schedule);
    }, opts.pollMs);
  }

  return {
    start() {
      if (running) return;
      running = true;
      opts.log.info({ contractId: opts.contractId }, "indexer started");
      inFlight = tick()
        .catch((err) => opts.log.error({ err }, "indexer tick failed"))
        .finally(schedule);
    },
    async stop() {
      running = false;
      clearTimeout(timer);
      await inFlight;
    },
    status: () => ({ lastLedger, running }),
  };
}

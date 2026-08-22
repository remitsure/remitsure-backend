// Standalone indexer for when you want it in its own process (for example a Render worker).
import pino from "pino";
import { loadConfig } from "../config.js";
import { prisma } from "../lib/db.js";
import { createIndexer } from "./indexer.js";

const config = loadConfig();
const log = pino({ level: config.LOG_LEVEL });

if (!config.REMITSURE_CONTRACT_ID) {
  log.fatal("REMITSURE_CONTRACT_ID is required");
  process.exit(1);
}

const indexer = createIndexer({
  db: prisma,
  rpcUrl: config.SOROBAN_RPC_URL,
  contractId: config.REMITSURE_CONTRACT_ID,
  pollMs: config.INDEXER_POLL_MS,
  startLedger: config.INDEXER_START_LEDGER,
  log,
});
indexer.start();

const shutdown = async () => {
  await indexer.stop();
  await prisma.$disconnect();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

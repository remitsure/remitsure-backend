import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { prisma } from "./lib/db.js";
import { createIndexer, type Indexer } from "./indexer/indexer.js";
import { prismaReadRepository } from "./repositories/prisma.js";

const config = loadConfig();
let indexer: Indexer | undefined;

const app = await buildApp({
  repo: prismaReadRepository(prisma),
  corsOrigins: config.CORS_ORIGINS,
  logLevel: config.LOG_LEVEL,
  checkDb: async () => {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  },
  indexerStatus: () => indexer?.status() ?? { lastLedger: null, running: false },
});

if (config.INDEXER_ENABLED) {
  if (config.REMITSURE_CONTRACT_ID) {
    indexer = createIndexer({
      db: prisma,
      rpcUrl: config.SOROBAN_RPC_URL,
      contractId: config.REMITSURE_CONTRACT_ID,
      pollMs: config.INDEXER_POLL_MS,
      startLedger: config.INDEXER_START_LEDGER,
      log: app.log,
    });
    indexer.start();
  } else {
    app.log.warn("INDEXER_ENABLED is true but REMITSURE_CONTRACT_ID is empty, indexer not started");
  }
}

const shutdown = async () => {
  await indexer?.stop();
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await app.listen({ port: config.PORT, host: config.HOST });

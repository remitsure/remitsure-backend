# Indexer

The contract is the source of truth. The backend only keeps a read optimised copy so the web app can search payees and show payment history without scanning the chain.

## Flow

1. Every `INDEXER_POLL_MS`, call Soroban RPC `getEvents` for `REMITSURE_CONTRACT_ID`, starting one ledger after the saved cursor.
2. Decode each event with `src/indexer/events.ts`. Unknown events are skipped.
3. Apply it with `src/indexer/persist.ts` and save the cursor in the same database transaction.
4. If nothing came back, move the cursor to the latest ledger so the next poll is cheap.

Every write is an upsert keyed on the RPC event id, so replaying a range is safe.

## First run

With no saved cursor the indexer starts at `INDEXER_START_LEDGER`, or the latest ledger if that is empty. Set it to the deploy ledger of the contract to backfill.

Soroban RPC only keeps about 7 days of events. If the service is down longer than that, events are lost and a backfill from an archive source is needed. This is a known gap.

## Running it

- Inside the API process (default, good for one free Render instance): `INDEXER_ENABLED=true`.
- As its own process: `INDEXER_ENABLED=false` on the API, then `npm run indexer` in a worker.

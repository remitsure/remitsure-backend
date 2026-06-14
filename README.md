<p align="center"><img src="docs/logo.svg" width="96" alt="RemitSure logo"></p>

# remitsure-backend

API, payee directory and Soroban event indexer for **RemitSure**: send money home for a purpose, and be sure it is used for it.

The contract holds the money and enforces the rules. This service watches the contract's events and keeps a queryable copy in Postgres, so the web app can search payees, show a sender everything they have sent, show a school everything waiting to be claimed, and serve a public receipt for every payment.

## Repos

| Repo                                          | What it is                                        |
| --------------------------------------------- | ------------------------------------------------- |
| [remitsure-contracts](../remitsure-contracts) | Soroban contract that locks, releases and refunds |
| **remitsure-backend** (this repo)             | API, event indexer, payee directory               |
| [remitsure-frontend](../remitsure-frontend)   | Next.js app with Stellar wallet                   |

## Stack

Fastify 5, Prisma 6 on Postgres, Zod, Pino, `@stellar/stellar-sdk`, Vitest.

## Quick start

```bash
cp .env.example .env     # set DATABASE_URL and REMITSURE_CONTRACT_ID
npm install
npm run db:migrate
npm run dev              # http://localhost:4000/health
```

| Command              | What it does                              |
| -------------------- | ----------------------------------------- |
| `npm run dev`        | API with reload (indexer runs in process) |
| `npm run indexer`    | Indexer on its own                        |
| `npm test`           | Unit tests                                |
| `npm run check`      | Typecheck, lint, format check, tests      |
| `npm run db:migrate` | Create and apply a migration              |

## Docs

- [API reference](docs/API.md)
- [How the indexer works](docs/INDEXER.md)
- [Environment variables](.env.example)

## Deploying

`render.yaml` sets up the API and a free Postgres on Render. Set `REMITSURE_CONTRACT_ID`, `INDEXER_START_LEDGER` and `CORS_ORIGINS` in the dashboard.

## License

MIT

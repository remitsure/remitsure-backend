# Contributing to remitsure-backend

Thanks for helping out. RemitSure takes part in [Drips Wave](https://www.drips.network/wave), so many issues are scoped for Wave contributors.

## Picking up an issue

1. Look for issues labeled `wave` or `good first issue`.
2. Apply through the Wave app and wait to be assigned before you start.
3. Ask in the issue thread if anything is unclear.

## Setup

You need Node 22.12+ and a Postgres database (local, or a free one from Neon or Supabase).

```bash
cp .env.example .env     # fill in DATABASE_URL and REMITSURE_CONTRACT_ID
npm install
npm run db:migrate
npm run dev
```

Most tests do not need Postgres. Routes are tested against an in memory repository in `src/__tests__/fakes.ts`.

```bash
npm run check   # typecheck, lint, format, tests (same as CI)
```

## Rules of thumb

- New endpoints need a test and an entry in `docs/API.md`.
- Schema changes need a migration (`npm run db:migrate -- --name what_changed`).
- If the contract changes an event, `src/indexer/events.ts` and its tests change in the same PR.
- Keep PRs to one issue and reference it with `Closes #123`.

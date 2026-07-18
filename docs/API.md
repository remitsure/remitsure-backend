# API

Base URL in production: the Render service URL. Locally: `http://localhost:4000`.

Amounts are strings in the token's smallest unit (7 decimals for Stellar assets), because they can exceed JavaScript's safe integer range. Times are ISO 8601.

## Health

### `GET /health`

Liveness. Does not touch the database, so it is safe for uptime pings.

```json
{ "status": "ok" }
```

### `GET /health/ready`

Checks Postgres and reports indexer progress. Returns `503` if the database is down.

```json
{ "status": "ok", "db": true, "indexer": { "lastLedger": 512340, "running": true } }
```

## Payees

### `GET /payees`

| Query      | Type                                                 | Default |
| ---------- | ---------------------------------------------------- | ------- |
| `q`        | Name search, case insensitive                        |         |
| `category` | `SCHOOL`, `LANDLORD`, `HOSPITAL`, `UTILITY`, `OTHER` | any     |
| `verified` | `true` or `false`                                    | any     |
| `limit`    | 1 to 100                                             | 20      |
| `offset`   | 0 or more                                            | 0       |

Verified payees come first, then by name.

```json
{
  "items": [
    {
      "address": "GBBD...",
      "name": "Greenfield College",
      "category": "SCHOOL",
      "verified": true,
      "registeredAt": "2026-10-01T09:00:00.000Z"
    }
  ],
  "limit": 20,
  "offset": 0
}
```

### `GET /payees/:address`

One payee. `404` if not registered.

## Remittances

### `GET /remittances`

| Query    | Type                                         | Default |
| -------- | -------------------------------------------- | ------- |
| `sender` | Stellar public key                           | any     |
| `payee`  | Stellar public key                           | any     |
| `status` | `PENDING`, `CLAIMED`, `REJECTED`, `REFUNDED` | any     |
| `limit`  | 1 to 100                                     | 20      |
| `offset` | 0 or more                                    | 0       |

```json
{
  "items": [
    {
      "id": 1,
      "sender": "GAAZ...",
      "payee": "GBBD...",
      "token": "CDLZ...",
      "amount": "2500000000",
      "reference": "Term 1 fees, Ada Obi, JSS2",
      "expiresAt": "2026-11-30T00:00:00.000Z",
      "status": "CLAIMED",
      "sentAt": "2026-10-28T10:12:00.000Z",
      "sentTx": "9f2c...",
      "settledAt": "2026-10-29T08:01:00.000Z",
      "settledTx": "41ab..."
    }
  ],
  "limit": 20,
  "offset": 0
}
```

### `GET /remittances/:id`

The public receipt. Same fields as above, plus `payeeProfile` (the payee record, or `null` if it has not been indexed yet).

### `GET /stats`

```json
{ "remittances": 12, "pending": 3, "claimed": 8, "payees": 5, "verifiedPayees": 2 }
```

## Errors

| Status | Body                                |
| ------ | ----------------------------------- |
| 400    | `{ "error": "invalid_query", ... }` |
| 404    | `{ "error": "not_found" }`          |
| 500    | `{ "error": "internal_error" }`     |

# GreenLedger prototype

GreenLedger is an evidence-first carbon-claim integrity workflow. It records attestations around registry-issued credits and does **not** mint, tokenize, certify, or replace official registry credits.

## Open the prototype

The stack requires PostgreSQL. For the complete local environment, copy `.env.example` to `.env` and run:

```sh
docker compose up --build
```

Then run `docker compose exec app npm run db:setup` and visit <http://localhost:3000>.

Use **Switch role** in the app to sign in. Local demo credentials are defined in `.env.example` and must be changed before any public deployment:

| Role | Email | Password |
| --- | --- | --- |
| Developer | `developer@greenledger.local` | `greenledger-dev` |
| Verifier | `verifier@greenledger.local` | `greenledger-verify` |
| Beneficiary | `beneficiary@greenledger.local` | `greenledger-retire` |

## Demo flow

1. Start at **Evidence intake** and select one of the three public-data demo scenarios.
2. Extract evidence to populate the validated fields and source provenance.
3. Screen the claim:
   - **Forest Guard Reserve** is blocked by an exact serial-range overlap.
   - **Amazon Reforestation** requires human review due to strong contextual overlap.
   - **Solar Karnataka** is eligible for a verifier decision.
4. In **Verifier queue**, verify Solar Karnataka.
5. Open its public certificate and retire the verified claim.

## Included prototype views

- Integrity Dashboard
- Evidence Intake
- Risk Review
- Verifier Queue
- Public Claim / Retirement Certificate

## Backend API and roles

- `GET /api/health` — backend and storage status
- `GET /api/demo-projects` — curated snapshot and demo records
- `POST /api/auth/login` — returns a signed access token for a demo developer, verifier, or beneficiary account
- `GET /api/claims` — authenticated claim records
- `POST /api/evidence/extract` — downloads a public HTTPS PDF or returns evidence for a known `demoKey`
- `POST /api/claims/screen` — evaluates duplicate, review, and eligible rules
- `POST /api/claims/:id/verify` — verifier-only PostgreSQL approval of an eligible claim
- `POST /api/claims/:id/retire` — beneficiary-only PostgreSQL retirement of an active verified claim

Run `npm test` to exercise canonical-key, duplicate, review, and eligible paths.

## Deliberate prototype boundaries

- Public source URLs and labelled sample metadata only; no private documents or registry scraping.
- The curated metadata snapshot and its synthetic serial fixtures are documented in `DATA_PROVENANCE.md`; the adapter switches to a CAD Trust API when configured.
- Polygon references are illustrative until a deployed testnet contract address and server-side signer are configured.
- Claims persist in PostgreSQL. There are no wallet keys or blockchain calls.

See `ARCHITECTURE.md`, `DEPLOYMENT.md`, and `HACKATHON_DEMO.md` for the handoff package.

For visual foundations, component rules, status language, and token guidance, see `DESIGN_SYSTEM.md` and `greenledger-design-system.html`.

# Deployment guide

## Local PostgreSQL stack

1. Copy `.env.example` to `.env` and set a unique `AUTH_SECRET`.
2. Start PostgreSQL and the app:

   ```sh
   docker compose up --build
   ```

3. In another terminal, initialise the schema and seed the curated duplicate fixture:

   ```sh
   docker compose exec app npm run db:setup
   ```

4. Open `http://localhost:3000`.

## Public deployment requirements

Deploy the `Dockerfile` to any container host and point `DATABASE_URL` at a managed PostgreSQL instance. Configure these variables in the host's secret manager:

- `NODE_ENV=production`
- `DATABASE_URL` and, where required, `DATABASE_SSL=true`
- A unique long `AUTH_SECRET`
- Non-default verifier/developer/beneficiary credentials, or an identity-provider integration
- `CAD_TRUST_API_URL` and `CAD_TRUST_API_TOKEN` when approved
- `PDF_ALLOWED_HOSTS` if public-PDF retrieval should be allow-listed

## Production checks

- Run `npm test` before deployment.
- Run `npm run db:migrate`, then `npm run db:seed` only for a demo environment.
- Confirm `/api/health` reports `storage: PostgreSQL` and the intended CAD Trust adapter mode.
- Never expose the seeded demo credentials in a public deployment.
- Set a real public URL only after replacing the demo account implementation with your chosen identity provider.

## On-chain handoff

The verification and retirement endpoints are deliberately storage-first. When the Polygon contract is ready, add the transaction submission after PostgreSQL persistence is prepared, then replace `onchain_status: not-configured` with the transaction hash and explorer URL. Keep contract keys server-side only.

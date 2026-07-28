const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createPool, ClaimRepository } = require('../db');

const seed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'initial-claims.json'), 'utf8'));
const key = (claim) => crypto.createHash('sha256').update([claim.registry, claim.projectId, claim.serialStart, claim.serialEnd].map((v) => String(v).trim().toLowerCase()).join('|')).digest('hex');
(async () => {
  const pool = createPool(); const repo = new ClaimRepository(pool);
  try { await repo.migrate(); for (const claim of seed) { if (await repo.findByCanonicalKey(key(claim))) continue; await repo.createClaim({ ...claim, canonicalKey: key(claim), source: { url: claim.sourceUrl, hashSha256: crypto.createHash('sha256').update(claim.sourceUrl).digest('hex'), type: claim.sourceType, citations: [], fixtureNote: claim.fixtureNote }, verifiedBy: claim.verifiedBy }); } console.log('Seed data loaded.'); }
  finally { await pool.end(); }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });

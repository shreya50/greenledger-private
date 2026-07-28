const { Pool } = require('pg');
const fs = require('node:fs');
const path = require('node:path');

function createPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required. Set it to a PostgreSQL connection string.');
  return new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined });
}

class ClaimRepository {
  constructor(pool) { this.pool = pool; }
  async migrate() { await this.pool.query(fs.readFileSync(path.join(__dirname, 'migrations', '001_initial.sql'), 'utf8')); }
  async health() { await this.pool.query('select 1'); return true; }
  async listClaims() { return (await this.pool.query('select * from claims order by created_at desc')).rows.map(mapClaim); }
  async getClaim(id) { const result = await this.pool.query('select * from claims where id = $1', [id]); return result.rowCount ? mapClaim(result.rows[0]) : null; }
  async findByCanonicalKey(key) { const result = await this.pool.query('select * from claims where canonical_key = $1', [key]); return result.rowCount ? mapClaim(result.rows[0]) : null; }
  async createClaim(claim) {
    const result = await this.pool.query(`insert into claims (id, canonical_key, status, registry, project_id, project_name, country, methodology, vintage, serial_start, serial_end, estimated_tco2e, source_url, source_hash_sha256, source_type, citations, fixture_note, verified_by, verified_at, onchain_status)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,now(),$19) returning *`, [
      claim.id, claim.canonicalKey, 'verified', claim.registry, claim.projectId, claim.projectName, claim.country, claim.methodology, claim.vintage, claim.serialStart, claim.serialEnd, claim.estimatedTco2e, claim.source.url, claim.source.hashSha256, claim.source.type, JSON.stringify(claim.source.citations), claim.source.fixtureNote || null, claim.verifiedBy, 'not-configured'
    ]);
    return mapClaim(result.rows[0]);
  }
  async retireClaim(id, beneficiary) {
    const result = await this.pool.query(`update claims set status = 'retired', retired_by = $2, retired_at = now(), updated_at = now() where id = $1 and status = 'verified' returning *`, [id, beneficiary]);
    return result.rowCount ? mapClaim(result.rows[0]) : null;
  }
}

function mapClaim(row) {
  return {
    id: row.id, canonicalKey: row.canonical_key, status: row.status, registry: row.registry, projectId: row.project_id, projectName: row.project_name,
    country: row.country, methodology: row.methodology, vintage: row.vintage, serialStart: row.serial_start, serialEnd: row.serial_end,
    estimatedTco2e: Number(row.estimated_tco2e), source: { url: row.source_url, hashSha256: row.source_hash_sha256, type: row.source_type, citations: row.citations, fixtureNote: row.fixture_note },
    verifiedBy: row.verified_by, verifiedAt: row.verified_at, retiredBy: row.retired_by, retiredAt: row.retired_at, onchain: { status: row.onchain_status }, createdAt: row.created_at, updatedAt: row.updated_at
  };
}

module.exports = { createPool, ClaimRepository };

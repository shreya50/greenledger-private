const { createPool, ClaimRepository } = require('../db');

(async () => {
  const pool = createPool();
  try { await new ClaimRepository(pool).migrate(); console.log('PostgreSQL migration complete.'); }
  finally { await pool.end(); }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });

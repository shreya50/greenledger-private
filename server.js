const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createPool, ClaimRepository } = require('./db');
const { login, requireRole } = require('./auth');
const { extractPublicPdf, validateEvidence } = require('./pdfExtractor');
const cadTrust = require('./cadTrustAdapter');

const ROOT = __dirname;
const PROJECTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'demo-projects.json'), 'utf8'));

function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function canonicalKey(record) { return sha256([record.registry, record.projectId, record.serialStart, record.serialEnd].map((value) => String(value || '').trim().toLowerCase()).join('|')); }
function findDemoProject(body) { const key = body.demoKey || body.projectId; const project = PROJECTS.projects.find((item) => item.demoKey === key || item.sourceUrl === body.sourceUrl); if (!project) throw Object.assign(new Error('No curated demo record matches this source.'), { status: 422 }); return project; }
function demoEvidence(body) { const project = findDemoProject(body); const sourceUrl = body.sourceUrl || project.sourceUrl; return { evidence: { registry: project.registry, projectId: project.projectId, projectName: project.projectName, country: project.country, methodology: project.methodology, vintage: project.vintage, serialStart: project.serialStart, serialEnd: project.serialEnd, estimatedTco2e: project.estimatedTco2e, source: { url: sourceUrl, hashSha256: sha256(sourceUrl), type: project.sourceType, citations: [{ field: 'projectName', page: null, excerpt: project.citation }], fixtureNote: project.fixtureNote } }, validation: { valid: true, extractedAt: new Date().toISOString(), source: 'curated-demo-record' } }; }

async function screenClaim(evidence, repository) {
  const key = canonicalKey(evidence);
  const exact = await repository.findByCanonicalKey(key);
  if (exact) return { canonicalKey: key, disposition: 'blocked', riskScore: 100, matches: [{ id: exact.id, status: exact.status, match: 'exact-canonical-key' }], signals: [{ severity: 'block', label: 'Exact canonical claim key already exists', detail: 'Registry, project ID, and serial range match a previously verified GreenLedger claim.' }], explanation: 'This submission is blocked because the canonical claim key is already present. This prevents duplicate GreenLedger attestations; it does not decide registry ownership.' };
  const matches = await cadTrust.findProjectMatches(evidence);
  if (matches.length) return { canonicalKey: key, disposition: 'review', riskScore: 64, matches, signals: [{ severity: 'strong', label: 'Registry project metadata overlaps a snapshot record', detail: 'A verifier must inspect cited sources before deciding.' }, { severity: 'medium', label: 'Canonical key differs', detail: 'No exact serial range match was found, so the claim is not automatically blocked.' }], explanation: 'Project metadata overlaps a CAD Trust-compatible data source. A verifier must decide after reviewing the cited evidence.' };
  return { canonicalKey: key, disposition: 'eligible', riskScore: 8, matches: [], signals: [{ severity: 'clear', label: 'No matching canonical key or project metadata', detail: 'The claim is eligible for independent verifier review.' }], explanation: 'No meaningful match was found in PostgreSQL records or the configured CAD Trust adapter. Eligibility is not approval and does not establish a registry-issued credit.' };
}

function json(response, status, payload) { response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); response.end(JSON.stringify(payload, null, 2)); }
function readJson(request) { return new Promise((resolve, reject) => { let body = ''; request.on('data', (chunk) => { body += chunk; if (body.length > 1_000_000) request.destroy(); }); request.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(Object.assign(new Error('Request body must be valid JSON.'), { status: 400 })); } }); request.on('error', reject); }); }
function serveStatic(response, pathname) { const requested = pathname === '/' ? '/index.html' : pathname; const filePath = path.normalize(path.join(ROOT, requested)); if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return false; const types = { '.html': 'text/html; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript' }; response.writeHead(200, { 'content-type': types[path.extname(filePath)] || 'application/octet-stream' }); fs.createReadStream(filePath).pipe(response); return true; }

function createServer(repository) {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    try {
      if (request.method === 'POST' && url.pathname === '/api/auth/login') { const body = await readJson(request); return json(response, 200, login(body.email, body.password)); }
      if (request.method === 'GET' && url.pathname === '/api/health') { await repository.health(); return json(response, 200, { ok: true, storage: 'PostgreSQL', onchain: 'not configured', cadTrust: cadTrust.metadata() }); }
      if (request.method === 'GET' && url.pathname === '/api/demo-projects') return json(response, 200, { ...PROJECTS, adapter: cadTrust.metadata() });
      if (request.method === 'GET' && url.pathname === '/api/claims') { requireRole(request, ['developer', 'verifier', 'beneficiary']); return json(response, 200, { claims: await repository.listClaims() }); }
      if (request.method === 'POST' && url.pathname === '/api/evidence/extract') { requireRole(request, ['developer', 'verifier']); const body = await readJson(request); const result = body.sourceUrl && !body.demoKey ? await extractPublicPdf(body.sourceUrl) : demoEvidence(body); return json(response, 200, result); }
      if (request.method === 'POST' && url.pathname === '/api/claims/screen') { requireRole(request, ['developer', 'verifier']); const body = await readJson(request); const extraction = body.evidence ? { evidence: body.evidence, validation: validateEvidence(body.evidence) } : (body.sourceUrl && !body.demoKey ? await extractPublicPdf(body.sourceUrl) : demoEvidence(body)); if (!extraction.validation.valid) return json(response, 422, { error: 'Evidence validation failed; required fields need page citations.', ...extraction }); return json(response, 200, { ...extraction, screening: await screenClaim(extraction.evidence, repository), adapter: cadTrust.metadata() }); }
      const verify = url.pathname.match(/^\/api\/claims\/([^/]+)\/verify$/);
      if (request.method === 'POST' && verify) { const user = requireRole(request, ['verifier']); const body = await readJson(request); const extraction = body.evidence ? { evidence: body.evidence, validation: validateEvidence(body.evidence) } : (body.sourceUrl && !body.demoKey ? await extractPublicPdf(body.sourceUrl) : demoEvidence(body)); if (!extraction.validation.valid) return json(response, 422, { error: 'Evidence validation failed.', ...extraction }); const screening = await screenClaim(extraction.evidence, repository); if (screening.disposition !== 'eligible') return json(response, 409, { error: 'Only eligible claims can be verified.', screening }); const claim = await repository.createClaim({ id: verify[1], ...extraction.evidence, canonicalKey: screening.canonicalKey, verifiedBy: user.email }); return json(response, 201, { claim, note: 'Stored in PostgreSQL. No blockchain transaction has been submitted.' }); }
      const retire = url.pathname.match(/^\/api\/claims\/([^/]+)\/retire$/);
      if (request.method === 'POST' && retire) { const user = requireRole(request, ['beneficiary']); const claim = await repository.retireClaim(retire[1], user.email); if (!claim) return json(response, 409, { error: 'Claim is missing or is no longer active.' }); return json(response, 200, { claim, note: 'Stored in PostgreSQL. No blockchain transaction has been submitted.' }); }
      if (request.method === 'GET' && serveStatic(response, url.pathname)) return;
      return json(response, 404, { error: 'Not found.' });
    } catch (error) { return json(response, error.status || 500, { error: error.message || 'Unexpected server error.' }); }
  });
}

async function start() { const pool = createPool(); const repository = new ClaimRepository(pool); const port = Number(process.env.PORT || 3000); createServer(repository).listen(port, () => console.log(`GreenLedger running at http://localhost:${port}`)); }
if (require.main === module) start().catch((error) => { console.error(error.message); process.exitCode = 1; });
module.exports = { canonicalKey, demoEvidence, screenClaim, createServer };

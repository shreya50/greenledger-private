const test = require('node:test');
const assert = require('node:assert/strict');
const { canonicalKey, demoEvidence, screenClaim } = require('../server');
const { login } = require('../auth');
const { validateEvidence } = require('../pdfExtractor');

function repositoryWith(claims) { return { findByCanonicalKey: async (key) => claims.find((claim) => claim.canonicalKey === key) || null }; }

test('canonical key is stable for the same evidence', () => {
  const evidence = demoEvidence({ demoKey: 'katingan-duplicate' }).evidence;
  assert.equal(canonicalKey(evidence), canonicalKey({ ...evidence, registry: ' verra vcs ' }));
});

test('duplicate fixture is blocked by exact canonical key', async () => {
  const evidence = demoEvidence({ demoKey: 'katingan-duplicate' }).evidence;
  const result = await screenClaim(evidence, repositoryWith([{ id: 'existing', canonicalKey: canonicalKey(evidence), status: 'verified' }]));
  assert.equal(result.disposition, 'blocked');
});

test('same real project with a different serial fixture requires review', async () => {
  const evidence = demoEvidence({ demoKey: 'katingan-review' }).evidence;
  assert.equal((await screenClaim(evidence, repositoryWith([]))).disposition, 'review');
});

test('labelled eligible fixture can enter the verifier workflow', async () => {
  const evidence = demoEvidence({ demoKey: 'eligible-fixture' }).evidence;
  assert.equal((await screenClaim(evidence, repositoryWith([]))).disposition, 'eligible');
});

test('demo verifier receives a signed role token', () => {
  const result = login('verifier@greenledger.local', 'greenledger-verify');
  assert.equal(result.user.role, 'verifier');
  assert.match(result.accessToken, /\./);
});

test('evidence validation requires citations for identity fields', () => {
  const evidence = demoEvidence({ demoKey: 'katingan-review' }).evidence;
  evidence.source.citations = [];
  assert.equal(validateEvidence(evidence).valid, false);
});

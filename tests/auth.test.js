const test = require('node:test');
const assert = require('node:assert/strict');
const { login, requireRole, verify } = require('../auth');

function requestFor(token) { return { headers: { authorization: `Bearer ${token}` } }; }

test('invalid credentials are rejected', () => {
  assert.throws(() => login('verifier@greenledger.local', 'incorrect'), { status: 401 });
});

test('a verifier token grants verifier access', () => {
  const { accessToken } = login('verifier@greenledger.local', 'greenledger-verify');
  assert.equal(requireRole(requestFor(accessToken), ['verifier']).role, 'verifier');
});

test('a beneficiary token cannot verify claims', () => {
  const { accessToken } = login('beneficiary@greenledger.local', 'greenledger-retire');
  assert.throws(() => requireRole(requestFor(accessToken), ['verifier']), { status: 403 });
});

test('a tampered token is rejected', () => {
  const { accessToken } = login('developer@greenledger.local', 'greenledger-dev');
  assert.throws(() => verify(`${accessToken}x`), { status: 401 });
});

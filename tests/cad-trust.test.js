const test = require('node:test');
const assert = require('node:assert/strict');
const adapter = require('../cadTrustAdapter');

test('snapshot adapter returns a match for public Katingan project metadata', async () => {
  const matches = await adapter.findProjectMatches({ registry: 'Verra VCS', projectId: '1477' });
  assert.ok(matches.length >= 1);
  assert.equal(matches[0].source, 'curated-snapshot');
  assert.equal(matches[0].projectName, 'Katingan Peatland Restoration and Conservation Project');
});

test('snapshot adapter does not treat the labelled eligible fixture as registry metadata', async () => {
  const matches = await adapter.findProjectMatches({ registry: 'GreenLedger demonstration registry', projectId: 'GL-SOLAR-001' });
  assert.deepEqual(matches, []);
});

test('adapter reports its snapshot mode unless live credentials are configured', () => {
  assert.equal(adapter.metadata().mode, 'curated-snapshot');
});

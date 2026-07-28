const test = require('node:test');
const assert = require('node:assert/strict');
const { validateEvidence, validatePublicUrl } = require('../pdfExtractor');

test('public evidence requires HTTPS', () => {
  assert.throws(() => validatePublicUrl('http://example.com/report.pdf'), { status: 422 });
  assert.equal(validatePublicUrl('https://example.com/report.pdf').hostname, 'example.com');
});

test('an allow-list prevents unsupported PDF hosts', () => {
  const original = process.env.PDF_ALLOWED_HOSTS;
  process.env.PDF_ALLOWED_HOSTS = 'registry.verra.org';
  assert.throws(() => validatePublicUrl('https://example.com/report.pdf'), { status: 422 });
  assert.equal(validatePublicUrl('https://registry.verra.org/report.pdf').hostname, 'registry.verra.org');
  if (original === undefined) delete process.env.PDF_ALLOWED_HOSTS; else process.env.PDF_ALLOWED_HOSTS = original;
});

test('required evidence fields need their own page citations', () => {
  const evidence = {
    registry: 'Verra VCS', projectId: '1477', projectName: 'Example Project', country: 'Indonesia', methodology: 'VM0007', vintage: '2020',
    source: { citations: [
      { field: 'registry', page: 1 }, { field: 'projectId', page: 1 }, { field: 'projectName', page: 1 },
      { field: 'country', page: 2 }, { field: 'methodology', page: 2 }, { field: 'vintage', page: 2 }
    ] }
  };
  assert.equal(validateEvidence(evidence).valid, true);
  evidence.source.citations.pop();
  assert.deepEqual(validateEvidence(evidence).uncitedFields, ['vintage']);
});

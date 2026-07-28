const fs = require('node:fs');
const path = require('node:path');

const snapshot = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'demo-projects.json'), 'utf8'));

async function findProjectMatches(evidence) {
  if (process.env.CAD_TRUST_API_URL && process.env.CAD_TRUST_API_TOKEN) return findLiveMatches(evidence);
  return findSnapshotMatches(evidence);
}
function findSnapshotMatches(evidence) {
  return snapshot.projects.filter((project) => project.sourceType !== 'labelled-demo-fixture' && project.registry === evidence.registry && project.projectId === evidence.projectId).map((project) => ({ source: 'curated-snapshot', projectId: project.projectId, projectName: project.projectName, country: project.country, methodology: project.methodology, vintage: project.vintage, sourceUrl: project.sourceUrl }));
}
async function findLiveMatches(evidence) {
  const target = new URL(process.env.CAD_TRUST_API_URL);
  target.searchParams.set('registry', evidence.registry); target.searchParams.set('projectId', evidence.projectId);
  const response = await fetch(target, { headers: { authorization: `Bearer ${process.env.CAD_TRUST_API_TOKEN}`, accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw Object.assign(new Error(`CAD Trust API request failed with ${response.status}.`), { status: 502 });
  const payload = await response.json();
  const records = Array.isArray(payload) ? payload : (payload.results || payload.data || []);
  return records.map((record) => ({ source: 'cad-trust-live-api', projectId: record.projectId || record.project_id, projectName: record.projectName || record.project_name, country: record.country, methodology: record.methodology, vintage: record.vintage, sourceUrl: record.sourceUrl || record.source_url }));
}
function metadata() { return { mode: process.env.CAD_TRUST_API_URL && process.env.CAD_TRUST_API_TOKEN ? 'live-api' : 'curated-snapshot', snapshot: snapshot.snapshot }; }

module.exports = { findProjectMatches, metadata };

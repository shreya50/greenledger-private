const crypto = require('node:crypto');
const pdf = require('pdf-parse');

const MAX_BYTES = 12 * 1024 * 1024;
const REQUIRED_FIELDS = ['registry', 'projectId', 'projectName', 'country', 'methodology', 'vintage'];

function validatePublicUrl(rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch { throw Object.assign(new Error('sourceUrl must be a valid absolute URL.'), { status: 422 }); }
  if (url.protocol !== 'https:') throw Object.assign(new Error('Only HTTPS public PDF URLs are accepted.'), { status: 422 });
  if (process.env.PDF_ALLOWED_HOSTS) {
    const allowed = process.env.PDF_ALLOWED_HOSTS.split(',').map((host) => host.trim()).filter(Boolean);
    if (!allowed.includes(url.hostname)) throw Object.assign(new Error('This PDF host is not in PDF_ALLOWED_HOSTS.'), { status: 422 });
  }
  return url;
}
async function downloadPdf(sourceUrl) {
  const response = await fetch(sourceUrl, { redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { accept: 'application/pdf' } });
  if (!response.ok) throw Object.assign(new Error(`PDF download failed with ${response.status}.`), { status: 422 });
  const type = response.headers.get('content-type') || '';
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw Object.assign(new Error('PDF exceeds the 12 MB evidence limit.'), { status: 422 });
  if (!type.includes('pdf') && bytes.subarray(0, 4).toString() !== '%PDF') throw Object.assign(new Error('The supplied URL did not return a PDF.'), { status: 422 });
  return bytes;
}
function match(text, expressions) { for (const expression of expressions) { const found = text.match(expression); if (found?.[1]) return found[1].trim().replace(/\s+/g, ' '); } return null; }
function locatePage(pages, value) { const index = pages.findIndex((page) => page.toLowerCase().includes(String(value || '').toLowerCase())); return index >= 0 ? index + 1 : null; }
function inferEvidence(text, pages, sourceUrl, hash) {
  const evidence = {
    registry: match(text, [/\b(Verra(?:\s+VCS)?|Gold Standard)\b/i]),
    projectId: match(text, [/Project\s*(?:ID|No\.?|Number)\s*[:#]?\s*([A-Z]{0,5}\s*\d{2,8})/i, /\b(?:VCS|GS)\s*(\d{2,8})\b/i]),
    projectName: match(text, [/(?:Project Title|Project Name)\s*[:\n]\s*([^\n]{5,180})/i]),
    country: match(text, [/(?:Country|Host Country)\s*[:\n]\s*([A-Za-z][A-Za-z ,.-]{2,80})/i]),
    methodology: match(text, [/(?:Methodology|Method)\s*[:\n]\s*([A-Z]{1,5}\d{3,6}[^\n]{0,90})/i]),
    vintage: match(text, [/(?:Vintage|Monitoring Period)\s*[:\n]\s*((?:19|20)\d{2})/i]),
    source: { url: sourceUrl, hashSha256: hash, type: 'public-pdf', citations: [], fixtureNote: null }
  };
  for (const [field, value] of Object.entries(evidence)) if (value && field !== 'source') { const page = locatePage(pages, value); if (page) evidence.source.citations.push({ field, page, excerpt: pages[page - 1].replace(/\s+/g, ' ').slice(0, 240) }); }
  return evidence;
}
function validateEvidence(evidence) {
  const missing = REQUIRED_FIELDS.filter((field) => !evidence[field]);
  const cited = new Set(evidence.source.citations.map((citation) => citation.field));
  return { valid: missing.length === 0 && REQUIRED_FIELDS.every((field) => cited.has(field)), missingFields: missing, uncitedFields: REQUIRED_FIELDS.filter((field) => !cited.has(field)) };
}
async function extractPublicPdf(sourceUrl) {
  const url = validatePublicUrl(sourceUrl);
  const bytes = await downloadPdf(url);
  const parsed = await pdf(bytes);
  const pages = parsed.text.split(/\f/).filter(Boolean);
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  const evidence = inferEvidence(parsed.text, pages, url.toString(), hash);
  return { evidence, validation: { ...validateEvidence(evidence), extractedAt: new Date().toISOString(), pageCount: pages.length, byteLength: bytes.length } };
}

module.exports = { extractPublicPdf, validateEvidence, validatePublicUrl };

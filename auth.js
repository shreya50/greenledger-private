const crypto = require('node:crypto');

const roles = ['developer', 'verifier', 'beneficiary'];

function secret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET is required in production.');
  return 'greenledger-development-secret-change-me';
}
function base64url(value) { return Buffer.from(value).toString('base64url'); }
function sign(payload) { const encoded = base64url(JSON.stringify(payload)); return `${encoded}.${crypto.createHmac('sha256', secret()).update(encoded).digest('base64url')}`; }
function verify(token) { const [encoded, signature] = String(token || '').split('.'); const expected = crypto.createHmac('sha256', secret()).update(encoded || '').digest('base64url'); const supplied = Buffer.from(signature || ''); const calculated = Buffer.from(expected); if (!encoded || !signature || supplied.length !== calculated.length || !crypto.timingSafeEqual(supplied, calculated)) throw Object.assign(new Error('Invalid access token.'), { status: 401 }); const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')); if (payload.exp < Date.now()) throw Object.assign(new Error('Access token expired.'), { status: 401 }); return payload; }
function demoAccounts() {
  return [
    { email: process.env.DEMO_DEVELOPER_EMAIL || 'developer@greenledger.local', password: process.env.DEMO_DEVELOPER_PASSWORD || 'greenledger-dev', role: 'developer', name: 'Devon Patel' },
    { email: process.env.DEMO_VERIFIER_EMAIL || 'verifier@greenledger.local', password: process.env.DEMO_VERIFIER_PASSWORD || 'greenledger-verify', role: 'verifier', name: 'Avery Chen' },
    { email: process.env.DEMO_BENEFICIARY_EMAIL || 'beneficiary@greenledger.local', password: process.env.DEMO_BENEFICIARY_PASSWORD || 'greenledger-retire', role: 'beneficiary', name: 'Northstar Foods' }
  ];
}
function login(email, password) { const account = demoAccounts().find((item) => item.email === email && item.password === password); if (!account) throw Object.assign(new Error('Invalid email or password.'), { status: 401 }); const user = { email: account.email, role: account.role, name: account.name }; return { user, accessToken: sign({ ...user, exp: Date.now() + 1000 * 60 * 60 * 8 }) }; }
function requireRole(request, allowedRoles) { const token = request.headers.authorization?.replace(/^Bearer\s+/i, ''); const user = verify(token); if (!allowedRoles.includes(user.role)) throw Object.assign(new Error(`This action requires one of: ${allowedRoles.join(', ')}.`), { status: 403 }); return user; }

module.exports = { roles, login, requireRole, verify };

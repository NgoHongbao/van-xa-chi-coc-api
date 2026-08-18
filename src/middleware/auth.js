import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { authenticateUser } from '../services/auth.service.js';

const TOKEN_TTL = 12 * 60 * 60;
const encode = (value) => Buffer.from(value).toString('base64url');
const sign = (payload) => crypto.createHmac('sha256', env.authSecret).update(payload).digest('base64url');

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function createToken(user) {
  const payload = encode(JSON.stringify({ sub: user.id, username: user.username, role: user.role, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL }));
  return `${payload}.${sign(payload)}`;
}

export async function login(req, res, next) {
  const { username = '', password = '' } = req.body || {};
  try {
    const user = await authenticateUser(username, password);
    if (!user) return res.status(401).json({ success: false, code: 'INVALID_CREDENTIALS', message: 'Tài khoản hoặc mật khẩu không đúng.' });
    return res.json({ token: createToken(user), user, expiresIn: TOKEN_TTL });
  } catch (error) {
    return next(error);
  }
}

export function requireAuth(req, res, next) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload))) {
    return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập để tiếp tục.' });
  }
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (session.exp <= Math.floor(Date.now() / 1000) || !session.sub || !session.username) throw new Error('expired');
    req.user = session;
    return next();
  } catch {
    return res.status(401).json({ success: false, code: 'SESSION_EXPIRED', message: 'Phiên đăng nhập đã hết hạn.' });
  }
}

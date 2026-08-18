import crypto from 'node:crypto';
import { getDatabase } from '../database/mongodb.js';
import { env } from '../config/env.js';

const KEY_LENGTH = 64;
const normalizeUsername = (value) => String(value || '').trim().toLowerCase();

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, KEY_LENGTH).toString('hex');
  return { salt, hash };
}

function passwordMatches(password, user) {
  const candidate = Buffer.from(hashPassword(password, user.passwordSalt).hash, 'hex');
  const stored = Buffer.from(user.passwordHash, 'hex');
  return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
}

export async function ensureInitialUser() {
  const users = getDatabase().collection('users');
  await users.createIndex({ username: 1 }, { unique: true });
  const username = normalizeUsername(env.authUsername);
  if (await users.findOne({ username })) return;

  const { salt, hash } = hashPassword(env.authPassword);
  await users.insertOne({
    id: crypto.randomUUID(),
    username,
    displayName: 'Leader',
    role: 'admin',
    passwordSalt: salt,
    passwordHash: hash,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log(`Initial MongoDB login created for user: ${username}`);
}

export async function authenticateUser(username, password) {
  const user = await getDatabase().collection('users').findOne({ username: normalizeUsername(username), active: true });
  if (!user || !passwordMatches(password, user)) return null;
  await getDatabase().collection('users').updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  return { id: user.id, username: user.username, displayName: user.displayName || user.username, role: user.role || 'admin' };
}

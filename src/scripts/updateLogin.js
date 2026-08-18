import 'dotenv/config';
import crypto from 'node:crypto';
import { closeMongo, connectMongo, getDatabase } from '../database/mongodb.js';
import { env } from '../config/env.js';
import { authenticateUser } from '../services/auth.service.js';

try {
  await connectMongo();
  const users = getDatabase().collection('users');
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.scryptSync(env.authPassword, salt, 64).toString('hex');
  const target = await users.findOne({ username: env.authUsername }) || await users.findOne({ username: 'admin', role: 'admin' });
  const document = {
    username: env.authUsername,
    displayName: 'VXCC',
    role: 'admin',
    passwordSalt: salt,
    passwordHash,
    active: true,
    updatedAt: new Date()
  };

  if (target) await users.updateOne({ _id: target._id }, { $set: document });
  else await users.insertOne({ id: crypto.randomUUID(), ...document, createdAt: new Date() });
  const verified = await authenticateUser(env.authUsername, env.authPassword);
  if (!verified) throw new Error('Không thể xác nhận tài khoản mới.');
  console.log(`MongoDB login updated successfully: ${verified.username}`);
} finally {
  await closeMongo();
}

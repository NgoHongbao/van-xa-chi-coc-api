import { MongoClient } from 'mongodb';
import { env } from '../config/env.js';

const names = {
  l2: 'ĐOÀN 2 – Cánh Phải',
  l4: 'ĐOÀN 3 – Cánh Trái',
  l3: 'ĐOÀN CƠ ĐỘNG'
};
if (!env.mongodbUri || env.mongodbUri.includes('<PW>')) throw new Error('Missing valid MONGODB_URI.');
const client = new MongoClient(env.mongodbUri, { serverSelectionTimeoutMS: 15000 });
try {
  await client.connect();
  const legions = client.db(env.mongodbDb).collection('legions');
  const filter = { id: { $in: Object.keys(names) } };
  if (await legions.countDocuments(filter) !== 3) throw new Error('Expected all three legions.');
  await legions.bulkWrite(Object.entries(names).map(([id, name]) => ({
    updateOne: { filter: { id }, update: { $set: { name } } }
  })));
  const saved = await legions.find(filter, { projection: { _id: 0, id: 1, name: 1, order: 1 } }).sort({ order: 1 }).toArray();
  if (saved.some(legion => legion.name !== names[legion.id])) throw new Error('Name verification failed.');
  console.log(JSON.stringify({ verified: true, legions: saved }));
} catch (error) {
  console.error(`Legion rename failed (${error.name}).`);
  process.exitCode = 1;
} finally {
  await client.close();
}

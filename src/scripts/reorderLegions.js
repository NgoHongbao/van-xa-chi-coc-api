import { MongoClient } from 'mongodb';
import { env } from '../config/env.js';

if (!env.mongodbUri || env.mongodbUri.includes('<PW>')) throw new Error('Missing valid MONGODB_URI.');
const client = new MongoClient(env.mongodbUri, { serverSelectionTimeoutMS: 15000 });
try {
  await client.connect();
  const legions = client.db(env.mongodbDb).collection('legions');
  const targets = await legions.find({ id: { $in: ['l3', 'l4'] } }).toArray();
  if (targets.length !== 2) throw new Error('Expected both mobile and wing legions.');
  await legions.bulkWrite([
    { updateOne: { filter: { id: 'l4' }, update: { $set: { order: 3 } } } },
    { updateOne: { filter: { id: 'l3' }, update: { $set: { order: 4 } } } }
  ]);
  const saved = await legions.find({}, { projection: { _id: 0, id: 1, name: 1, order: 1 } }).sort({ order: 1 }).toArray();
  if (saved.find(item => item.id === 'l4')?.order !== 3 || saved.find(item => item.id === 'l3')?.order !== 4) {
    throw new Error('Legion order verification failed.');
  }
  console.log(JSON.stringify({ verified: true, legions: saved }));
} catch (error) {
  console.error(`Legion reorder failed (${error.name}).`);
  process.exitCode = 1;
} finally {
  await client.close();
}

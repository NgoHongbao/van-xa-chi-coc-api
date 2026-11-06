import { MongoClient } from 'mongodb';
import { env } from '../config/env.js';

const faction = { id: 'huyen-co', name: 'Huyền Cơ', color: '#bef264' };
if (!env.mongodbUri || env.mongodbUri.includes('<PW>')) {
  throw new Error('Missing valid MONGODB_URI.');
}

const client = new MongoClient(env.mongodbUri, { serverSelectionTimeoutMS: 15000 });
try {
  await client.connect();
  const factions = client.db(env.mongodbDb).collection('factions');
  await factions.updateOne({ id: faction.id }, { $set: faction }, { upsert: true });
  const saved = await factions.findOne({ id: faction.id }, { projection: { _id: 0 } });
  if (saved?.name !== faction.name || saved?.color !== faction.color) {
    throw new Error('Faction verification failed.');
  }
  console.log(JSON.stringify({ verified: true, faction: saved }));
} catch (error) {
  console.error(`Faction update failed (${error.name}).`);
  process.exitCode = 1;
} finally {
  await client.close();
}

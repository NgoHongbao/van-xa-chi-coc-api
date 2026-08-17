import { MongoClient } from 'mongodb';
import { env } from '../config/env.js';

let client;
let database;

export async function connectMongo() {
  if (database) return database;
  if (!env.mongodbUri || env.mongodbUri.includes('<PW>')) {
    throw new Error('Thiếu MONGODB_URI hợp lệ trong biến môi trường.');
  }

  client = new MongoClient(env.mongodbUri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 15000
  });
  await client.connect();
  database = client.db(env.mongodbDb);
  await database.command({ ping: 1 });

  await Promise.all(
    ['factions', 'members', 'parties', 'legions', 'roles'].map((name) =>
      database.collection(name).createIndex({ id: 1 }, { unique: true })
    )
  );
  await database.collection('members').createIndex(
    { partyId: 1, position: 1 },
    {
      name: 'unique_party_position',
      unique: true,
      partialFilterExpression: { partyId: { $type: 'string' }, position: { $type: 'number' } }
    }
  );
  return database;
}

export function getDatabase() {
  if (!database) throw new Error('MongoDB chưa được kết nối.');
  return database;
}

export function startMongoSession() {
  if (!client) throw new Error('MongoDB chưa được kết nối.');
  return client.startSession();
}

export async function closeMongo() {
  if (client) await client.close();
  client = undefined;
  database = undefined;
}

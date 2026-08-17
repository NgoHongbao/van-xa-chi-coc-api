import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const importDir = path.resolve(__dirname, '../../mongodb/import');
const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || 'guild_manager_app';

const imports = [
  ['factions', 'factions.json'],
  ['roles', 'roles.json'],
  ['members', 'members.json'],
  ['legions', 'legions.json'],
  ['parties', 'parties.json'],
  ['globalNotes', 'globalNotes.json']
];

if (!uri || uri.includes('<PW>')) {
  throw new Error('MONGODB_URI chưa có mật khẩu hợp lệ trong backend/.env.');
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });

try {
  await client.connect();
  const database = client.db(databaseName);

  for (const [collectionName, fileName] of imports) {
    const raw = await fs.readFile(path.join(importDir, fileName), 'utf8');
    const documents = JSON.parse(raw);

    if (!Array.isArray(documents)) {
      throw new Error(`${fileName} phải chứa một JSON array.`);
    }

    const existingCollections = await database.listCollections({ name: collectionName }).toArray();
    if (existingCollections.length === 0) {
      await database.createCollection(collectionName);
    }

    const collection = database.collection(collectionName);
    const existingDocumentCount = await collection.countDocuments({});
    if (existingDocumentCount > 0) {
      throw new Error(
        `Collection ${collectionName} đã có ${existingDocumentCount} documents; dừng import để tránh ghi đè dữ liệu.`
      );
    }
    if (documents.length > 0) {
      await collection.insertMany(documents, { ordered: true });
    }

    console.log(`${collectionName}: ${documents.length} documents`);
  }

  console.log(`Import thành công vào database: ${databaseName}`);
} finally {
  await client.close();
}

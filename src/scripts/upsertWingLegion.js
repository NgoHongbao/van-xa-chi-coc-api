import 'dotenv/config';
import { closeMongo, connectMongo } from '../database/mongodb.js';

const legion = { id: 'l4', name: 'ĐOÀN 3 – Cánh Trái', type: 'WING', order: 3 };
const parties = Array.from({ length: 4 }, (_, index) => ({
  id: `p4${index + 1}`,
  legionId: legion.id,
  name: `PT${index + 1}`,
  note: '',
  order: index + 1
}));

try {
  const database = await connectMongo();
  await database.collection('legions').updateOne(
    { id: legion.id },
    { $set: legion },
    { upsert: true }
  );
  await Promise.all(parties.map((party) => database.collection('parties').updateOne(
    { id: party.id },
    { $set: party },
    { upsert: true }
  )));
  console.log(`Upserted ${legion.name} with ${parties.length} parties.`);
} finally {
  await closeMongo();
}

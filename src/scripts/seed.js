import 'dotenv/config';
import { closeMongo, connectMongo } from '../database/mongodb.js';
import { resetDemoData } from '../services/demo.service.js';

try {
  await connectMongo();
  await resetDemoData();
  console.log('Sample MongoDB data reset successfully.');
} finally {
  await closeMongo();
}

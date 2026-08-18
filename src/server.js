import 'dotenv/config';
import { app } from './app.js';
import { closeMongo, connectMongo } from './database/mongodb.js';
import { env } from './config/env.js';
import { ensureInitialUser } from './services/auth.service.js';

await connectMongo();
await ensureInitialUser();

const server = app.listen(env.port, () => {
  console.log(`Guild Manager API listening on port ${env.port} (MongoDB: ${env.mongodbDb})`);
});

async function shutdown(signal) {
  console.log(`${signal}: closing Guild Manager API...`);
  server.close(async () => {
    await closeMongo();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

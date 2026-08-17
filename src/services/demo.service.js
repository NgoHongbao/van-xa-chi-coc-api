import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { repositories } from '../repositories/index.js';

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const files = [
  ['factions', 'factions'],
  ['members', 'members'],
  ['parties', 'parties'],
  ['legions', 'legions'],
  ['roles', 'roles'],
  ['globalNotes', 'global-notes']
];

export async function resetDemoData() {
  await Promise.all(files.map(async ([repositoryName, fileName]) => {
    const data = JSON.parse(await readFile(path.join(dataDir, 'seed', `${fileName}.json`), 'utf8'));
    await repositories[repositoryName].write(data);
  }));
  return { success: true };
}

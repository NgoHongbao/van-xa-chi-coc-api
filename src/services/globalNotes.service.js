import { repositories } from '../repositories/index.js';
export async function saveGlobalNotes(notes) {
  const clean = (Array.isArray(notes) ? notes : []).map((item) => String(item).trim()).filter(Boolean);
  await repositories.globalNotes.write(clean);
  return clean;
}

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const importDir = path.resolve(__dirname, '../../mongodb/import');
const PARTY_CAPACITY = 6;

async function readJson(name) {
  const raw = await fs.readFile(path.join(importDir, name), 'utf8');
  const value = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error(`${name} phải là JSON array.`);
  return value;
}

function assertUnique(items, label) {
  const seen = new Set();
  for (const item of items) {
    if (!item?.id) throw new Error(`${label}: có document thiếu id.`);
    if (seen.has(item.id)) throw new Error(`${label}: trùng id ${item.id}.`);
    seen.add(item.id);
  }
  return seen;
}

const [factions, roles, members, parties, legions, globalNotes] = await Promise.all([
  readJson('factions.json'),
  readJson('roles.json'),
  readJson('members.json'),
  readJson('parties.json'),
  readJson('legions.json'),
  readJson('globalNotes.json')
]);

const factionIds = assertUnique(factions, 'factions');
const roleIds = assertUnique(roles, 'roles');
const memberIds = assertUnique(members, 'members');
const partyIds = assertUnique(parties, 'parties');
const legionIds = assertUnique(legions, 'legions');

const toaiMong = factions.find((item) => item.id === 'toai-mong');
if (!toaiMong || toaiMong.color !== '#4adede') {
  throw new Error('Toái Mộng phải có color #4adede.');
}

for (const party of parties) {
  if (!legionIds.has(party.legionId)) throw new Error(`Party ${party.id} tham chiếu legionId không tồn tại: ${party.legionId}`);
}

const occupied = new Set();
for (const member of members) {
  if (!factionIds.has(member.factionId)) throw new Error(`Member ${member.id} có factionId không hợp lệ: ${member.factionId}`);
  if (!roleIds.has(member.roleId)) throw new Error(`Member ${member.id} có roleId không hợp lệ: ${member.roleId}`);
  if (member.partyId == null) {
    if (member.position != null) throw new Error(`Member ${member.id} chưa có PT nhưng position không null.`);
    continue;
  }
  if (!partyIds.has(member.partyId)) throw new Error(`Member ${member.id} có partyId không hợp lệ: ${member.partyId}`);
  const pos = Number(member.position);
  if (!Number.isInteger(pos) || pos < 1 || pos > PARTY_CAPACITY) throw new Error(`Member ${member.id} có position ngoài 1-${PARTY_CAPACITY}.`);
  const key = `${member.partyId}:${pos}`;
  if (occupied.has(key)) throw new Error(`Trùng vị trí ${key}.`);
  occupied.add(key);
}

console.log('MongoDB import data hợp lệ.');
console.log(JSON.stringify({
  factions: factions.length,
  roles: roles.length,
  members: members.length,
  parties: parties.length,
  legions: legions.length,
  globalNotes: globalNotes.length,
  assignedMembers: members.filter((m) => m.partyId).length,
  unassignedMembers: members.filter((m) => !m.partyId).length
}, null, 2));

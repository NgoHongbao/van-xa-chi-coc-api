import { repositories } from '../repositories/index.js';
import { HttpError } from '../utils/httpError.js';
import { createId } from '../utils/id.js';

async function validateReferences(payload) {
  const [factions, roles] = await Promise.all([repositories.factions.read(), repositories.roles.read()]);
  if (!factions.some((item) => item.id === payload.factionId)) throw new HttpError(400, 'Phái không hợp lệ.', 'INVALID_FACTION');
  if (payload.roleId && !roles.some((item) => item.id === payload.roleId)) throw new HttpError(400, 'Chức vụ không hợp lệ.', 'INVALID_ROLE');
}

function cleanMemberPayload(payload, existing = {}) {
  const name = String(payload.name ?? existing.name ?? '').trim();
  if (!name) throw new HttpError(400, 'Tên thành viên không được để trống.', 'INVALID_MEMBER_NAME');
  return {
    name,
    factionId: payload.factionId ?? existing.factionId,
    roleId: payload.roleId ?? existing.roleId ?? 'r_member',
    note: String(payload.note ?? existing.note ?? '').trim()
  };
}

export const listMembers = () => repositories.members.read();

export async function getMember(id) {
  const member = (await repositories.members.read()).find((item) => item.id === id);
  if (!member) throw new HttpError(404, 'Không tìm thấy thành viên.', 'MEMBER_NOT_FOUND');
  return member;
}

export async function createMember(payload) {
  const clean = cleanMemberPayload(payload);
  await validateReferences(clean);
  const member = {
    id: createId('member'), ...clean, partyId: null, position: null, ptNote: '', ptNoteColor: 'purple'
  };
  await repositories.members.mutate((items) => { items.push(member); });
  return member;
}

export async function updateMember(id, payload) {
  let updated;
  await repositories.members.mutate(async (items) => {
    const member = items.find((item) => item.id === id);
    if (!member) throw new HttpError(404, 'Không tìm thấy thành viên.', 'MEMBER_NOT_FOUND');
    const clean = cleanMemberPayload(payload, member);
    await validateReferences(clean);
    Object.assign(member, clean);
    updated = { ...member };
  });
  return updated;
}

export async function deleteMember(id) {
  let deleted;
  await repositories.members.mutate((items) => {
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw new HttpError(404, 'Không tìm thấy thành viên.', 'MEMBER_NOT_FOUND');
    [deleted] = items.splice(index, 1);
  });
}

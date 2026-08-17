import { repositories } from '../repositories/index.js';
import { PARTY_CAPACITY, POSITION_MIN, POSITION_MAX, DEFAULT_PT_NOTE_COLOR, PT_NOTE_COLORS } from '../config/constants.js';
import { HttpError } from '../utils/httpError.js';
import { createId } from '../utils/id.js';

function validatePosition(value) {
  const position = Number(value);
  if (!Number.isInteger(position) || position < POSITION_MIN || position > POSITION_MAX) {
    throw new HttpError(400, `Position phải nằm trong khoảng ${POSITION_MIN}-${POSITION_MAX}.`, 'INVALID_POSITION');
  }
  return position;
}

function noteColor(value) {
  return PT_NOTE_COLORS.has(value) ? value : DEFAULT_PT_NOTE_COLOR;
}

function partyCount(members, partyId, exceptMemberId = null) {
  return members.filter((item) => item.partyId === partyId && item.id !== exceptMemberId).length;
}

function occupantAt(members, partyId, position, exceptMemberId = null) {
  return members.find((item) => item.partyId === partyId && Number(item.position) === Number(position) && item.id !== exceptMemberId);
}

async function requireParty(partyId) {
  const party = (await repositories.parties.read()).find((item) => item.id === partyId);
  if (!party) throw new HttpError(404, 'Không tìm thấy PT.', 'PARTY_NOT_FOUND');
  return party;
}

export const listParties = () => repositories.parties.read();

export async function getParty(id) {
  const party = (await repositories.parties.read()).find((item) => item.id === id);
  if (!party) throw new HttpError(404, 'Không tìm thấy PT.', 'PARTY_NOT_FOUND');
  return party;
}

export async function createParty(payload = {}) {
  const legions = await repositories.legions.read();
  const legionId = payload.legionId || legions[0]?.id;
  if (!legions.some((item) => item.id === legionId)) throw new HttpError(400, 'Đoàn không hợp lệ.', 'INVALID_LEGION');
  const existing = (await repositories.parties.read()).filter((item) => item.legionId === legionId);
  const party = {
    id: createId('party'), legionId, name: String(payload.name || `PT${existing.length + 1}`).trim(), note: String(payload.note || '').trim(), order: existing.length + 1
  };
  await repositories.parties.mutate((items) => { items.push(party); });
  return party;
}

export async function updateParty(id, payload) {
  let updated;
  await repositories.parties.mutate((items) => {
    const party = items.find((item) => item.id === id);
    if (!party) throw new HttpError(404, 'Không tìm thấy PT.', 'PARTY_NOT_FOUND');
    if (payload.name !== undefined) party.name = String(payload.name).trim() || party.name;
    if (payload.note !== undefined) party.note = String(payload.note).trim();
    updated = { ...party };
  });
  return updated;
}

export async function deleteParty(id) {
  const members = await repositories.members.read();
  if (members.some((item) => item.partyId === id)) throw new HttpError(409, 'Chỉ có thể xóa PT trống.', 'PARTY_NOT_EMPTY');
  let deleted;
  await repositories.parties.mutate((items) => {
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw new HttpError(404, 'Không tìm thấy PT.', 'PARTY_NOT_FOUND');
    [deleted] = items.splice(index, 1);
  });
}

export async function assignMember(payload) {
  const { memberId, partyId } = payload;
  await requireParty(partyId);
  let assigned;
  await repositories.members.mutate((members) => {
    const member = members.find((item) => item.id === memberId);
    if (!member) throw new HttpError(404, 'Không tìm thấy thành viên.', 'MEMBER_NOT_FOUND');
    if (member.partyId && !payload.forceMove) throw new HttpError(409, 'Thành viên đã có PT. Hãy dùng chức năng Chuyển PT.', 'MEMBER_ALREADY_ASSIGNED');
    if (partyCount(members, partyId, memberId) >= PARTY_CAPACITY) throw new HttpError(409, `PT đã đủ ${PARTY_CAPACITY} thành viên.`, 'PARTY_FULL');
    const requested = payload.targetPosition ? validatePosition(payload.targetPosition) : null;
    const occupied = new Set(members.filter((item) => item.partyId === partyId && item.id !== memberId).map((item) => Number(item.position)));
    const position = requested || Array.from({ length: PARTY_CAPACITY }, (_, i) => i + 1).find((candidate) => !occupied.has(candidate));
    if (!position) throw new HttpError(409, `PT đã đủ ${PARTY_CAPACITY} thành viên.`, 'PARTY_FULL');
    if (occupied.has(position)) throw new HttpError(409, 'Position đích đã có thành viên.', 'POSITION_OCCUPIED');
    Object.assign(member, { partyId, position, ptNote: String(payload.note || '').trim(), ptNoteColor: noteColor(payload.noteColor) });
    assigned = { ...member };
  });
  return assigned;
}

export async function moveMember(payload) {
  const { memberId, targetPartyId } = payload;
  const targetPosition = validatePosition(payload.targetPosition);
  await requireParty(targetPartyId);
  let result;
  await repositories.members.mutate((members) => {
    const member = members.find((item) => item.id === memberId);
    if (!member) throw new HttpError(404, 'Không tìm thấy thành viên.', 'MEMBER_NOT_FOUND');
    if (!member.partyId) throw new HttpError(409, 'Thành viên chưa được xếp PT.', 'MEMBER_UNASSIGNED');

    const targetMember = occupantAt(members, targetPartyId, targetPosition, memberId);
    if (targetMember) {
      const sourcePartyId = member.partyId;
      const sourcePosition = member.position;
      member.partyId = targetMember.partyId;
      member.position = targetMember.position;
      targetMember.partyId = sourcePartyId;
      targetMember.position = sourcePosition;
      if (payload.note !== undefined) member.ptNote = String(payload.note).trim();
      if (payload.noteColor !== undefined) member.ptNoteColor = noteColor(payload.noteColor);
      result = { mode: 'swap', member: { ...member }, targetMember: { ...targetMember } };
      return;
    }

    if (member.partyId !== targetPartyId && partyCount(members, targetPartyId, memberId) >= PARTY_CAPACITY) {
      throw new HttpError(409, `PT đã đủ ${PARTY_CAPACITY} thành viên.`, 'PARTY_FULL');
    }
    member.partyId = targetPartyId;
    member.position = targetPosition;
    if (payload.note !== undefined) member.ptNote = String(payload.note).trim();
    if (payload.noteColor !== undefined) member.ptNoteColor = noteColor(payload.noteColor);
    result = { mode: 'move', member: { ...member } };
  });
  return result;
}

export async function swapMembers({ memberAId, memberBId }) {
  if (!memberAId || !memberBId || memberAId === memberBId) throw new HttpError(400, 'Hai member SWAP không hợp lệ.', 'INVALID_SWAP');
  let result;
  await repositories.members.mutate((members) => {
    const a = members.find((item) => item.id === memberAId);
    const b = members.find((item) => item.id === memberBId);
    if (!a || !b) throw new HttpError(404, 'Không tìm thấy member cần SWAP.', 'MEMBER_NOT_FOUND');
    if (!a.partyId || !b.partyId) throw new HttpError(409, 'Cả hai member phải đang có PT.', 'MEMBER_UNASSIGNED');
    const placementA = { partyId: a.partyId, position: a.position };
    const placementB = { partyId: b.partyId, position: b.position };
    Object.assign(a, placementB);
    Object.assign(b, placementA);
    result = { memberA: { ...a }, memberB: { ...b } };
  });
  return result;
}

export async function updateMemberPtNote(memberId, payload) {
  let updated;
  await repositories.members.mutate((members) => {
    const member = members.find((item) => item.id === memberId);
    if (!member) throw new HttpError(404, 'Không tìm thấy thành viên.', 'MEMBER_NOT_FOUND');
    member.ptNote = String(payload.note || '').trim();
    member.ptNoteColor = noteColor(payload.noteColor);
    updated = { ...member };
  });
  return updated;
}

export async function removeMemberFromParty(memberId) {
  let updated;
  await repositories.members.mutate((members) => {
    const member = members.find((item) => item.id === memberId);
    if (!member) throw new HttpError(404, 'Không tìm thấy thành viên.', 'MEMBER_NOT_FOUND');
    member.partyId = null; member.position = null; member.ptNote = ''; member.ptNoteColor = DEFAULT_PT_NOTE_COLOR;
    updated = { ...member };
  });
  return updated;
}

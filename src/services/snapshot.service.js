import { repositories } from '../repositories/index.js';

export async function getSnapshot() {
  const [factions, roles, members, parties, legions, globalNotes] = await Promise.all([
    repositories.factions.read(), repositories.roles.read(), repositories.members.read(), repositories.parties.read(), repositories.legions.read(), repositories.globalNotes.read()
  ]);

  const legionSnapshot = legions.sort((a,b) => (a.order || 0) - (b.order || 0)).map((legion) => ({
    ...legion,
    parties: parties.filter((party) => party.legionId === legion.id).sort((a,b) => (a.order || 0) - (b.order || 0)).map((party) => ({
      ...party,
      members: members.filter((member) => member.partyId === party.id).sort((a,b) => Number(a.position || 99) - Number(b.position || 99)).map((member) => ({
        memberId: member.id,
        partyId: party.id,
        position: member.position,
        note: member.ptNote || '',
        noteColor: member.ptNoteColor || 'purple'
      }))
    }))
  }));

  return { factions, roles, members, legions: legionSnapshot, globalNotes };
}

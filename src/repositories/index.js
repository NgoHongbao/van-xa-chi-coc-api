import { MongoGlobalNotesRepository, MongoRepository } from './mongoRepository.js';

const repo = (name) => new MongoRepository(name);

export const repositories = {
  factions: repo('factions'),
  members: repo('members'),
  parties: repo('parties'),
  legions: repo('legions'),
  roles: repo('roles'),
  globalNotes: new MongoGlobalNotesRepository()
};

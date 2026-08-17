import { repositories } from '../repositories/index.js';
export const listFactions = () => repositories.factions.read();

import { listFactions } from '../services/factions.service.js';
export async function list(req,res,next){try{res.json(await listFactions());}catch(e){next(e)}}

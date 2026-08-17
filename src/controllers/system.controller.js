import { getSnapshot } from '../services/snapshot.service.js';
import { saveGlobalNotes } from '../services/globalNotes.service.js';
import { resetDemoData } from '../services/demo.service.js';
export function health(req,res){res.json({status:'ok',message:'Guild Manager API is running'});}
export async function snapshot(req,res,next){try{res.json(await getSnapshot());}catch(e){next(e)}}
export async function notes(req,res,next){try{res.json(await saveGlobalNotes(req.body.notes));}catch(e){next(e)}}
export async function saveFormation(req,res,next){try{res.json({success:true});}catch(e){next(e)}}
export async function reset(req,res,next){try{res.json(await resetDemoData());}catch(e){next(e)}}

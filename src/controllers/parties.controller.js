import * as service from '../services/parties.service.js';
export async function list(req,res,next){try{res.json(await service.listParties());}catch(e){next(e)}}
export async function get(req,res,next){try{res.json(await service.getParty(req.params.id));}catch(e){next(e)}}
export async function create(req,res,next){try{res.status(201).json(await service.createParty(req.body));}catch(e){next(e)}}
export async function update(req,res,next){try{res.json(await service.updateParty(req.params.id,req.body));}catch(e){next(e)}}
export async function remove(req,res,next){try{await service.deleteParty(req.params.id);res.status(204).end();}catch(e){next(e)}}
export async function assign(req,res,next){try{res.json(await service.assignMember(req.body));}catch(e){next(e)}}
export async function move(req,res,next){try{res.json(await service.moveMember(req.body));}catch(e){next(e)}}
export async function swap(req,res,next){try{res.json(await service.swapMembers(req.body));}catch(e){next(e)}}
export async function note(req,res,next){try{res.json(await service.updateMemberPtNote(req.params.memberId,req.body));}catch(e){next(e)}}
export async function unassign(req,res,next){try{res.json(await service.removeMemberFromParty(req.params.memberId));}catch(e){next(e)}}

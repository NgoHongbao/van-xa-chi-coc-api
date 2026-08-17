import * as service from '../services/members.service.js';
export async function list(req,res,next){try{res.json(await service.listMembers());}catch(e){next(e)}}
export async function get(req,res,next){try{res.json(await service.getMember(req.params.id));}catch(e){next(e)}}
export async function create(req,res,next){try{res.status(201).json(await service.createMember(req.body));}catch(e){next(e)}}
export async function update(req,res,next){try{res.json(await service.updateMember(req.params.id,req.body));}catch(e){next(e)}}
export async function remove(req,res,next){try{await service.deleteMember(req.params.id);res.status(204).end();}catch(e){next(e)}}

import * as service from '../services/roles.service.js';
export async function list(req,res,next){try{res.json(await service.listRoles());}catch(e){next(e)}}
export async function create(req,res,next){try{res.status(201).json(await service.createRole(req.body.name));}catch(e){next(e)}}
export async function update(req,res,next){try{res.json(await service.updateRole(req.params.id,req.body.name));}catch(e){next(e)}}
export async function remove(req,res,next){try{await service.deleteRole(req.params.id);res.status(204).end();}catch(e){next(e)}}

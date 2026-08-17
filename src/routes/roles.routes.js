import { Router } from 'express';import * as c from '../controllers/roles.controller.js';
const router=Router();router.get('/',c.list);router.post('/',c.create);router.put('/:id',c.update);router.delete('/:id',c.remove);export default router;

import { Router } from 'express';import * as c from '../controllers/system.controller.js';
const router=Router();router.get('/health',c.health);router.get('/snapshot',c.snapshot);router.put('/global-notes',c.notes);router.post('/formations/save',c.saveFormation);router.post('/demo/reset',c.reset);export default router;

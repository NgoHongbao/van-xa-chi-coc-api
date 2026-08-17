import { Router } from 'express';
import * as c from '../controllers/parties.controller.js';
const router=Router();
router.get('/',c.list);router.get('/:id',c.get);router.post('/',c.create);router.put('/:id',c.update);router.delete('/:id',c.remove);
router.post('/assign-member',c.assign);router.patch('/move-member',c.move);router.patch('/swap-members',c.swap);
router.patch('/member/:memberId/note',c.note);router.delete('/member/:memberId',c.unassign);
export default router;

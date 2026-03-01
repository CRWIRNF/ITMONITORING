import { Router } from 'express';
import { getWebsitesStatus, addWebsite, triggerCheck, deleteWebsite } from '../controllers/websiteController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getWebsitesStatus);
router.post('/', requireAdmin, addWebsite);
router.post('/check', requireAdmin, triggerCheck);
router.delete('/:id', requireAdmin, deleteWebsite);

export default router;

import { Router } from 'express';
import { getCurrentMetrics, getMetricsHistory, getLoginHistory } from '../controllers/systemController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Alle Routen erfordern Admin-Rechte
router.get('/metrics/current', authenticate, requireAdmin, getCurrentMetrics);
router.get('/metrics/history', authenticate, requireAdmin, getMetricsHistory);
router.get('/logins', authenticate, requireAdmin, getLoginHistory);

export default router;

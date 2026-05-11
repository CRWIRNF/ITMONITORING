import { Router } from 'express';
import {
  getDashboard,
  getStarlinkStatus,
  getTicketsystemStatus,
  getTicketTrend,
  getTicketHistory,
  getTopTicketCreators,
  getFirewallStatus,
  getWebsiteStatus,
  updateMonitoringData
} from '../controllers/monitoringController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Alle Routen benötigen Authentifizierung
router.use(authenticate);

router.get('/dashboard', getDashboard);
router.get('/starlink', getStarlinkStatus);
router.get('/ticketsystem/trend', getTicketTrend);
router.get('/ticketsystem/history', getTicketHistory);
router.get('/ticketsystem/top-creators', getTopTicketCreators);
router.get('/ticketsystem', getTicketsystemStatus);
router.get('/firewalls', getFirewallStatus);
router.get('/websites', getWebsiteStatus);

// Nur Admins können Monitoring-Daten aktualisieren
router.post('/update', requireAdmin, updateMonitoringData);

export default router;

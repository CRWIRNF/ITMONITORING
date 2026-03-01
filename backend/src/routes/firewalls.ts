import { Router } from 'express';
import {
  getFirewallStats,
  getFirewallStatsByIp,
  getFirewallsHistory,
  getFirewallHistoryByIp
} from '../controllers/firewallController';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/firewalls/stats - Alle Firewall-Statistiken abrufen
router.get('/stats', authenticate, getFirewallStats);

// GET /api/firewalls/stats/:ip - Statistiken einer einzelnen Firewall abrufen
router.get('/stats/:ip', authenticate, getFirewallStatsByIp);

// GET /api/firewalls/history - Historische Daten aller Firewalls abrufen
router.get('/history', authenticate, getFirewallsHistory);

// GET /api/firewalls/history/:ip - Historische Daten einer einzelnen Firewall abrufen
router.get('/history/:ip', authenticate, getFirewallHistoryByIp);

export default router;

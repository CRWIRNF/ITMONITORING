import { Router } from 'express';
import { getDevices, getDevice, getOrganizations, getHealth } from '../controllers/ninjaController';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/ninja/health - Health Check (ohne Auth für Monitoring)
router.get('/health', getHealth);

// GET /api/ninja/devices - Alle Geräte abrufen
router.get('/devices', authenticate, getDevices);

// GET /api/ninja/devices/:id - Einzelnes Gerät abrufen
router.get('/devices/:id', authenticate, getDevice);

// GET /api/ninja/organizations - Alle Organisationen abrufen
router.get('/organizations', authenticate, getOrganizations);

export default router;

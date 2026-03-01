import { Router } from 'express';
import { getStarlinkData, getStarlinkRawData } from '../controllers/starlinkController';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/starlink - Abrufen der formatierten Starlink-Daten
router.get('/', authenticate, getStarlinkData);

// GET /api/starlink/raw - Abrufen der rohen API-Daten (für Debugging)
router.get('/raw', authenticate, getStarlinkRawData);

export default router;

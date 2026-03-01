import { Request, Response } from 'express';
import { ninjaService } from '../services/ninjaService';

/**
 * GET /api/ninja/devices - Alle Geräte abrufen
 */
export const getDevices = async (req: Request, res: Response) => {
  try {
    const data = await ninjaService.getFormattedDevices();

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Fehler beim Abrufen der NinjaOne-Geräte:', error);

    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der NinjaOne-Geräte',
      error: error.message
    });
  }
};

/**
 * GET /api/ninja/devices/:id - Einzelnes Gerät abrufen
 */
export const getDevice = async (req: Request, res: Response) => {
  try {
    const deviceId = parseInt(req.params.id);
    const data = await ninjaService.getDevice(deviceId);

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Fehler beim Abrufen des NinjaOne-Geräts:', error);

    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen des NinjaOne-Geräts',
      error: error.message
    });
  }
};

/**
 * GET /api/ninja/organizations - Alle Organisationen abrufen
 */
export const getOrganizations = async (req: Request, res: Response) => {
  try {
    const data = await ninjaService.getOrganizationsOverview();

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Fehler beim Abrufen der NinjaOne-Organisationen:', error);

    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der NinjaOne-Organisationen',
      error: error.message
    });
  }
};

/**
 * GET /api/ninja/health - Health Check
 */
export const getHealth = async (req: Request, res: Response) => {
  try {
    const health = await ninjaService.healthCheck();

    res.json({
      success: health.status === 'ok',
      ...health,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

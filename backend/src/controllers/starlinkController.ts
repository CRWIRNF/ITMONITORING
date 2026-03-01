import { Request, Response } from 'express';
import { starlinkService } from '../services/starlinkService';

export const getStarlinkData = async (req: Request, res: Response) => {
  try {
    const data = await starlinkService.getFormattedServiceLines();

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Starlink-Daten:', error);

    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Starlink-Daten',
      error: error.message
    });
  }
};

export const getStarlinkRawData = async (req: Request, res: Response) => {
  try {
    const data = await starlinkService.getServiceLines();

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Fehler beim Abrufen der rohen Starlink-Daten:', error);

    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Starlink-Daten',
      error: error.message
    });
  }
};

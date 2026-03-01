import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { systemMetricsService } from '../services/systemMetricsService';
import { LoginHistoryModel } from '../models/LoginHistory';

export const getCurrentMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const metrics = await systemMetricsService.getCurrentMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    console.error('Fehler beim Abrufen der aktuellen System-Metriken:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Abrufen der System-Metriken'
    });
  }
};

export const getMetricsHistory = async (req: AuthRequest, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;

    if (hours < 1 || hours > 168) {
      return res.status(400).json({
        success: false,
        error: 'Stunden-Parameter muss zwischen 1 und 168 liegen'
      });
    }

    const history = await systemMetricsService.getMetricsHistory(hours);

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    console.error('Fehler beim Abrufen der System-Metriken-Historie:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Abrufen der System-Metriken-Historie'
    });
  }
};

export const getLoginHistory = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Limit-Parameter muss zwischen 1 und 100 liegen'
      });
    }

    const logins = await LoginHistoryModel.getRecentLogins(limit);

    res.json({
      success: true,
      data: logins
    });
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Login-Historie:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Abrufen der Login-Historie'
    });
  }
};

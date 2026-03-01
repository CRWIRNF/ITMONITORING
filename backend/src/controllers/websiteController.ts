import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { websiteMonitoringService } from '../services/websiteMonitoringService';
import { WebsiteMonitoringModel } from '../models/WebsiteMonitoring';

export const getWebsitesStatus = async (req: AuthRequest, res: Response) => {
  try {
    const websites = await websiteMonitoringService.getWebsiteStatusWithStats();
    res.json({ success: true, data: websites });
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Website-Daten:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addWebsite = async (req: AuthRequest, res: Response) => {
  try {
    const { url, name, enabled, check_interval } = req.body;
    const website = await WebsiteMonitoringModel.addWebsite({ url, name, enabled, check_interval });
    res.json({ success: true, data: website });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const triggerCheck = async (req: AuthRequest, res: Response) => {
  try {
    await websiteMonitoringService.checkAllWebsites();
    res.json({ success: true, message: 'Check gestartet' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteWebsite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await WebsiteMonitoringModel.deleteWebsite(parseInt(id));
    if (deleted) {
      res.json({ success: true, message: 'Website gelöscht' });
    } else {
      res.status(404).json({ success: false, message: 'Website nicht gefunden' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

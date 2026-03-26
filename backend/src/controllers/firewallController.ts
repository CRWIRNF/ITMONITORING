import { Request, Response } from 'express';
import net from 'net';
import { snmpService } from '../services/snmpService';
import { FirewallHistoryModel } from '../models/FirewallHistory';

// Liste der zu überwachenden Firewalls
const FIREWALL_IPS = [
  '10.50.149.254',
  '10.64.149.254',
  '10.66.149.254',
  '10.67.149.254',
  '10.68.149.254',
  '10.69.149.254',
  '10.72.149.254'
];

/**
 * Ruft SNMP-Daten von allen Firewalls ab
 */
export const getFirewallStats = async (req: Request, res: Response) => {
  try {
    const data = await snmpService.getAllFirewallsData(FIREWALL_IPS);

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Firewall-Statistiken:', error);

    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Firewall-Statistiken',
      error: error.message
    });
  }
};

/**
 * Ruft SNMP-Daten von einer einzelnen Firewall ab
 */
export const getFirewallStatsByIp = async (req: Request, res: Response) => {
  try {
    const { ip } = req.params;

    if (!ip || net.isIP(ip) === 0) {
      return res.status(400).json({
        success: false,
        message: 'Gültige IP-Adresse ist erforderlich'
      });
    }

    const data = await snmpService.getFortinetData(ip);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: `Keine Daten für Firewall ${ip} gefunden`
      });
    }

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Firewall-Daten:', error);

    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Firewall-Daten',
      error: error.message
    });
  }
};

/**
 * Ruft historische Daten für alle Firewalls ab
 */
export const getFirewallsHistory = async (req: Request, res: Response) => {
  try {
    const hoursBack = parseInt(req.query.hours as string) || 4;

    const historyMap = await FirewallHistoryModel.getAllFirewallsHistory(hoursBack);

    // Konvertiere Map zu Object für JSON-Serialisierung
    const historyObject: { [key: string]: any[] } = {};
    historyMap.forEach((value, key) => {
      historyObject[key] = value;
    });

    res.json({
      success: true,
      data: historyObject,
      hoursBack,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Firewall-Historie:', error);

    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Firewall-Historie',
      error: error.message
    });
  }
};

/**
 * Ruft historische Daten für eine einzelne Firewall ab
 */
export const getFirewallHistoryByIp = async (req: Request, res: Response) => {
  try {
    const { ip } = req.params;
    const hoursBack = parseInt(req.query.hours as string) || 4;

    if (!ip || net.isIP(ip) === 0) {
      return res.status(400).json({
        success: false,
        message: 'Gültige IP-Adresse ist erforderlich'
      });
    }

    const history = await FirewallHistoryModel.getHistoryForFirewall(ip, hoursBack);

    res.json({
      success: true,
      data: history,
      hoursBack,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Firewall-Historie:', error);

    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Firewall-Historie',
      error: error.message
    });
  }
};

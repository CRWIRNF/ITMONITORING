import { FirewallHistoryModel } from '../models/FirewallHistory';
import { snmpService } from './snmpService';

export class FirewallHistoryService {
  /**
   * Sammelt aktuelle Firewall-Daten und speichert sie in der Historie
   */
  async collectAndSaveData(firewallIps: string[]): Promise<void> {
    console.log('\n========================================');
    console.log('Firewall-Daten-Sammlung gestartet');
    console.log(`Zeitpunkt: ${new Date().toLocaleString('de-DE')}`);
    console.log('========================================\n');

    try {
      const firewallsData = await snmpService.getAllFirewallsData(firewallIps);

      let successCount = 0;
      let errorCount = 0;

      for (const data of firewallsData) {
        try {
          await FirewallHistoryModel.insert({
            firewall_ip: data.ip,
            hostname: data.hostname,
            cpu_usage: data.cpuUsage,
            memory_usage: data.memoryUsage,
            active_sessions: data.activeSessions,
            timestamp: new Date()
          });
          successCount++;
          console.log(`✓ ${data.hostname} (${data.ip}): Daten gespeichert`);
        } catch (error) {
          errorCount++;
          console.error(`✗ ${data.hostname} (${data.ip}): Fehler beim Speichern:`, error);
        }
      }

      console.log('\n========================================');
      console.log('Firewall-Daten-Sammlung abgeschlossen');
      console.log(`Erfolgreich: ${successCount}, Fehler: ${errorCount}`);
      console.log('========================================\n');
    } catch (error) {
      console.error('Fehler bei der Firewall-Daten-Sammlung:', error);
    }
  }

  /**
   * Räumt alte Einträge auf (älter als 24 Stunden)
   */
  async cleanupOldData(): Promise<void> {
    try {
      const deletedCount = await FirewallHistoryModel.deleteOldEntries(24);
      if (deletedCount && deletedCount > 0) {
        console.log(`✓ ${deletedCount} alte Firewall-Historie-Einträge gelöscht`);
      }
    } catch (error) {
      console.error('Fehler beim Aufräumen alter Firewall-Daten:', error);
    }
  }
}

export const firewallHistoryService = new FirewallHistoryService();

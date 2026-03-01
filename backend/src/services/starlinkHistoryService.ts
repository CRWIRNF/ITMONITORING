import { starlinkService } from './starlinkService';
import { StarlinkHistoryModel } from '../models/StarlinkHistory';

export class StarlinkHistoryService {
  /**
   * Importiert aktuelle Daten von der Castor Marine API und speichert sie lokal
   */
  async importCurrentData(): Promise<{ imported: number; errors: number }> {
    let imported = 0;
    let errors = 0;

    try {
      console.log('Starte Starlink-Daten-Import...');
      const apiData = await starlinkService.getServiceLines();

      if (!apiData || !apiData.serviceLines) {
        throw new Error('Keine Daten von der API erhalten');
      }

      for (const serviceLine of apiData.serviceLines) {
        try {
          // Extrahiere Schiffsnamen
          const shipMatch = serviceLine.name.match(/^([A-Z\s]+(?:[IVX]+)?)/);
          const shipName = shipMatch ? shipMatch[1].trim() : serviceLine.name;

          // Importiere alle verfügbaren monatlichen Einträge
          for (const monthlyUsage of serviceLine.monthlyUsage) {
            try {
              await StarlinkHistoryModel.upsert({
                ship_id: serviceLine.id,
                ship_name: shipName,
                ship_full_name: serviceLine.name,
                period_start: new Date(monthlyUsage.startDate),
                period_end: new Date(monthlyUsage.endDate),
                total_standard_gb: monthlyUsage.totalStandardGb || 0,
                total_priority_gb: monthlyUsage.totalPriorityGb || 0,
                total_opt_in_priority_gb: monthlyUsage.totalOptInPriorityGb || 0,
                total_non_billable_gb: monthlyUsage.totalNonBillableGb || 0,
                included_gb: monthlyUsage.includedGb || 1000,
                status: serviceLine.status,
                kit_serial_number: serviceLine.userTerminals[0]?.kitSerialNumber || 'N/A',
                dish_serial_number: serviceLine.userTerminals[0]?.dishSerialNumber || 'N/A',
                terminal_active: serviceLine.userTerminals[0]?.active || false
              });
              imported++;
            } catch (entryError) {
              console.error(`Fehler beim Speichern eines Monats für ${shipName}:`, entryError);
              errors++;
            }
          }
        } catch (shipError) {
          console.error(`Fehler beim Verarbeiten von Schiff ${serviceLine.name}:`, shipError);
          errors++;
        }
      }

      console.log(`✓ Starlink-Daten-Import abgeschlossen: ${imported} Einträge importiert, ${errors} Fehler`);
    } catch (error) {
      console.error('Fehler beim Import der Starlink-Daten:', error);
      throw error;
    }

    return { imported, errors };
  }

  /**
   * Bereinigt alte Einträge (älter als 13 Monate, um 12 Monate Historie zu behalten)
   */
  async cleanupOldData(): Promise<number> {
    try {
      const deleted = await StarlinkHistoryModel.deleteOldEntries(13);
      if (deleted && deleted > 0) {
        console.log(`✓ ${deleted} alte Starlink-Einträge gelöscht`);
      }
      return deleted || 0;
    } catch (error) {
      console.error('Fehler beim Bereinigen alter Daten:', error);
      return 0;
    }
  }

  /**
   * Führt den vollständigen Update-Prozess durch
   */
  async updateHistory(): Promise<void> {
    console.log('\n========================================');
    console.log('Starlink Historie-Update gestartet');
    console.log(`Zeitpunkt: ${new Date().toLocaleString('de-DE')}`);
    console.log('========================================\n');

    try {
      // Import der aktuellen Daten
      const result = await this.importCurrentData();

      // Bereinigung alter Daten
      await this.cleanupOldData();

      console.log('\n========================================');
      console.log('Starlink Historie-Update abgeschlossen');
      console.log(`Importiert: ${result.imported} Einträge`);
      console.log(`Fehler: ${result.errors}`);
      console.log('========================================\n');
    } catch (error) {
      console.error('\n========================================');
      console.error('Fehler beim Starlink Historie-Update:', error);
      console.error('========================================\n');
      throw error;
    }
  }
}

export const starlinkHistoryService = new StarlinkHistoryService();

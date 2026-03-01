import os from 'os';
import * as osUtils from 'os-utils';
import * as diskusage from 'diskusage';
import { SystemMetricsModel } from '../models/SystemMetrics';

export interface CurrentSystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  uptime: number;
}

export const systemMetricsService = {
  /**
   * Sammelt aktuelle System-Metriken
   */
  async getCurrentMetrics(): Promise<CurrentSystemMetrics> {
    return new Promise((resolve, reject) => {
      // CPU-Auslastung ermitteln (asynchron)
      osUtils.cpuUsage((cpuPercent: number) => {
        try {
          // Memory-Informationen
          const totalMemory = os.totalmem();
          const freeMemory = os.freemem();
          const usedMemory = totalMemory - freeMemory;
          const memoryUsagePercent = (usedMemory / totalMemory) * 100;

          // Disk-Informationen (Linux: /, Windows: C:)
          const diskPath = process.platform === 'win32' ? 'C:' : '/';
          diskusage.check(diskPath, (err, info) => {
            if (err || !info) {
              console.error('Fehler beim Abrufen der Festplatten-Info:', err);
              reject(err || new Error('Keine Festplatten-Information verfügbar'));
              return;
            }

            const diskUsed = info.total - info.available;
            const diskUsagePercent = (diskUsed / info.total) * 100;

            resolve({
              cpu: {
                usage: cpuPercent * 100,
                cores: os.cpus().length
              },
              memory: {
                total: totalMemory,
                used: usedMemory,
                free: freeMemory,
                usagePercent: memoryUsagePercent
              },
              disk: {
                total: info.total,
                used: diskUsed,
                free: info.available,
                usagePercent: diskUsagePercent
              },
              uptime: os.uptime()
            });
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  },

  /**
   * Sammelt und speichert aktuelle Metriken in der Datenbank
   */
  async collectAndSaveMetrics(): Promise<void> {
    try {
      const metrics = await this.getCurrentMetrics();

      await SystemMetricsModel.saveMetrics({
        cpu_usage: metrics.cpu.usage,
        memory_total: metrics.memory.total,
        memory_used: metrics.memory.used,
        memory_free: metrics.memory.free,
        disk_total: metrics.disk.total,
        disk_used: metrics.disk.used,
        disk_free: metrics.disk.free
      });

      console.log('✓ System-Metriken gespeichert');
    } catch (error) {
      console.error('Fehler beim Sammeln der System-Metriken:', error);
    }
  },

  /**
   * Holt Metriken-Historie
   */
  async getMetricsHistory(hours: number = 24) {
    return SystemMetricsModel.getMetricsHistory(hours);
  },

  /**
   * Räumt alte Metriken auf
   */
  async cleanupOldMetrics() {
    try {
      await SystemMetricsModel.cleanupOldMetrics();
      console.log('✓ Alte System-Metriken aufgeräumt');
    } catch (error) {
      console.error('Fehler beim Aufräumen alter System-Metriken:', error);
    }
  }
};

import axios from 'axios';
import { WebsiteMonitoringModel, Website } from '../models/WebsiteMonitoring';

export class WebsiteMonitoringService {
  /**
   * Prüft eine einzelne Website und gibt die Response-Zeit zurück
   */
  async checkWebsite(website: Website) {
    const startTime = Date.now();

    try {
      const response = await axios.get(website.url, {
        timeout: 10000, // 10 Sekunden Timeout
        validateStatus: (status) => status < 500, // Akzeptiere alle Status < 500 als "erreichbar"
        headers: {
          'User-Agent': 'Mozilla/5.0 (Monitoring Bot)'
        }
      });

      const responseTime = Date.now() - startTime;

      await WebsiteMonitoringModel.addCheck({
        website_id: website.id!,
        status: 'online',
        response_time: responseTime,
        status_code: response.status
      });

      return {
        success: true,
        status: 'online',
        responseTime,
        statusCode: response.status
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      await WebsiteMonitoringModel.addCheck({
        website_id: website.id!,
        status: 'offline',
        response_time: responseTime,
        status_code: error.response?.status,
        error_message: error.message
      });

      return {
        success: false,
        status: 'offline',
        responseTime,
        statusCode: error.response?.status,
        error: error.message
      };
    }
  }

  /**
   * Prüft alle aktiven Websites
   */
  async checkAllWebsites() {
    console.log('\n========================================');
    console.log('Website-Monitoring-Check gestartet');
    console.log(`Zeitpunkt: ${new Date().toLocaleString('de-DE')}`);
    console.log('========================================\n');

    try {
      const websites = await WebsiteMonitoringModel.getEnabledWebsites();

      if (websites.length === 0) {
        console.log('Keine aktiven Websites zum Überwachen');
        return;
      }

      const results = await Promise.allSettled(
        websites.map(website => this.checkWebsite(website))
      );

      let successCount = 0;
      let failureCount = 0;

      results.forEach((result, index) => {
        const website = websites[index];
        if (result.status === 'fulfilled') {
          const check = result.value;
          if (check.success) {
            console.log(`✓ ${website.name}: ${check.responseTime}ms (${check.statusCode})`);
            successCount++;
          } else {
            console.log(`✗ ${website.name}: OFFLINE (${check.error})`);
            failureCount++;
          }
        } else {
          console.log(`✗ ${website.name}: FEHLER (${result.reason})`);
          failureCount++;
        }
      });

      console.log('\n========================================');
      console.log(`Website-Monitoring-Check abgeschlossen`);
      console.log(`Online: ${successCount}, Offline: ${failureCount}`);
      console.log('========================================\n');

      // Bereinige alte Checks (älter als 25 Stunden, um 24h Historie zu behalten)
      await WebsiteMonitoringModel.deleteOldChecks(25);
    } catch (error) {
      console.error('Fehler beim Website-Monitoring-Check:', error);
    }
  }

  /**
   * Gibt Website-Status mit 24h-Statistiken zurück
   */
  async getWebsiteStatusWithStats() {
    const websites = await WebsiteMonitoringModel.getAllWebsites();

    const results = await Promise.all(
      websites.map(async (website) => {
        const latestCheck = await WebsiteMonitoringModel.getLatestCheck(website.id!);
        const stats = await WebsiteMonitoringModel.getStats24Hours(website.id!);
        const checks24h = await WebsiteMonitoringModel.getChecksLast24Hours(website.id!);

        return {
          id: website.id,
          url: website.url,
          name: website.name,
          enabled: website.enabled,
          currentStatus: latestCheck?.status || 'unknown',
          currentResponseTime: latestCheck?.response_time || 0,
          lastCheck: latestCheck?.checked_at || null,
          stats24h: {
            totalChecks: parseInt(stats.total_checks) || 0,
            successfulChecks: parseInt(stats.successful_checks) || 0,
            failedChecks: parseInt(stats.failed_checks) || 0,
            avgResponseTime: Math.round(parseFloat(stats.avg_response_time) || 0),
            minResponseTime: parseInt(stats.min_response_time) || 0,
            maxResponseTime: parseInt(stats.max_response_time) || 0,
            uptimePercentage: Math.round((parseFloat(stats.uptime_percentage) || 0) * 10) / 10
          },
          history24h: checks24h.reverse().map(check => ({
            status: check.status,
            responseTime: check.response_time,
            timestamp: check.checked_at,
            statusCode: check.status_code
          }))
        };
      })
    );

    return results;
  }
}

export const websiteMonitoringService = new WebsiteMonitoringService();

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface FirewallSNMPData {
  hostname: string;
  ip: string;
  location: string;
  uptime: string;
  cpuUsage: number;
  memoryUsage: number;
  activeSessions: number;
  firmwareVersion: string;
  timestamp: Date;
}

export class SNMPService {
  private community: string;
  private timeout: number;
  private hostnameMapping: Record<string, string>;

  constructor() {
    this.community = process.env.SNMP_COMMUNITY || 'frisia-network';
    this.timeout = 5; // Sekunden

    // Hostname-Mapping für benutzerdefinierte Namen
    this.hostnameMapping = {
      '10.50.149.254': 'RNF-NDD-FG100F',
      '10.66.149.254': 'FRISIA I',
      '10.67.149.254': 'FRISIA II',
      '10.68.149.254': 'FRISIA III',
      // Weitere Mappings können hier hinzugefügt werden
    };
  }

  /**
   * Gibt den benutzerdefinierten Hostnamen zurück, falls vorhanden
   */
  private getCustomHostname(ip: string, originalHostname: string): string {
    return this.hostnameMapping[ip] || originalHostname;
  }

  /**
   * Konvertiert Hex-String zu normalem Text
   */
  private hexToAscii(hexString: string): string {
    try {
      // Entfernt Spaces aus dem Hex-String und konvertiert zu Text
      const hex = hexString.replace(/\s+/g, '');
      const bytes = [];
      for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
      }
      return Buffer.from(bytes).toString('utf8');
    } catch (error) {
      return hexString; // Fallback zum Original
    }
  }

  /**
   * Führt ein SNMP GET-Kommando aus
   */
  private async snmpGet(ip: string, oid: string): Promise<string> {
    try {
      const command = `snmpget -v2c -c ${this.community} -t ${this.timeout} -r 1 ${ip} ${oid}`;
      const { stdout } = await execAsync(command);

      // Parse SNMP-Ausgabe
      const match = stdout.match(/=\s*(.+?):\s*(.+)/);
      if (match && match[2]) {
        const type = match[1].trim();
        let value = match[2].trim().replace(/^"(.+)"$/, '$1');

        // Konvertiere Hex-STRING zu normalem Text
        if (type === 'Hex-STRING' && value.match(/^[0-9A-F\s]+$/)) {
          value = this.hexToAscii(value);
        }

        return value;
      }
      return '';
    } catch (error) {
      console.error(`SNMP GET Fehler für ${ip} ${oid}:`, error);
      return '';
    }
  }

  /**
   * Konvertiert Timeticks in einen lesbaren String
   */
  private parseUptime(timeticks: string): string {
    const match = timeticks.match(/\((\d+)\)/);
    if (!match) return timeticks;

    const ticks = parseInt(match[1]);
    const seconds = Math.floor(ticks / 100);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${days}d ${hours}h ${minutes}m`;
  }

  /**
   * Ruft SNMP-Daten von einer Fortinet Firewall ab
   */
  async getFortinetData(ip: string): Promise<FirewallSNMPData | null> {
    try {
      const [
        hostname,
        location,
        uptime,
        cpuUsage,
        memoryUsage,
        activeSessions,
        firmwareVersion
      ] = await Promise.all([
        this.snmpGet(ip, '1.3.6.1.2.1.1.5.0'),          // sysName
        this.snmpGet(ip, '1.3.6.1.2.1.1.6.0'),          // sysLocation
        this.snmpGet(ip, '1.3.6.1.2.1.1.3.0'),          // sysUptime
        this.snmpGet(ip, '1.3.6.1.4.1.12356.101.4.1.3.0'), // CPU Usage
        this.snmpGet(ip, '1.3.6.1.4.1.12356.101.4.1.4.0'), // Memory Usage
        this.snmpGet(ip, '1.3.6.1.4.1.12356.101.4.1.8.0'), // Active Sessions
        this.snmpGet(ip, '1.3.6.1.4.1.12356.101.4.1.1.0')  // Firmware Version
      ]);

      if (!hostname) {
        console.error(`Keine Antwort von Firewall ${ip}`);
        return null;
      }

      return {
        hostname: this.getCustomHostname(ip, hostname),
        ip,
        location,
        uptime: this.parseUptime(uptime),
        cpuUsage: parseInt(cpuUsage) || 0,
        memoryUsage: parseInt(memoryUsage) || 0,
        activeSessions: parseInt(activeSessions) || 0,
        firmwareVersion,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Fehler beim Abrufen der SNMP-Daten von ${ip}:`, error);
      return null;
    }
  }

  /**
   * Ruft SNMP-Daten von mehreren Firewalls ab
   */
  async getAllFirewallsData(ips: string[]): Promise<FirewallSNMPData[]> {
    const results = await Promise.all(
      ips.map(ip => this.getFortinetData(ip))
    );

    return results.filter((data): data is FirewallSNMPData => data !== null);
  }
}

export const snmpService = new SNMPService();

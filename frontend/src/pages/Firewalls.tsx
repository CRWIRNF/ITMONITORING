import { useState, useEffect } from 'react';
import { firewallService, FirewallData, FirewallHistoryEntry } from '../services/firewallService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Firewalls() {
  const [currentData, setCurrentData] = useState<FirewallData[]>([]);
  const [historyData, setHistoryData] = useState<{ [key: string]: FirewallHistoryEntry[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
    // Auto-refresh alle 30 Sekunden
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Lade aktuelle Stats und Historie parallel
      const [stats, history] = await Promise.all([
        firewallService.getFirewallStats(),
        firewallService.getFirewallsHistory(4)
      ]);

      setCurrentData(stats);
      setHistoryData(history);
    } catch (err: any) {
      setError('Fehler beim Laden der Firewall-Daten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Farbpalette für die Firewalls
  const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#ec4899', '#6366f1'];

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  // Transformiere Historie-Daten für CPU-Chart
  const getCpuChartData = () => {
    if (Object.keys(historyData).length === 0) return [];

    const timestamps = new Set<string>();
    Object.values(historyData).forEach(entries => {
      entries.forEach(entry => timestamps.add(entry.timestamp));
    });

    const sortedTimestamps = Array.from(timestamps).sort();

    return sortedTimestamps.map(timestamp => {
      const dataPoint: any = { time: formatTime(timestamp) };
      Object.entries(historyData).forEach(([_ip, entries]) => {
        const entry = entries.find(e => e.timestamp === timestamp);
        if (entry) {
          dataPoint[entry.hostname] = entry.cpu_usage;
        }
      });
      return dataPoint;
    });
  };

  // Transformiere Historie-Daten für Memory-Chart
  const getMemoryChartData = () => {
    if (Object.keys(historyData).length === 0) return [];

    const timestamps = new Set<string>();
    Object.values(historyData).forEach(entries => {
      entries.forEach(entry => timestamps.add(entry.timestamp));
    });

    const sortedTimestamps = Array.from(timestamps).sort();

    return sortedTimestamps.map(timestamp => {
      const dataPoint: any = { time: formatTime(timestamp) };
      Object.entries(historyData).forEach(([_ip, entries]) => {
        const entry = entries.find(e => e.timestamp === timestamp);
        if (entry) {
          dataPoint[entry.hostname] = entry.memory_usage;
        }
      });
      return dataPoint;
    });
  };

  // Transformiere Historie-Daten für Sessions-Chart
  const getSessionsChartData = () => {
    if (Object.keys(historyData).length === 0) return [];

    const timestamps = new Set<string>();
    Object.values(historyData).forEach(entries => {
      entries.forEach(entry => timestamps.add(entry.timestamp));
    });

    const sortedTimestamps = Array.from(timestamps).sort();

    return sortedTimestamps.map(timestamp => {
      const dataPoint: any = { time: formatTime(timestamp) };
      Object.entries(historyData).forEach(([_ip, entries]) => {
        const entry = entries.find(e => e.timestamp === timestamp);
        if (entry) {
          dataPoint[entry.hostname] = entry.active_sessions;
        }
      });
      return dataPoint;
    });
  };

  // Extrahiere Hostnamen für die Linien
  const getHostnames = () => {
    const hostnamesSet = new Set<string>();
    Object.values(historyData).forEach(entries => {
      entries.forEach(entry => hostnamesSet.add(entry.hostname));
    });
    return Array.from(hostnamesSet);
  };

  if (loading && currentData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Lade Firewall-Daten...</div>
      </div>
    );
  }

  const cpuData = getCpuChartData();
  const memoryData = getMemoryChartData();
  const sessionsData = getSessionsChartData();
  const hostnames = getHostnames();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Firewall Monitoring</h1>
          <p className="text-gray-600 mt-2">
            Verlauf der letzten 4 Stunden für {currentData.length} Firewalls
          </p>
        </div>
        <button
          onClick={loadData}
          className="btn btn-secondary"
          disabled={loading}
        >
          {loading ? 'Lädt...' : 'Aktualisieren'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {currentData.length === 0 ? (
        <div className="card text-center text-gray-500">
          Keine Firewall-Daten verfügbar
        </div>
      ) : (
        <div className="space-y-6">
          {/* CPU-Auslastung Chart */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">CPU-Auslastung (%)</h2>
            {cpuData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cpuData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip />
                  <Legend />
                  {hostnames.map((hostname, index) => (
                    <Line
                      key={hostname}
                      type="monotone"
                      dataKey={hostname}
                      name={hostname}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: colors[index % colors.length] }}
                      activeDot={{ r: 5 }}
                      connectNulls={true}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Keine Verlaufsdaten verfügbar. Daten werden alle 5 Minuten gesammelt.
              </div>
            )}
          </div>

          {/* RAM-Auslastung Chart */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">RAM-Auslastung (%)</h2>
            {memoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={memoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip />
                  <Legend />
                  {hostnames.map((hostname, index) => (
                    <Line
                      key={hostname}
                      type="monotone"
                      dataKey={hostname}
                      name={hostname}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: colors[index % colors.length] }}
                      activeDot={{ r: 5 }}
                      connectNulls={true}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Keine Verlaufsdaten verfügbar. Daten werden alle 5 Minuten gesammelt.
              </div>
            )}
          </div>

          {/* Aktive Sessions Chart */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Aktive Sessions</h2>
            {sessionsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sessionsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip />
                  <Legend />
                  {hostnames.map((hostname, index) => (
                    <Line
                      key={hostname}
                      type="monotone"
                      dataKey={hostname}
                      name={hostname}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: colors[index % colors.length] }}
                      activeDot={{ r: 5 }}
                      connectNulls={true}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Keine Verlaufsdaten verfügbar. Daten werden alle 5 Minuten gesammelt.
              </div>
            )}
          </div>

          {/* Legende mit aktuellen Werten */}
          <div className="card bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Aktuelle Werte</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentData.map((firewall, index) => (
                <div key={firewall.ip} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start space-x-2 mb-3">
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {firewall.hostname}
                      </div>
                      <div className="text-xs text-gray-500">
                        {firewall.ip}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">CPU:</span>
                      <span className="font-semibold">{firewall.cpuUsage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">RAM:</span>
                      <span className="font-semibold">{firewall.memoryUsage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sessions:</span>
                      <span className="font-semibold">{firewall.activeSessions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Uptime:</span>
                      <span className="font-semibold">{firewall.uptime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

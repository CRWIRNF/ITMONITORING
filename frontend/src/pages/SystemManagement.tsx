import React, { useState, useEffect } from 'react';
import { systemService, SystemMetrics, SystemMetricsHistory, LoginHistoryEntry } from '../services/systemService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SystemManagement: React.FC = () => {
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<SystemMetricsHistory[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHours, setSelectedHours] = useState(24);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Aktualisiere alle 60 Sekunden
    return () => clearInterval(interval);
  }, [selectedHours]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metrics, history, logins] = await Promise.all([
        systemService.getCurrentMetrics(),
        systemService.getMetricsHistory(selectedHours),
        systemService.getLoginHistory(10)
      ]);

      setCurrentMetrics(metrics);
      setMetricsHistory(history);
      setLoginHistory(logins);
    } catch (err: any) {
      console.error('Error loading system data:', err);
      setError(err.response?.data?.error || err.message || 'Fehler beim Laden der Systemdaten');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatChartData = () => {
    if (!metricsHistory || metricsHistory.length === 0) {
      return [];
    }

    return metricsHistory.map(entry => {
      try {
        const cpuUsage = typeof entry.cpu_usage === 'string'
          ? parseFloat(entry.cpu_usage)
          : entry.cpu_usage;

        const memoryTotal = typeof entry.memory_total === 'string'
          ? parseFloat(entry.memory_total)
          : entry.memory_total;

        const memoryUsed = typeof entry.memory_used === 'string'
          ? parseFloat(entry.memory_used)
          : entry.memory_used;

        const diskTotal = typeof entry.disk_total === 'string'
          ? parseFloat(entry.disk_total)
          : entry.disk_total;

        const diskUsed = typeof entry.disk_used === 'string'
          ? parseFloat(entry.disk_used)
          : entry.disk_used;

        return {
          time: new Date(entry.created_at).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          cpu: parseFloat((cpuUsage || 0).toFixed(2)),
          memory: parseFloat(((memoryUsed / memoryTotal) * 100 || 0).toFixed(2)),
          disk: parseFloat(((diskUsed / diskTotal) * 100 || 0).toFixed(2))
        };
      } catch (err) {
        console.error('Error formatting chart entry:', err, entry);
        return {
          time: new Date(entry.created_at).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          cpu: 0,
          memory: 0,
          disk: 0
        };
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Systemverwaltung</h1>
        <button
          onClick={loadData}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {loading ? 'Lädt...' : 'Aktualisieren'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {loading && !currentMetrics && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Aktuelle Metriken */}
      {currentMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* CPU Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">CPU</h3>
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {currentMetrics.cpu.usage.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(currentMetrics.cpu.usage, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">{currentMetrics.cpu.cores} Kerne</p>
          </div>

          {/* Memory Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">RAM</h3>
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {currentMetrics.memory.usagePercent.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(currentMetrics.memory.usagePercent, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {formatBytes(currentMetrics.memory.used)} / {formatBytes(currentMetrics.memory.total)}
            </p>
          </div>

          {/* Disk Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Festplatte</h3>
              <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {currentMetrics.disk.usagePercent.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(currentMetrics.disk.usagePercent, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {formatBytes(currentMetrics.disk.used)} / {formatBytes(currentMetrics.disk.total)}
            </p>
          </div>
        </div>
      )}

      {/* Uptime */}
      {currentMetrics && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-lg font-semibold text-gray-700">System Uptime</span>
            </div>
            <span className="text-xl font-bold text-gray-800">{formatUptime(currentMetrics.uptime)}</span>
          </div>
        </div>
      )}

      {/* Verlaufsdiagramme */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Verlauf</h3>
          <select
            value={selectedHours}
            onChange={(e) => setSelectedHours(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="6">Letzte 6 Stunden</option>
            <option value="12">Letzte 12 Stunden</option>
            <option value="24">Letzte 24 Stunden</option>
            <option value="48">Letzte 48 Stunden</option>
            <option value="168">Letzte 7 Tage</option>
          </select>
        </div>

        {metricsHistory && metricsHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={formatChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="cpu" stroke="#3B82F6" name="CPU %" strokeWidth={2} />
              <Line type="monotone" dataKey="memory" stroke="#10B981" name="RAM %" strokeWidth={2} />
              <Line type="monotone" dataKey="disk" stroke="#8B5CF6" name="Festplatte %" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-gray-500 py-8">
            {loading ? 'Lade Verlaufsdaten...' : 'Keine Verlaufsdaten verfügbar'}
          </div>
        )}
      </div>

      {/* Login Historie */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">Letzte 10 Logins</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  E-Mail
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP-Adresse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zeitpunkt
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loginHistory && loginHistory.length > 0 ? (
                loginHistory.map((login) => (
                  <tr key={login.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {login.success ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Erfolgreich
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Fehlgeschlagen
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {login.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {login.ip_address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(login.created_at).toLocaleString('de-DE')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    {loading ? 'Lade Login-Historie...' : 'Keine Login-Historie verfügbar'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SystemManagement;

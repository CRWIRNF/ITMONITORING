import { useState, useEffect } from 'react';
import { websiteService, Website } from '../services/websiteService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Websites() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredWebsite, setHoveredWebsite] = useState<number | null>(null);

  useEffect(() => {
    loadData();
    // Automatische Aktualisierung alle 30 Sekunden
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await websiteService.getWebsites();
      setWebsites(result);
      setError('');
    } catch (err: any) {
      setError('Fehler beim Laden der Website-Daten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const triggerManualCheck = async () => {
    try {
      await websiteService.triggerCheck();
      // Warte kurz, dann lade Daten neu
      setTimeout(loadData, 2000);
    } catch (err: any) {
      console.error('Fehler beim manuellen Check:', err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && websites.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Lade Website-Daten...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Website Monitoring</h1>
          <p className="text-gray-600 mt-2">Überwachung von Websites - Latenz der letzten 24 Stunden</p>
        </div>
        <div className="flex gap-2">
          <button onClick={triggerManualCheck} className="btn btn-primary">
            Jetzt prüfen
          </button>
          <button onClick={loadData} className="btn btn-secondary">
            Aktualisieren
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {websites.length === 0 ? (
        <div className="card text-center text-gray-500">
          Keine Websites zum Überwachen konfiguriert
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {websites.map((website) => {
            const isOffline = website.currentStatus !== 'online';
            const chartData = website.history24h.map(entry => ({
              time: formatTimestamp(entry.timestamp),
              latency: entry.responseTime,
              status: entry.status
            }));

            return (
              <div
                key={website.id}
                className={`relative bg-white rounded-lg shadow-md p-4 transition-all cursor-pointer ${
                  isOffline ? 'border-4 border-red-500' : 'border border-gray-200'
                }`}
                onMouseEnter={() => setHoveredWebsite(website.id)}
                onMouseLeave={() => setHoveredWebsite(null)}
              >
                {/* Normale Ansicht */}
                {hoveredWebsite !== website.id && (
                  <div>
                    {/* Header */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-lg font-bold text-gray-900">{website.name}</h2>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            website.currentStatus === 'online'
                              ? 'bg-green-100 text-green-800'
                              : website.currentStatus === 'offline'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {website.currentStatus === 'online' ? 'Online' : website.currentStatus === 'offline' ? 'Offline' : 'Unbekannt'}
                        </span>
                      </div>
                      <a
                        href={website.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs block truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {website.url}
                      </a>
                      {website.lastCheck && (
                        <p className="text-xs text-gray-500 mt-1">
                          Letzte Prüfung: {formatDate(website.lastCheck)}
                        </p>
                      )}
                    </div>

                    {/* 24h Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Verfügbarkeit</div>
                        <div className={`text-lg font-bold ${
                          website.stats24h.uptimePercentage >= 99
                            ? 'text-green-600'
                            : website.stats24h.uptimePercentage >= 95
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}>
                          {website.stats24h.uptimePercentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {website.stats24h.successfulChecks}/{website.stats24h.totalChecks}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Ø Latenz</div>
                        <div className="text-lg font-bold text-gray-900">
                          {website.stats24h.avgResponseTime} ms
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Min</div>
                        <div className="text-lg font-bold text-gray-900">
                          {website.stats24h.minResponseTime} ms
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Max</div>
                        <div className="text-lg font-bold text-gray-900">
                          {website.stats24h.maxResponseTime} ms
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chart beim Hover */}
                {hoveredWebsite === website.id && chartData.length > 0 && (
                  <div className="absolute inset-0 bg-white rounded-lg shadow-2xl p-4 z-10">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">{website.name} - Latenz (24h)</h3>
                    <ResponsiveContainer width="100%" height="90%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 10 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fontSize: 10 }}
                          label={{ value: 'ms', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', fontSize: 12 }}
                          formatter={(value: number | undefined) => [`${value ?? 0} ms`, 'Latenz']}
                        />
                        <Line
                          type="monotone"
                          dataKey="latency"
                          stroke={isOffline ? '#dc2626' : '#3b82f6'}
                          strokeWidth={2}
                          dot={{ r: 2 }}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

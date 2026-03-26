import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { monitoringService } from '../services/monitoringService';
import { TicketingData, TicketTrendEntry, TicketCreatorEntry } from '../types';

export default function Ticketsystem() {
  const [data, setData] = useState<TicketingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendData, setTrendData] = useState<TicketTrendEntry[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [topCreators, setTopCreators] = useState<TicketCreatorEntry[]>([]);
  const [creatorsLoading, setCreatorsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await monitoringService.getTicketsystemStatus();
      setData(result);
    } catch (err: any) {
      setError('Fehler beim Laden der Ticketsystem-Daten');
      console.error(err);
    } finally {
      setLoading(false);
    }

    // Trend-Daten unabhängig laden
    try {
      setTrendLoading(true);
      const trend = await monitoringService.getTicketTrend(12);
      setTrendData(trend);
    } catch (err: any) {
      console.error('Fehler beim Laden der Trend-Daten:', err);
    } finally {
      setTrendLoading(false);
    }

    // Top-Ersteller laden
    try {
      setCreatorsLoading(true);
      const creators = await monitoringService.getTopTicketCreators();
      setTopCreators(creators);
    } catch (err: any) {
      console.error('Fehler beim Laden der Top-Ersteller:', err);
    } finally {
      setCreatorsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Lade Ticketsystem-Daten...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ticketsystem Monitoring</h1>
          <p className="text-gray-600 mt-2">NinjaOne Ticketing Übersicht</p>
        </div>
        <button onClick={loadData} className="btn btn-secondary">
          Aktualisieren
        </button>
      </div>

      {!data ? (
        <div className="card text-center text-gray-500">
          Keine Ticketsystem-Daten gefunden
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Card */}
          <div className={`card border-2 ${getStatusColor(data.status)}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{data.service_name}</h2>
                <p className="mt-1">{data.message}</p>
              </div>
              <div className={`text-4xl font-bold ${data.status === 'ok' ? 'text-green-600' : data.status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
                {data.status === 'ok' ? '✓' : data.status === 'warning' ? '⚠' : '✗'}
              </div>
            </div>
          </div>

          {/* Combined Creation & Closure Statistics */}
          {data.details.creationStats && data.details.closureStats && (
            <div className="card">
              <h2 className="text-2xl font-semibold mb-6">Ticket-Aktivität</h2>

              <div className="space-y-8">
                {/* Erstellte Tickets */}
                <div>
                  <div className="flex items-center mb-4">
                    <div className="text-lg font-semibold text-gray-700">Erstellte Tickets</div>
                    <div className="ml-2 text-2xl">📝</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-blue-600 mb-2">Heute</div>
                          <div className="text-5xl font-bold text-blue-900">{data.details.creationStats.today}</div>
                        </div>
                        <div className="text-6xl text-blue-200">📅</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-purple-600 mb-2">Diese Woche</div>
                          <div className="text-5xl font-bold text-purple-900">{data.details.creationStats.thisWeek}</div>
                        </div>
                        <div className="text-6xl text-purple-200">📊</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-pink-600 mb-2">Dieser Monat</div>
                          <div className="text-5xl font-bold text-pink-900">{data.details.creationStats.thisMonth}</div>
                        </div>
                        <div className="text-6xl text-pink-200">📈</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-indigo-600 mb-2">Vormonat</div>
                          <div className="text-5xl font-bold text-indigo-900">{data.details.creationStats.lastMonth}</div>
                        </div>
                        <div className="text-6xl text-indigo-200">📆</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t-2 border-gray-200"></div>

                {/* Geschlossene Tickets */}
                <div>
                  <div className="flex items-center mb-4">
                    <div className="text-lg font-semibold text-gray-700">Geschlossene Tickets</div>
                    <div className="ml-2 text-2xl">✓</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-green-600 mb-2">Heute</div>
                          <div className="text-5xl font-bold text-green-900">{data.details.closureStats.today}</div>
                        </div>
                        <div className="text-6xl text-green-200">✅</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-teal-600 mb-2">Diese Woche</div>
                          <div className="text-5xl font-bold text-teal-900">{data.details.closureStats.thisWeek}</div>
                        </div>
                        <div className="text-6xl text-teal-200">✔️</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-emerald-600 mb-2">Dieser Monat</div>
                          <div className="text-5xl font-bold text-emerald-900">{data.details.closureStats.thisMonth}</div>
                        </div>
                        <div className="text-6xl text-emerald-200">🎯</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-2 border-cyan-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-cyan-600 mb-2">Vormonat</div>
                          <div className="text-5xl font-bold text-cyan-900">{data.details.closureStats.lastMonth}</div>
                        </div>
                        <div className="text-6xl text-cyan-200">✔</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ticket-Trend (12 Monate) */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-6">Ticket-Trend (12 Monate)</h2>
            {trendLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Lade Trend-Daten...</div>
              </div>
            ) : trendData.length === 0 ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Noch keine Trend-Daten verfügbar. Daten werden nach dem ersten Monat angezeigt.</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="created" name="Erstellt" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="closed" name="Geschlossen" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="open" name="Offen" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top Ticket-Ersteller */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-6">Top Ticket-Ersteller</h2>
            {creatorsLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-gray-500">Lade Ersteller-Daten...</div>
              </div>
            ) : topCreators.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-gray-500">Keine Daten verfügbar</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Tickets</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anteil</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topCreators.map((creator, index) => {
                      const maxCount = topCreators[0]?.count || 1;
                      const percentage = Math.round((creator.count / maxCount) * 100);
                      return (
                        <tr key={creator.name} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-50 text-gray-500'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{creator.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-semibold text-gray-900">{creator.count}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-full bg-gray-100 rounded-full h-4">
                              <div
                                className={`h-4 rounded-full ${
                                  index === 0 ? 'bg-blue-500' :
                                  index === 1 ? 'bg-blue-400' :
                                  index === 2 ? 'bg-blue-300' :
                                  'bg-blue-200'
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="card bg-blue-50 border-blue-200">
              <div className="text-sm font-medium text-blue-600 mb-1">Gesamt</div>
              <div className="text-3xl font-bold text-blue-900">{data.details.total}</div>
            </div>
            <div className="card bg-green-50 border-green-200">
              <div className="text-sm font-medium text-green-600 mb-1">Offen</div>
              <div className="text-3xl font-bold text-green-900">{data.details.open}</div>
            </div>
            <div className="card bg-gray-50 border-gray-200">
              <div className="text-sm font-medium text-gray-600 mb-1">Geschlossen</div>
              <div className="text-3xl font-bold text-gray-900">{data.details.closed}</div>
            </div>
            <div className="card bg-yellow-50 border-yellow-200">
              <div className="text-sm font-medium text-yellow-600 mb-1">Nicht zugewiesen</div>
              <div className="text-3xl font-bold text-yellow-900">{data.details.unassigned}</div>
            </div>
            <div className="card bg-purple-50 border-purple-200">
              <div className="text-sm font-medium text-purple-600 mb-1">Meine Tickets</div>
              <div className="text-3xl font-bold text-purple-900">{data.details.myTickets}</div>
            </div>
          </div>

          {/* Boards List */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Ticket-Boards</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Board
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Beschreibung
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Typ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tickets
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.details.boards.map((board) => (
                    <tr key={board.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{board.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{board.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          board.system ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {board.system ? 'System' : 'Custom'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-gray-900">{board.ticketCount}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

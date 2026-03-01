import { useState, useEffect } from 'react';
import { starlinkService, StarlinkShip } from '../services/starlinkService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Starlink() {
  const [ships, setShips] = useState<StarlinkShip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredShip, setHoveredShip] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Funktion zum Konvertieren römischer Zahlen in Dezimalzahlen
  const romanToDecimal = (roman: string): number => {
    const romanNumerals: { [key: string]: number } = {
      'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000
    };
    let result = 0;
    for (let i = 0; i < roman.length; i++) {
      const current = romanNumerals[roman[i]];
      const next = romanNumerals[roman[i + 1]];
      if (next && current < next) {
        result -= current;
      } else {
        result += current;
      }
    }
    return result;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await starlinkService.getStarlinkData();
      // Sortiere die Schiffe alphabetisch nach Namen (aufsteigend)
      // mit korrekter Behandlung römischer Zahlen
      const sortedShips = result.sort((a, b) => {
        // Extrahiere Basisname und römische Zahl
        const matchA = a.name.match(/^(.+?)\s*([IVX]+)$/);
        const matchB = b.name.match(/^(.+?)\s*([IVX]+)$/);

        if (matchA && matchB) {
          const baseA = matchA[1].trim();
          const baseB = matchB[1].trim();
          const romanA = matchA[2];
          const romanB = matchB[2];

          // Wenn Basisname gleich ist, sortiere nach römischer Zahl
          if (baseA === baseB) {
            return romanToDecimal(romanA) - romanToDecimal(romanB);
          }
        }

        // Ansonsten normale alphabetische Sortierung
        return a.name.localeCompare(b.name);
      });
      setShips(sortedShips);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Laden der Starlink-Daten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Berechnet Trendlinie mittels linearer Regression
  const calculateTrendLine = (data: { priorityGb: number; standardGb: number }[]) => {
    const n = data.length;
    if (n < 2) return data.map(() => null);

    // Gesamtnutzung pro Monat
    const totals = data.map(d => d.priorityGb + d.standardGb);

    // Lineare Regression: y = mx + b
    const xSum = (n * (n - 1)) / 2; // Summe von 0 bis n-1
    const ySum = totals.reduce((a, b) => a + b, 0);
    const xySum = totals.reduce((sum, y, x) => sum + x * y, 0);
    const x2Sum = (n * (n - 1) * (2 * n - 1)) / 6; // Summe von x²

    const m = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const b = (ySum - m * xSum) / n;

    // Trendwerte berechnen
    return data.map((_, i) => Math.round((m * i + b) * 100) / 100);
  };

  // Daten mit Trendlinie erweitern
  const getChartDataWithTrend = (monthlyHistory: { period: string; priorityGb: number; standardGb: number }[]) => {
    const reversedData = [...monthlyHistory].reverse();
    const trendValues = calculateTrendLine(reversedData);
    return reversedData.map((item, i) => ({
      ...item,
      trend: trendValues[i]
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Lade Starlink-Daten...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <div className="font-bold">Fehler</div>
        <div>{error}</div>
        <button onClick={loadData} className="mt-2 text-sm underline">
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Starlink Monitoring</h1>
          <p className="text-gray-600 mt-2">
            Überwachung der Starlink-Verbindungen ({ships.length} Schiffe)
          </p>
        </div>
        <button onClick={loadData} className="btn btn-secondary">
          Aktualisieren
        </button>
      </div>

      {ships.length === 0 ? (
        <div className="card text-center text-gray-500">
          Keine Starlink-Verbindungen gefunden
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ships.map((ship) => (
            <div
              key={ship.id}
              className="card relative"
              onMouseEnter={() => setHoveredShip(ship.id)}
              onMouseLeave={() => setHoveredShip(null)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{ship.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{ship.fullName}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ship.status)}`}>
                  {ship.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Datennutzung */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Datennutzung</span>
                  <span className="text-sm text-gray-600">
                    {ship.usedGb} GB / {ship.totalGb} GB
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all ${getUsageColor(ship.usagePercentage)}`}
                    style={{ width: `${Math.min(ship.usagePercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="text-right text-sm text-gray-600 mt-1">
                  {ship.usagePercentage}%
                </div>
              </div>

              {/* Terminal-Informationen */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Terminal Status:</span>
                  <span className={`font-medium ${ship.terminalActive ? 'text-green-600' : 'text-red-600'}`}>
                    {ship.terminalActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Kit Seriennummer:</span>
                  <span className="font-mono text-gray-900">{ship.kitSerialNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Dish Seriennummer:</span>
                  <span className="font-mono text-gray-900">{ship.dishSerialNumber}</span>
                </div>
              </div>

              {/* Zeitraum */}
              <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>
                    Periode: {new Date(ship.period.start).toLocaleDateString('de-DE')} -
                    {new Date(ship.period.end).toLocaleDateString('de-DE')}
                  </span>
                  <span>
                    Aktualisiert: {new Date(ship.lastUpdated).toLocaleString('de-DE')}
                  </span>
                </div>
              </div>

              {/* Historisches Chart - Hover Overlay */}
              {hoveredShip === ship.id && ship.monthlyHistory.length > 0 && (
                <div className="absolute inset-0 bg-white rounded-lg shadow-2xl p-6 z-10 overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-gray-900">{ship.name}</h4>
                      <p className="text-sm text-gray-600">Monatliche Datennutzung (12 Monate)</p>
                    </div>
                    <div className="flex-1" style={{ minHeight: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={getChartDataWithTrend(ship.monthlyHistory)}
                          margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="period"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis
                            label={{ value: 'GB', angle: -90, position: 'insideLeft' }}
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip
                            contentStyle={{ fontSize: '12px' }}
                            formatter={(value: number | undefined) => [`${value ?? 0} GB`, '']}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Line type="monotone" dataKey="priorityGb" stroke="#3B82F6" name="Priority" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="standardGb" stroke="#93C5FD" name="Standard" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="linear" dataKey="trend" stroke="#EF4444" name="Trend" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 text-center">
                      Inklusiv-Volumen: {ship.totalGb} GB/Monat
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

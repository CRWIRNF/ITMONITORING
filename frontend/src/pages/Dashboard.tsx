import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { monitoringService } from '../services/monitoringService';
import { DashboardSummary } from '../types';

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await monitoringService.getDashboard();
      setSummary(data);
    } catch (err: any) {
      setError('Fehler beim Laden der Dashboard-Daten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (serviceType: string) => {
    const icons: { [key: string]: string } = {
      starlink: '🛰️',
      ticketsystem: '🎫',
      firewall: '🔥',
      website: '🌐',
    };
    return icons[serviceType] || '📊';
  };

  const getServiceName = (serviceType: string) => {
    const names: { [key: string]: string } = {
      starlink: 'Starlink',
      ticketsystem: 'Ticketsystem',
      firewall: 'Firewalls',
      website: 'Websites',
    };
    return names[serviceType] || serviceType;
  };

  const getServiceLink = (serviceType: string) => {
    const links: { [key: string]: string } = {
      starlink: '/starlink',
      ticketsystem: '/ticketsystem',
      firewall: '/firewalls',
      website: '/websites',
    };
    return links[serviceType] || '/';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Lade Dashboard...</div>
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

  const totalServices = summary.reduce((acc, s) => acc + s.total_services, 0);
  const totalOnline = summary.reduce((acc, s) => acc + s.online, 0);
  const totalOffline = summary.reduce((acc, s) => acc + s.offline, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={loadDashboard}
          className="btn btn-secondary"
        >
          Aktualisieren
        </button>
      </div>

      {/* Gesamt-Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-blue-50 border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Gesamt Services</h3>
          <p className="text-3xl font-bold text-blue-700">{totalServices}</p>
        </div>
        <div className="card bg-green-50 border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Online</h3>
          <p className="text-3xl font-bold text-green-700">{totalOnline}</p>
        </div>
        <div className="card bg-red-50 border-l-4 border-red-500">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Offline</h3>
          <p className="text-3xl font-bold text-red-700">{totalOffline}</p>
        </div>
      </div>

      {/* Service-Übersicht */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summary.map((service) => (
          <Link
            key={service.service_type}
            to={getServiceLink(service.service_type)}
            className="card hover:shadow-xl transition-shadow cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">{getServiceIcon(service.service_type)}</div>
              <div className="text-right">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition">
                  {getServiceName(service.service_type)}
                </h3>
                <p className="text-sm text-gray-500">{service.total_services} Services</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Online:</span>
                <span className="font-medium">{service.online}</span>
              </div>
              {service.offline > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">Offline:</span>
                  <span className="font-medium">{service.offline}</span>
                </div>
              )}
              {service.warning > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-yellow-600">Warnung:</span>
                  <span className="font-medium">{service.warning}</span>
                </div>
              )}
              {service.avg_response_time && (
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Ø Antwortzeit:</span>
                  <span className="font-medium">{Math.round(service.avg_response_time)}ms</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

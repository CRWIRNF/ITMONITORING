import { MonitoringEntry } from '../types';
import StatusBadge from './StatusBadge';

interface MonitoringCardProps {
  entry: MonitoringEntry;
}

export default function MonitoringCard({ entry }: MonitoringCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('de-DE');
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{entry.service_name}</h3>
          <p className="text-sm text-gray-500">Letzte Prüfung: {formatDate(entry.last_check)}</p>
        </div>
        <StatusBadge status={entry.status} />
      </div>

      <div className="space-y-2">
        {entry.response_time !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Antwortzeit:</span>
            <span className="font-medium">{entry.response_time}ms</span>
          </div>
        )}

        {entry.details && Object.keys(entry.details).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Details:</p>
            <div className="space-y-1">
              {Object.entries(entry.details).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

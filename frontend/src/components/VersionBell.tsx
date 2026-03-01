import { useState, useEffect } from 'react';
import { versionService, VersionInfo, VersionChange } from '../services/versionService';

export default function VersionBell() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersionInfo();
  }, []);

  const loadVersionInfo = async () => {
    try {
      const data = await versionService.getVersion();
      setVersionInfo(data);
    } catch (error) {
      console.error('Fehler beim Laden der Versionsinformationen:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'release':
        return 'bg-green-100 text-green-800';
      case 'feature':
        return 'bg-blue-100 text-blue-800';
      case 'bugfix':
        return 'bg-yellow-100 text-yellow-800';
      case 'security':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'release':
        return '🚀';
      case 'feature':
        return '✨';
      case 'bugfix':
        return '🔧';
      case 'security':
        return '🔒';
      default:
        return '📝';
    }
  };

  if (loading || !versionInfo) {
    return null;
  }

  return (
    <div className="relative">
      <button
        className="relative p-2 hover:bg-blue-700 rounded-md transition-colors"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label="Version Information"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
          {versionInfo.version}
        </span>
      </button>
      {showTooltip && (
        <div
          className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Version {versionInfo.version}</h3>
              <span className="text-sm opacity-90">
                {new Date(versionInfo.releaseDate).toLocaleDateString('de-DE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {versionInfo.changelog.map((entry: VersionChange, idx: number) => (
              <div
                key={idx}
                className="p-4 border-b border-gray-200 last:border-b-0"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{getTypeIcon(entry.type)}</span>
                    <h4 className="font-semibold text-gray-900">
                      Version {entry.version}
                    </h4>
                  </div>
                  <span className={"text-xs px-2 py-1 rounded-full " + getTypeColor(entry.type)}>
                    {entry.type}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {new Date(entry.date).toLocaleDateString('de-DE')}
                </div>
                <ul className="space-y-1.5">
                  {entry.changes.map((change: string, cidx: number) => (
                    <li key={cidx} className="text-sm text-gray-700 flex items-start">
                      <span className="mr-2 mt-0.5">•</span>
                      <span className="flex-1">{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 px-4 py-2 text-center">
            <p className="text-xs text-gray-600">
              Monitoring System - Changelog
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

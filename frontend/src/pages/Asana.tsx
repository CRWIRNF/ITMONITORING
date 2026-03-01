import { useState, useEffect } from 'react';
import { asanaService, AsanaOverview, TeamStats } from '../services/asanaService';

export default function Asana() {
  const [overview, setOverview] = useState<AsanaOverview | null>(null);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'team'>('team');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      if (activeTab === 'overview') {
        const data = await asanaService.getOverview();
        setOverview(data);
      } else {
        const data = await asanaService.getTeamStats();
        setTeamStats(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Laden der Asana-Daten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Kein Datum';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTaskStatusColor = (task: any) => {
    if (task.completed) return 'bg-green-100 text-green-800';

    if (task.due_on || task.due_at) {
      const dueDate = new Date(task.due_on || task.due_at);
      const now = new Date();

      if (dueDate < now) return 'bg-red-100 text-red-800';
      if (dueDate.toDateString() === now.toDateString()) return 'bg-yellow-100 text-yellow-800';
    }

    return 'bg-blue-100 text-blue-800';
  };

  const getTaskStatusText = (task: any) => {
    if (task.completed) return 'Abgeschlossen';

    if (task.due_on || task.due_at) {
      const dueDate = new Date(task.due_on || task.due_at);
      const now = new Date();

      if (dueDate < now) return 'Überfällig';
      if (dueDate.toDateString() === now.toDateString()) return 'Heute fällig';
    }

    return 'Offen';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Lade Asana-Daten...</div>
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
          <h1 className="text-3xl font-bold text-gray-900">Asana Task-Management</h1>
          <p className="text-gray-600 mt-2">
            Übersicht über Projekte und Aufgaben
          </p>
        </div>
        <button onClick={loadData} className="btn btn-secondary">
          Aktualisieren
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('team')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'team'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Team-Statistiken
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Meine Tasks
          </button>
        </nav>
      </div>

      {/* Team-Statistiken View */}
      {activeTab === 'team' && teamStats && (
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="text-sm font-medium opacity-90">Gesamt Offene Tasks</div>
              <div className="text-3xl font-bold mt-2">{teamStats.summary.totalOpenTasks}</div>
            </div>
            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="text-sm font-medium opacity-90">Abgeschlossen (30 Tage)</div>
              <div className="text-3xl font-bold mt-2">{teamStats.summary.totalCompletedTasks}</div>
            </div>
            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="text-sm font-medium opacity-90">Gesamt Tasks</div>
              <div className="text-3xl font-bold mt-2">{teamStats.summary.totalTasks}</div>
            </div>
          </div>

          {/* Team Member Stats */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">IT-Team Übersicht</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mitarbeiter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Offene Tasks
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Abgeschlossen (30d)
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gesamt
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teamStats.teamMembers.map((member) => (
                    <tr key={member.user.gid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{member.user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{member.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {member.openTasks}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {member.completedTasks}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-gray-900">{member.totalTasks}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Overview View */}
      {activeTab === 'overview' && overview && (
        <div>

      {/* Statistik-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="text-sm font-medium opacity-90">Offene Tasks</div>
          <div className="text-3xl font-bold mt-2">{overview.tasks.open}</div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="text-sm font-medium opacity-90">Heute fällig</div>
          <div className="text-3xl font-bold mt-2">{overview.tasks.today}</div>
        </div>

        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="text-sm font-medium opacity-90">Überfällig</div>
          <div className="text-3xl font-bold mt-2">{overview.tasks.overdue}</div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="text-sm font-medium opacity-90">Abgeschlossen</div>
          <div className="text-3xl font-bold mt-2">{overview.tasks.completed}</div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="text-sm font-medium opacity-90">Aktive Projekte</div>
          <div className="text-3xl font-bold mt-2">{overview.projects.active}</div>
        </div>
      </div>

      {/* Tasks und Projekte in zwei Spalten */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Aktuelle Tasks ({overview.tasks.list.length})
          </h2>

          {overview.tasks.list.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Keine Tasks vorhanden</p>
          ) : (
            <div className="space-y-3">
              {overview.tasks.list.map((task) => (
                <div
                  key={task.gid}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{task.name}</h3>
                      {task.assignee && (
                        <p className="text-sm text-gray-600 mt-1">
                          Zugewiesen an: {task.assignee.name}
                        </p>
                      )}
                      {(task.due_on || task.due_at) && (
                        <p className="text-sm text-gray-600 mt-1">
                          Fällig: {formatDate(task.due_on || task.due_at)}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${getTaskStatusColor(task)}`}>
                      {getTaskStatusText(task)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projekte */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Aktive Projekte ({overview.projects.list.length})
          </h2>

          {overview.projects.list.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Keine Projekte vorhanden</p>
          ) : (
            <div className="space-y-3">
              {overview.projects.list.map((project) => (
                <div
                  key={project.gid}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      {project.current_status_update && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">
                            {project.current_status_update.title}
                          </p>
                          {project.current_status_update.text && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {project.current_status_update.text}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${
                      project.completed
                        ? 'bg-green-100 text-green-800'
                        : project.archived
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {project.completed ? 'Abgeschlossen' : project.archived ? 'Archiviert' : 'Aktiv'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
        </div>
      )}
    </div>
  );
}

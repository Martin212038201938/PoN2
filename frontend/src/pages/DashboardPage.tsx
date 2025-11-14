import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { FolderOpen, CheckCircle, Clock, Users, FileSearch } from 'lucide-react';
import { formatPercentage } from '../utils/format';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats(),
  });

  const stats: DashboardStats | undefined = data?.stats;

  const statCards = [
    {
      name: 'Gesamtfälle',
      value: stats?.totalCases || 0,
      icon: FolderOpen,
      color: 'blue',
    },
    {
      name: 'Aktive Recherchen',
      value: stats?.activeCases || 0,
      icon: Clock,
      color: 'yellow',
    },
    {
      name: 'Erfolgreich gelöst',
      value: stats?.solvedCases || 0,
      icon: CheckCircle,
      color: 'green',
    },
    {
      name: 'Gefundene Personen',
      value: stats?.totalPersons || 0,
      icon: Users,
      color: 'purple',
    },
    {
      name: 'Recherche-Artefakte',
      value: stats?.totalArtifacts || 0,
      icon: FileSearch,
      color: 'indigo',
    },
    {
      name: 'Erfolgsquote',
      value: formatPercentage(stats?.successRate || 0),
      icon: CheckCircle,
      color: 'green',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lädt Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Übersicht über alle Erbenermittlungsfälle und Recherchen
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Schnellzugriff</h3>
          <div className="space-y-3">
            <a
              href="/cases/new"
              className="block p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <p className="font-medium text-primary-700">Neuen Fall anlegen</p>
              <p className="text-sm text-gray-600">
                Erstellen Sie einen neuen Erbenermittlungsfall
              </p>
            </a>
            <a
              href="/cases"
              className="block p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <p className="font-medium text-primary-700">Alle Fälle anzeigen</p>
              <p className="text-sm text-gray-600">
                Durchsuchen und filtern Sie bestehende Fälle
              </p>
            </a>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System-Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-900">API Server</span>
              <span className="flex items-center text-sm text-green-700">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Online
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-900">Datenbank</span>
              <span className="flex items-center text-sm text-green-700">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Verbunden
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-yellow-900">
                Recherche-Worker
              </span>
              <span className="flex items-center text-sm text-yellow-700">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                Bereit
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

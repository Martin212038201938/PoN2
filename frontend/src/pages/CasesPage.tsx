import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Case, CaseStatus } from '../types';
import { formatDate, formatPercentage } from '../utils/format';
import { Plus, Search, Filter } from 'lucide-react';
import { cn } from '../utils/cn';

const statusColors: Record<CaseStatus, string> = {
  NEW: 'bg-gray-100 text-gray-800',
  IN_RESEARCH: 'bg-blue-100 text-blue-800',
  WAITING_FOR_RESPONSE: 'bg-yellow-100 text-yellow-800',
  HEIRS_IDENTIFIED: 'bg-purple-100 text-purple-800',
  SUCCESSFULLY_SOLVED: 'bg-green-100 text-green-800',
  CLOSED_WITHOUT_SUCCESS: 'bg-red-100 text-red-800',
  ON_HOLD: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<CaseStatus, string> = {
  NEW: 'Neu',
  IN_RESEARCH: 'In Recherche',
  WAITING_FOR_RESPONSE: 'Wartet auf Antwort',
  HEIRS_IDENTIFIED: 'Erben identifiziert',
  SUCCESSFULLY_SOLVED: 'Erfolgreich gelöst',
  CLOSED_WITHOUT_SUCCESS: 'Ohne Erfolg geschlossen',
  ON_HOLD: 'Pausiert',
};

export default function CasesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['cases', page, search, statusFilter],
    queryFn: () =>
      api.getCases({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
  });

  const cases: Case[] = data?.cases || [];
  const pagination = data?.pagination;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fälle</h1>
          <p className="mt-2 text-gray-600">
            Verwalten Sie alle Erbenermittlungsfälle
          </p>
        </div>
        <Link to="/cases/new" className="btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Neuer Fall
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Suchen nach Aktenzeichen, Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 input"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 input"
            >
              <option value="">Alle Status</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cases list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Lädt Fälle...</p>
          </div>
        </div>
      ) : cases.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">Keine Fälle gefunden.</p>
          <Link to="/cases/new" className="mt-4 inline-block btn-primary">
            Ersten Fall anlegen
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktenzeichen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Erblasser
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gericht
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fortschritt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Erstellt
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cases.map((caseItem) => (
                  <tr
                    key={caseItem.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => (window.location.href = `/cases/${caseItem.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-primary-700">
                        {caseItem.caseNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {caseItem.deceasedFirstName} {caseItem.deceasedLastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {caseItem.deceasedBirthDate &&
                          `*${formatDate(caseItem.deceasedBirthDate)}`}{' '}
                        {caseItem.deceasedDeathDate &&
                          `†${formatDate(caseItem.deceasedDeathDate)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'badge',
                          statusColors[caseItem.status]
                        )}
                      >
                        {statusLabels[caseItem.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {caseItem.court || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {caseItem._count?.persons || 0} Personen
                      </div>
                      <div className="text-sm text-gray-500">
                        {caseItem._count?.artifacts || 0} Artefakte
                      </div>
                      {caseItem.successProbability !== null && (
                        <div className="text-sm text-green-600 font-medium">
                          {formatPercentage(caseItem.successProbability)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(caseItem.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Seite {pagination.page} von {pagination.pages} ({pagination.total}{' '}
                Fälle gesamt)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Zurück
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.pages}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Weiter
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

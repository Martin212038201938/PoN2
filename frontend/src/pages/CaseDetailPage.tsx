import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Case, CaseStatus, PersonCase, ResearchArtifact } from '../types';
import {
  formatDate,
  formatCurrency,
  formatPercentage,
  formatDateTime,
} from '../utils/format';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  Users,
  FileSearch,
  
  TrendingUp,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useState } from 'react';

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

const roleLabels: Record<string, string> = {
  DECEASED: 'Erblasser',
  POTENTIAL_HEIR: 'Potentieller Erbe',
  RELATIVE: 'Verwandter',
  CONTACT_PERSON: 'Kontaktperson',
  OTHER: 'Sonstige',
};

const artifactTypeLabels: Record<string, string> = {
  GENEALOGY_SEARCH: 'Genealogie-Suche',
  SOCIAL_MEDIA_PROFILE: 'Social Media Profil',
  PUBLIC_RECORD: 'Öffentliche Aufzeichnung',
  COURT_DOCUMENT: 'Gerichtsdokument',
  PERPLEXITY_RESEARCH: 'Perplexity Recherche',
  WEB_SEARCH: 'Websuche',
  MANUAL_NOTE: 'Manuelle Notiz',
  OTHER: 'Sonstiges',
};

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'persons' | 'artifacts'>(
    'overview'
  );

  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case', id],
    queryFn: () => api.getCase(id!),
    enabled: !!id,
  });

  const { data: personsData } = useQuery({
    queryKey: ['case-persons', id],
    queryFn: () => api.getCasePersons(id!),
    enabled: !!id && activeTab === 'persons',
  });

  const { data: artifactsData } = useQuery({
    queryKey: ['case-artifacts', id],
    queryFn: () => api.getCaseArtifacts(id!),
    enabled: !!id && activeTab === 'artifacts',
  });

  const startResearchMutation = useMutation({
    mutationFn: () => api.startResearch(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
    },
  });

  const closeCaseMutation = useMutation({
    mutationFn: (successful: boolean) => api.closeCase(id!, successful),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lädt Fall...</p>
        </div>
      </div>
    );
  }

  const caseItem: Case = caseData?.case;

  if (!caseItem) {
    return <div>Fall nicht gefunden</div>;
  }

  const persons: PersonCase[] = personsData?.persons || [];
  const artifacts: ResearchArtifact[] = artifactsData?.artifacts || [];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/cases')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Zurück zur Übersicht
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {caseItem.caseNumber}
              </h1>
              <span className={cn('badge', statusColors[caseItem.status])}>
                {statusLabels[caseItem.status]}
              </span>
            </div>
            <p className="mt-2 text-xl text-gray-600">
              {caseItem.deceasedFirstName} {caseItem.deceasedLastName}
            </p>
          </div>

          <div className="flex space-x-3">
            {caseItem.status === 'NEW' && (
              <button
                onClick={() => startResearchMutation.mutate()}
                disabled={startResearchMutation.isPending}
                className="btn-primary flex items-center"
              >
                <Play className="w-5 h-5 mr-2" />
                Recherche starten
              </button>
            )}
            {caseItem.status === 'HEIRS_IDENTIFIED' && (
              <>
                <button
                  onClick={() => closeCaseMutation.mutate(true)}
                  disabled={closeCaseMutation.isPending}
                  className="btn-primary flex items-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Als gelöst markieren
                </button>
                <button
                  onClick={() => closeCaseMutation.mutate(false)}
                  disabled={closeCaseMutation.isPending}
                  className="btn-secondary flex items-center"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Ohne Erfolg schließen
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Personen</p>
              <p className="text-2xl font-bold text-gray-900">
                {caseItem._count?.persons || 0}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Artefakte</p>
              <p className="text-2xl font-bold text-gray-900">
                {caseItem._count?.artifacts || 0}
              </p>
            </div>
            <FileSearch className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recherchewellen</p>
              <p className="text-2xl font-bold text-gray-900">
                {caseItem.researchWaveCount}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Erfolgswahrscheinlichkeit</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(caseItem.successProbability || 0)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Übersicht' },
            { id: 'persons', label: 'Personen' },
            { id: 'artifacts', label: 'Recherche-Artefakte' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Erblasser-Daten
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {caseItem.deceasedFirstName} {caseItem.deceasedLastName}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Geburtsdatum</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(caseItem.deceasedBirthDate)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Geburtsort</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {caseItem.birthPlace || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Sterbedatum</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(caseItem.deceasedDeathDate)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Sterbeort</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {caseItem.deathPlace || '-'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fall-Daten</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Gericht</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {caseItem.court || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Erbmasse</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatCurrency(caseItem.estateValue as any)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Quelle</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {caseItem.sourceType || '-'}
                  {caseItem.sourceReference && ` (${caseItem.sourceReference})`}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Budget</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatCurrency(caseItem.currentSpentEur as any)} /{' '}
                  {formatCurrency(caseItem.budgetEur as any)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Erstellt am</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(caseItem.createdAt)}
                </dd>
              </div>
            </dl>
          </div>

          {caseItem.notes && (
            <div className="card lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notizen</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {caseItem.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'persons' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Gefundene Personen
          </h3>
          {persons.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              Noch keine Personen gefunden
            </p>
          ) : (
            <div className="space-y-4">
              {persons.map((personCase) => (
                <div
                  key={personCase.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {personCase.person.firstName} {personCase.person.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Rolle: {roleLabels[personCase.role] || personCase.role}
                      </p>
                    </div>
                    {personCase.heirProbability !== null && (
                      <span className="badge bg-green-100 text-green-800">
                        {formatPercentage(personCase.heirProbability)} Wahrscheinlichkeit
                      </span>
                    )}
                  </div>
                  {personCase.reasoning && (
                    <p className="text-sm text-gray-700 mt-2">
                      {personCase.reasoning}
                    </p>
                  )}
                  {personCase.person.contactInfos &&
                    personCase.person.contactInfos.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {personCase.person.contactInfos.map((contact) => (
                          <p key={contact.id} className="text-sm text-gray-600">
                            <span className="font-medium">{contact.type}:</span>{' '}
                            {contact.value}
                          </p>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'artifacts' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recherche-Artefakte
          </h3>
          {artifacts.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              Noch keine Recherche-Artefakte vorhanden
            </p>
          ) : (
            <div className="space-y-4">
              {artifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{artifact.source}</h4>
                      <p className="text-sm text-gray-600">
                        Typ: {artifactTypeLabels[artifact.type] || artifact.type} • {formatDateTime(artifact.createdAt)}
                      </p>
                    </div>
                    {artifact.relevanceScore !== null && (
                      <span className="badge bg-blue-100 text-blue-800">
                        {formatPercentage(artifact.relevanceScore)} Relevanz
                      </span>
                    )}
                  </div>
                  <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700 max-h-40 overflow-y-auto">
                    {artifact.rawText}
                  </div>
                  {artifact.sourceUrl && (
                    <a
                      href={artifact.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                    >
                      Quelle öffnen →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { ArrowLeft } from 'lucide-react';

export default function CreateCasePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    caseNumber: '',
    deceasedFirstName: '',
    deceasedLastName: '',
    deceasedBirthDate: '',
    deceasedDeathDate: '',
    birthPlace: '',
    deathPlace: '',
    court: '',
    estateValue: '',
    sourceType: 'Bundesanzeiger',
    sourceReference: '',
    originalText: '',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createCase(data),
    onSuccess: (response) => {
      navigate(`/cases/${response.case.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      estateValue: formData.estateValue ? parseFloat(formData.estateValue) : undefined,
    };

    createMutation.mutate(payload);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/cases')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Zurück zur Übersicht
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Neuen Fall anlegen</h1>
        <p className="mt-2 text-gray-600">
          Erfassen Sie die Basisdaten des Erblassers
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Fall-Informationen
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aktenzeichen *
              </label>
              <input
                type="text"
                name="caseNumber"
                value={formData.caseNumber}
                onChange={handleChange}
                className="input"
                required
                placeholder="ER-2024-00123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gericht
              </label>
              <input
                type="text"
                name="court"
                value={formData.court}
                onChange={handleChange}
                className="input"
                placeholder="AG Hamburg"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Erblasser-Daten
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vorname *
              </label>
              <input
                type="text"
                name="deceasedFirstName"
                value={formData.deceasedFirstName}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nachname *
              </label>
              <input
                type="text"
                name="deceasedLastName"
                value={formData.deceasedLastName}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Geburtsdatum
              </label>
              <input
                type="date"
                name="deceasedBirthDate"
                value={formData.deceasedBirthDate}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sterbedatum
              </label>
              <input
                type="date"
                name="deceasedDeathDate"
                value={formData.deceasedDeathDate}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Geburtsort
              </label>
              <input
                type="text"
                name="birthPlace"
                value={formData.birthPlace}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sterbeort
              </label>
              <input
                type="text"
                name="deathPlace"
                value={formData.deathPlace}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quelle</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quellentyp
              </label>
              <select
                name="sourceType"
                value={formData.sourceType}
                onChange={handleChange}
                className="input"
              >
                <option value="Bundesanzeiger">Bundesanzeiger</option>
                <option value="Gericht">Gericht</option>
                <option value="Sonstiges">Sonstiges</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quellenreferenz
              </label>
              <input
                type="text"
                name="sourceReference"
                value={formData.sourceReference}
                onChange={handleChange}
                className="input"
                placeholder="BAnz AT 12.12.2023 B1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Erbmasse (EUR)
              </label>
              <input
                type="number"
                name="estateValue"
                value={formData.estateValue}
                onChange={handleChange}
                className="input"
                placeholder="250000"
                step="0.01"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original-Ausschreibungstext
            </label>
            <textarea
              name="originalText"
              value={formData.originalText}
              onChange={handleChange}
              className="input"
              rows={4}
              placeholder="Das Amtsgericht Hamburg sucht die Erben des..."
            />
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notizen</h3>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="input"
            rows={3}
            placeholder="Zusätzliche Hinweise oder Informationen..."
          />
        </div>

        {createMutation.error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            Fehler beim Erstellen des Falls. Bitte versuchen Sie es erneut.
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/cases')}
            className="btn-secondary"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? 'Wird erstellt...' : 'Fall anlegen'}
          </button>
        </div>
      </form>
    </div>
  );
}

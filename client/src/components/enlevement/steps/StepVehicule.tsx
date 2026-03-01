import { useState } from 'react'
import VehiculeOCRScanner from '../VehiculeOCRScanner'

interface Props {
  data: { matricule: string; marque: string; modele: string; couleur: string }
  onChange: (data: { matricule: string; marque: string; modele: string; couleur: string }) => void
}

const COULEURS = ['Blanc', 'Noir', 'Gris', 'Bleu', 'Rouge', 'Vert', 'Jaune', 'Marron', 'Beige', 'Orange', 'Autre']

export default function StepVehicule({ data, onChange }: Props) {
  const [showOCR, setShowOCR] = useState(false)

  const handleOCRResult = (matricule: string) => {
    onChange({ ...data, matricule })
    setShowOCR(false)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Vehicule</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Matricule</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={data.matricule}
            onChange={(e) => onChange({ ...data, matricule: e.target.value.toUpperCase() })}
            className="input-field flex-1"
            placeholder="AA-123-BB"
          />
          <button onClick={() => setShowOCR(true)} className="btn-secondary text-sm whitespace-nowrap">
            Scanner
          </button>
        </div>
      </div>

      {showOCR && (
        <VehiculeOCRScanner
          onResult={handleOCRResult}
          onClose={() => setShowOCR(false)}
        />
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
        <input
          type="text"
          value={data.marque}
          onChange={(e) => onChange({ ...data, marque: e.target.value })}
          className="input-field"
          placeholder="Renault, Peugeot..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Modele</label>
        <input
          type="text"
          value={data.modele}
          onChange={(e) => onChange({ ...data, modele: e.target.value })}
          className="input-field"
          placeholder="Clio, 208..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
        <select
          value={data.couleur}
          onChange={(e) => onChange({ ...data, couleur: e.target.value })}
          className="input-field"
        >
          <option value="">Selectionner...</option>
          {COULEURS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

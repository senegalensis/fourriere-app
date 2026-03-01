import { useState } from 'react'

interface EnlevementDetails {
  date_enlevement: string
  heure_enlevement: string
  lieu_enlevement: string
  cadre_saisie: string
  etat_vehicule: string
  commentaires: string
  agent_collecte: string
  responsable: string
  gps_latitude: number | null
  gps_longitude: number | null
  gps_accuracy: number | null
  gps_adresse: string
}

interface Props {
  data: EnlevementDetails
  onChange: (data: EnlevementDetails) => void
}

const CADRES = [
  'Opération de désencombrement',
  'Routine',
]

const ETATS = ['Bon', 'Moyen', 'Épave']

export default function StepEnlevement({ data, onChange }: Props) {
  const [gpsLoading, setGpsLoading] = useState(false)

  const getLocation = () => {
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        let adresse = ''
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`
          )
          const json = await res.json()
          adresse = json.display_name || ''
        } catch {}
        onChange({
          ...data,
          gps_latitude: latitude,
          gps_longitude: longitude,
          gps_accuracy: accuracy,
          gps_adresse: adresse,
          lieu_enlevement: adresse || data.lieu_enlevement
        })
        setGpsLoading(false)
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Details de l'enlevement</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={data.date_enlevement}
            onChange={(e) => onChange({ ...data, date_enlevement: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Heure</label>
          <input
            type="time"
            value={data.heure_enlevement}
            onChange={(e) => onChange({ ...data, heure_enlevement: e.target.value })}
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={data.lieu_enlevement}
            onChange={(e) => onChange({ ...data, lieu_enlevement: e.target.value })}
            className="input-field flex-1"
            placeholder="Adresse de l'enlevement"
          />
          <button onClick={getLocation} disabled={gpsLoading} className="btn-secondary text-sm whitespace-nowrap">
            {gpsLoading ? '...' : 'GPS'}
          </button>
        </div>
        {data.gps_latitude && (
          <p className="text-xs text-gray-400 mt-1">
            {data.gps_latitude.toFixed(6)}, {data.gps_longitude?.toFixed(6)} (±{data.gps_accuracy?.toFixed(0)}m)
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cadre de saisie</label>
        <select
          value={data.cadre_saisie}
          onChange={(e) => onChange({ ...data, cadre_saisie: e.target.value })}
          className="input-field"
        >
          <option value="">Selectionner...</option>
          {CADRES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Etat du vehicule</label>
        <select
          value={data.etat_vehicule}
          onChange={(e) => onChange({ ...data, etat_vehicule: e.target.value })}
          className="input-field"
        >
          <option value="">Selectionner...</option>
          {ETATS.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Agent collecte</label>
          <input
            type="text"
            value={data.agent_collecte}
            onChange={(e) => onChange({ ...data, agent_collecte: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
          <input
            type="text"
            value={data.responsable}
            onChange={(e) => onChange({ ...data, responsable: e.target.value })}
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Commentaires</label>
        <textarea
          value={data.commentaires}
          onChange={(e) => onChange({ ...data, commentaires: e.target.value })}
          className="input-field"
          rows={3}
          placeholder="Observations..."
        />
      </div>
    </div>
  )
}

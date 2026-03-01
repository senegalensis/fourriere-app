interface Props {
  data: { identifiant: string; type: string; telephone: string }
  onChange: (data: { identifiant: string; type: string; telephone: string }) => void
}

const TYPES = ['Administration Territoriale', 'Collectivité Territoriale', 'DGCV-DLE']

export default function StepAutorite({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Autorite demandeur</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type d'autorite</label>
        <select
          value={data.type}
          onChange={(e) => onChange({ ...data, type: e.target.value })}
          className="input-field"
        >
          <option value="">Selectionner...</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titre / Nom du demandeur</label>
        <input
          type="text"
          value={data.identifiant}
          onChange={(e) => onChange({ ...data, identifiant: e.target.value })}
          className="input-field"
          placeholder="Titre ou Nom du demandeur"
        />
      </div>
    </div>
  )
}

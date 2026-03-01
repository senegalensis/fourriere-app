interface Chauffeur {
  id?: string
  prenom: string
  nom: string
  matricule_plateau: string
  telephone: string
}

interface Props {
  data: Chauffeur
  onChange: (data: Chauffeur) => void
}

export default function StepChauffeur({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Chauffeur</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
          <input
            type="text"
            value={data.prenom}
            onChange={(e) => onChange({ ...data, prenom: e.target.value })}
            className="input-field"
            placeholder="Prénom"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input
            type="text"
            value={data.nom}
            onChange={(e) => onChange({ ...data, nom: e.target.value })}
            className="input-field"
            placeholder="Nom"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
        <input
          type="tel"
          value={data.telephone}
          onChange={(e) => onChange({ ...data, telephone: e.target.value })}
          className="input-field"
          placeholder="Numéro de téléphone"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Matricule plateau</label>
        <input
          type="text"
          value={data.matricule_plateau}
          onChange={(e) => onChange({ ...data, matricule_plateau: e.target.value })}
          className="input-field"
          placeholder="PLT-XXX"
        />
      </div>
    </div>
  )
}

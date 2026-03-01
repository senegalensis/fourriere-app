import { EnlevementData } from '../EnlevementForm'

interface Props {
  data: EnlevementData
}

export default function StepRecap({ data }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Recapitulatif</h3>

      <Section title="Autorite">
        <Field label="Type" value={data.autorite.type} />
        <Field label="Identifiant" value={data.autorite.identifiant} />
      </Section>

      <Section title="Chauffeur">
        <Field label="Nom" value={`${data.chauffeur.prenom} ${data.chauffeur.nom}`} />
        <Field label="Plateau" value={data.chauffeur.matricule_plateau} />
      </Section>

      <Section title="Vehicule">
        <Field label="Matricule" value={data.vehicule.matricule} />
        <Field label="Marque / Modele" value={`${data.vehicule.marque} ${data.vehicule.modele}`} />
        <Field label="Couleur" value={data.vehicule.couleur} />
      </Section>

      <Section title="Enlevement">
        <Field label="Date / Heure" value={`${data.enlevement.date_enlevement} ${data.enlevement.heure_enlevement}`} />
        <Field label="Lieu" value={data.enlevement.lieu_enlevement} />
        <Field label="Cadre" value={data.enlevement.cadre_saisie} />
        <Field label="Etat" value={data.enlevement.etat_vehicule} />
        {data.enlevement.commentaires && <Field label="Commentaires" value={data.enlevement.commentaires} />}
      </Section>

      <Section title="Photos">
        <p className="text-sm text-gray-600">{data.photos.length} photo(s)</p>
        {data.photos.length > 0 && (
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {data.photos.map((p, i) => (
              <img key={i} src={p.data} alt={p.type} className="w-16 h-16 object-cover rounded" />
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b pb-3">
      <h4 className="text-sm font-semibold text-gray-800 mb-2">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value || '-'}</span>
    </div>
  )
}

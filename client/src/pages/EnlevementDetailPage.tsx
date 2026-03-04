import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/api/client'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'

const downloadPdf = async (url: string, filename: string) => {
  const token = localStorage.getItem('token')
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) return
  const blob = await response.blob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

const API_BASE = import.meta.env.VITE_API_URL || '/api'

interface Enlevement {
  id: string
  vehicule_matricule: string
  vehicule_marque: string
  vehicule_modele: string
  vehicule_couleur: string
  agent: string
  statut: string
  timestamp: string
  cadre_saisie: string
  etat_vehicule: string
  commentaires: string
  gps_latitude: number
  gps_longitude: number
  gps_adresse: string
  lieu_enlevement: string
  date_enlevement: string
  heure_enlevement: string
  agent_collecte: string
  responsable: string
  emplacement: string
}

interface Photo {
  id: string
  type_photo: string
  data: string
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-slate-900 mt-0.5 font-medium">{value || '—'}</p>
    </div>
  )
}

const STATUT_VARIANT: Record<string, 'info' | 'success' | 'neutral'> = {
  en_route: 'info',
  au_parc: 'success',
  sorti: 'neutral',
}

const STATUT_LABELS: Record<string, string> = {
  en_route: 'En route',
  au_parc: 'Au parc',
  sorti: 'Sorti',
}

export default function EnlevementDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [enlevement, setEnlevement] = useState<Enlevement | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.get(`/enlevements/${id}`),
      api.get(`/photos/${id}`)
    ])
      .then(([enl, pho]) => {
        setEnlevement(enl.data)
        setPhotos(pho.data)
      })
      .catch(() => navigate('/enlevements'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>
  if (!enlevement) return null

  return (
    <div className="max-w-2xl space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Retour
      </button>

      {/* Main card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="font-mono text-2xl font-bold text-slate-900">{enlevement.vehicule_matricule}</span>
            <p className="text-sm text-slate-500 mt-0.5">{enlevement.vehicule_marque} {enlevement.vehicule_modele}</p>
          </div>
          <Badge variant={STATUT_VARIANT[enlevement.statut] ?? 'neutral'}>
            {STATUT_LABELS[enlevement.statut] || enlevement.statut}
          </Badge>
        </div>

        {/* PDF buttons */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex gap-2">
          <button
            onClick={() => downloadPdf(
              `${API_BASE}/pdf/rapport-enlevement/${enlevement.id}`,
              `rapport-enlevement-${enlevement.vehicule_matricule}.pdf`
            )}
            className="btn-primary text-sm py-1.5"
          >
            Rapport d'enlèvement
          </button>
          {enlevement.statut === 'sorti' && (
            <button
              onClick={() => downloadPdf(
                `${API_BASE}/pdf/bon-sortie/${enlevement.id}`,
                `bon-sortie-${enlevement.vehicule_matricule}.pdf`
              )}
              className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
            >
              Bon de sortie
            </button>
          )}
        </div>

        {/* Fields grid */}
        <div className="px-6 py-5 grid grid-cols-2 gap-x-8 gap-y-4">
          <Field label="Marque" value={enlevement.vehicule_marque} />
          <Field label="Modèle" value={enlevement.vehicule_modele} />
          <Field label="Couleur" value={enlevement.vehicule_couleur} />
          <Field label="Agent" value={enlevement.agent} />
          <Field label="Cadre" value={enlevement.cadre_saisie} />
          <Field label="État" value={enlevement.etat_vehicule} />
          <Field label="Date" value={enlevement.date_enlevement || new Date(enlevement.timestamp).toLocaleDateString('fr-FR')} />
          <Field label="Heure" value={enlevement.heure_enlevement || new Date(enlevement.timestamp).toLocaleTimeString('fr-FR')} />
          <Field label="Lieu" value={enlevement.lieu_enlevement || enlevement.gps_adresse} />
          <Field label="Emplacement" value={enlevement.emplacement} />
          <Field label="Agent collecte" value={enlevement.agent_collecte} />
          <Field label="Responsable" value={enlevement.responsable} />
        </div>

        {enlevement.commentaires && (
          <div className="px-6 py-4 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Commentaires</p>
            <p className="text-sm text-slate-700">{enlevement.commentaires}</p>
          </div>
        )}

        {enlevement.gps_latitude && (
          <div className="px-6 py-4 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Position GPS</p>
            <p className="text-sm text-slate-700 font-mono">{enlevement.gps_latitude}, {enlevement.gps_longitude}</p>
          </div>
        )}
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Photos ({photos.length})</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            {photos.map((p) => (
              <div key={p.id} className="relative rounded-xl overflow-hidden aspect-video bg-slate-100">
                <img src={p.data} alt={p.type_photo} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded-md capitalize">
                  {p.type_photo}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

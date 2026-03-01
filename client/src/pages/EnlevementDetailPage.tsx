import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/api/client'
import Spinner from '@/components/ui/Spinner'

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
    <div className="max-w-2xl mx-auto space-y-4">
      <button onClick={() => navigate(-1)} className="text-sm text-primary-600 hover:underline">
        &larr; Retour
      </button>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{enlevement.vehicule_matricule}</h2>
          <span className={`text-xs px-2 py-1 rounded-full ${
            enlevement.statut === 'au_parc' ? 'bg-green-100 text-green-700' :
            enlevement.statut === 'en_route' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-500'
          }`}>
            {enlevement.statut.replace('_', ' ')}
          </span>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => downloadPdf(
              `${API_BASE}/pdf/rapport-enlevement/${enlevement.id}`,
              `rapport-enlevement-${enlevement.vehicule_matricule}.pdf`
            )}
            className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700"
          >
            Rapport d'enlèvement
          </button>
          {enlevement.statut === 'sorti' && (
            <button
              onClick={() => downloadPdf(
                `${API_BASE}/pdf/bon-sortie/${enlevement.id}`,
                `bon-sortie-${enlevement.vehicule_matricule}.pdf`
              )}
              className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600"
            >
              Bon de sortie
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Marque" value={enlevement.vehicule_marque} />
          <Field label="Modele" value={enlevement.vehicule_modele} />
          <Field label="Couleur" value={enlevement.vehicule_couleur} />
          <Field label="Agent" value={enlevement.agent} />
          <Field label="Cadre" value={enlevement.cadre_saisie} />
          <Field label="Etat" value={enlevement.etat_vehicule} />
          <Field label="Date" value={enlevement.date_enlevement || new Date(enlevement.timestamp).toLocaleDateString('fr-FR')} />
          <Field label="Heure" value={enlevement.heure_enlevement || new Date(enlevement.timestamp).toLocaleTimeString('fr-FR')} />
          <Field label="Lieu" value={enlevement.lieu_enlevement || enlevement.gps_adresse} />
          <Field label="Emplacement" value={enlevement.emplacement} />
          <Field label="Agent collecte" value={enlevement.agent_collecte} />
          <Field label="Responsable" value={enlevement.responsable} />
        </div>

        {enlevement.commentaires && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500">Commentaires</p>
            <p className="text-sm">{enlevement.commentaires}</p>
          </div>
        )}

        {enlevement.gps_latitude && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500">Position GPS</p>
            <p className="text-sm">{enlevement.gps_latitude}, {enlevement.gps_longitude}</p>
          </div>
        )}
      </div>

      {photos.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-3">Photos ({photos.length})</h3>
          <div className="grid grid-cols-2 gap-2">
            {photos.map((p) => (
              <div key={p.id} className="relative">
                <img src={p.data} alt={p.type_photo} className="w-full aspect-video object-cover rounded-lg" />
                <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded capitalize">
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium">{value || '-'}</p>
    </div>
  )
}

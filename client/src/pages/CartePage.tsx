import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import api from '@/api/client'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'

interface Enlevement {
  id: string
  vehicule_matricule: string
  vehicule_marque: string
  vehicule_modele?: string
  statut: string
  timestamp: string
  lieu_enlevement?: string
  gps_lat?: number
  gps_lng?: number
  gps_adresse?: string
}

type StatutVariant = 'info' | 'success' | 'neutral'

const STATUT_LABELS: Record<string, string> = {
  en_route: 'En route',
  au_parc: 'Au parc',
  sorti: 'Sorti',
}

const STATUT_VARIANT: Record<string, StatutVariant> = {
  en_route: 'info',
  au_parc: 'success',
  sorti: 'neutral',
}

const STATUT_COLORS: Record<string, string> = {
  en_route: '#3660a8',
  au_parc: '#16a34a',
  sorti: '#94a3b8',
}

function makeIcon(statut: string) {
  const color = STATUT_COLORS[statut] ?? '#94a3b8'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
    <circle cx="10" cy="10" r="7" fill="${color}" stroke="white" stroke-width="2.5"/>
  </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  })
}

const DAKAR: [number, number] = [14.7167, -17.4677]

export default function CartePage() {
  const [enlevements, setEnlevements] = useState<Enlevement[]>([])
  const [loading, setLoading] = useState(true)
  const [showSortis, setShowSortis] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.get('/enlevements', { params: { limit: 1000 } })
        const data: Enlevement[] = res.data.data ?? res.data
        setEnlevements(data.filter(e => e.gps_lat != null && e.gps_lng != null))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const localized = enlevements
  const enRoute = localized.filter(e => e.statut === 'en_route').length
  const auParc = localized.filter(e => e.statut === 'au_parc').length
  const sortis = localized.filter(e => e.statut === 'sorti').length

  const visible = showSortis ? localized : localized.filter(e => e.statut !== 'sorti')

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-4 space-y-3">
        <PageHeader
          title="Carte des enlèvements"
          subtitle={`${localized.length} véhicule${localized.length !== 1 ? 's' : ''} localisé${localized.length !== 1 ? 's' : ''}`}
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            {enRoute} en route
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
            <span className="w-2 h-2 rounded-full bg-green-600" />
            {auParc} au parc
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            {sortis} sortis
          </span>

          <button
            onClick={() => setShowSortis(v => !v)}
            className={`ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showSortis
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showSortis ? 'bg-slate-500' : 'bg-slate-300'}`} />
            {showSortis ? 'Masquer les sorties' : 'Afficher les sorties'}
          </button>
        </div>
      </div>

      <div className="flex-1 px-6 pb-6 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner />
          </div>
        ) : (
          <div className="h-[calc(100vh-280px)] min-h-96 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <MapContainer
              center={DAKAR}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {visible.map(e => (
                <Marker
                  key={e.id}
                  position={[e.gps_lat!, e.gps_lng!]}
                  icon={makeIcon(e.statut)}
                >
                  <Popup>
                    <div className="text-sm space-y-1 min-w-[180px]">
                      <p className="font-semibold text-slate-800">{e.vehicule_matricule}</p>
                      <p className="text-slate-600">
                        {e.vehicule_marque}{e.vehicule_modele ? ` ${e.vehicule_modele}` : ''}
                      </p>
                      <div>
                        <Badge variant={STATUT_VARIANT[e.statut] ?? 'neutral'}>
                          {STATUT_LABELS[e.statut] ?? e.statut}
                        </Badge>
                      </div>
                      <p className="text-slate-500 text-xs">
                        {new Date(e.timestamp).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                      {e.gps_adresse && (
                        <p className="text-slate-500 text-xs">{e.gps_adresse}</p>
                      )}
                      <Link
                        to={`/enlevements/${e.id}`}
                        className="inline-block mt-1 text-primary-600 hover:text-primary-700 text-xs font-medium"
                      >
                        Voir détails →
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  )
}

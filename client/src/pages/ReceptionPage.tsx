import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/api/client'
import { useAuth } from '@/hooks/useAuth'
import Spinner from '@/components/ui/Spinner'

interface EnlevementData {
  id: string
  timestamp: string
  // Véhicule
  vehicule_matricule: string
  vehicule_marque: string | null
  vehicule_modele: string | null
  vehicule_couleur: string | null
  // Détails
  cadre_saisie: string | null
  etat_vehicule: string | null
  commentaires: string | null
  // GPS
  gps_latitude: number | null
  gps_longitude: number | null
  gps_adresse: string | null
  // Autorité
  autorite_identifiant: string | null
  autorite_type: string | null
  // Agents
  agent: string
  agent_collecte: string | null
  responsable: string | null
  // Enlèvement
  date_enlevement: string | null
  heure_enlevement: string | null
  lieu_enlevement: string | null
  // Chauffeur
  chauffeur_prenom: string | null
  chauffeur_nom: string | null
  matricule_plateau: string | null
}

interface EnlevementPhoto {
  id: string
  type_photo: string
  data: string
}

interface PhotoSlot {
  data: string | null
  preview: string | null
}

const ZONES = ['Sendra', 'Ministere', 'Ville de Dakar'] as const

const ETAT_COLORS: Record<string, string> = {
  Bon: 'bg-green-100 text-green-800',
  Dégradé: 'bg-yellow-100 text-yellow-800',
  Accidenté: 'bg-orange-100 text-orange-800',
  Épave: 'bg-red-100 text-red-800',
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="py-2 border-b border-blue-100 last:border-0">
      <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">{label}</span>
      <p className="text-sm text-gray-900 mt-0.5">{value}</p>
    </div>
  )
}

export default function ReceptionPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Phase 1 : recherche
  const [searchMatricule, setSearchMatricule] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Phase 2 : données d'enlèvement
  const [enlevement, setEnlevement] = useState<EnlevementData | null>(null)
  const [enlevementPhotos, setEnlevementPhotos] = useState<EnlevementPhoto[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)

  // Phase 2 : formulaire de réception
  const [agentResponsable, setAgentResponsable] = useState(user?.username || '')
  const [dateEntree, setDateEntree] = useState(new Date().toISOString().split('T')[0])
  const [heureEntree, setHeureEntree] = useState(new Date().toTimeString().slice(0, 5))
  const [zonePlacement, setZonePlacement] = useState<string>('')
  const [observations, setObservations] = useState('')
  const [photos, setPhotos] = useState<PhotoSlot[]>([
    { data: null, preview: null },
    { data: null, preview: null },
    { data: null, preview: null },
  ])

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successOrdre, setSuccessOrdre] = useState<number | null>(null)
  const [successMatricule, setSuccessMatricule] = useState<string>('')

  const fileRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const handleSearch = async () => {
    const mat = searchMatricule.trim().toUpperCase()
    if (!mat) return
    setSearching(true)
    setSearchError('')
    setEnlevement(null)
    setEnlevementPhotos([])
    try {
      const { data } = await api.get(`/enlevements/search/${encodeURIComponent(mat)}`)
      if (!data.found) {
        setSearchError(data.message || 'Aucun enlèvement en cours pour ce matricule')
      } else {
        setEnlevement(data.enlevement)
        // Charger les photos d'enlèvement en parallèle
        setLoadingPhotos(true)
        api.get(`/photos/${data.enlevement.id}`)
          .then(({ data: photosData }) => setEnlevementPhotos(photosData))
          .catch(() => {})
          .finally(() => setLoadingPhotos(false))
      }
    } catch (err: any) {
      setSearchError(err.response?.data?.error || 'Erreur lors de la recherche')
    } finally {
      setSearching(false)
    }
  }

  const handlePhotoChange = (index: number, file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setPhotos((prev) => {
        const next = [...prev]
        next[index] = { data: base64, preview: base64 }
        return next
      })
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const next = [...prev]
      next[index] = { data: null, preview: null }
      return next
    })
    if (fileRefs[index].current) fileRefs[index].current!.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agentResponsable.trim()) {
      setSubmitError("Le nom de l'agent responsable est requis")
      return
    }
    if (!zonePlacement) {
      setSubmitError('La zone de placement est requise')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      const { data: reception } = await api.post('/receptions', {
        enlevement_id: enlevement!.id,
        vehicule_matricule: enlevement!.vehicule_matricule,
        agent_responsable: agentResponsable,
        date_entree: dateEntree,
        heure_entree: heureEntree,
        zone_placement: zonePlacement,
        observations: observations || null,
      })

      const photosToSend = photos
        .map((p, i) => (p.data ? { position: i + 1, data: p.data } : null))
        .filter(Boolean)
      if (photosToSend.length > 0) {
        await api.post(`/receptions/${reception.id}/photos`, { photos: photosToSend })
      }

      setSuccessMatricule(enlevement!.vehicule_matricule)
      setSuccessOrdre(reception.ordre_entree)
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || 'Erreur lors de la réception')
    } finally {
      setSubmitting(false)
    }
  }

  const resetAll = () => {
    setEnlevement(null)
    setEnlevementPhotos([])
    setSearchMatricule('')
    setSearchError('')
    setAgentResponsable(user?.username || '')
    setDateEntree(new Date().toISOString().split('T')[0])
    setHeureEntree(new Date().toTimeString().slice(0, 5))
    setZonePlacement('')
    setObservations('')
    setPhotos([
      { data: null, preview: null },
      { data: null, preview: null },
      { data: null, preview: null },
    ])
    setSuccessOrdre(null)
    setSuccessMatricule('')
    setSubmitError('')
  }

  // ── Écran de succès ─────────────────────────────────────────────
  if (successOrdre !== null) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Véhicule réceptionné</h2>
          <p className="text-sm text-gray-500 mb-6">
            Le véhicule <span className="font-mono font-bold text-gray-800">{successMatricule}</span> a bien été
            enregistré à la fourrière.
          </p>
          <div className="bg-primary-50 rounded-xl py-6 mb-6">
            <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-2">
              Ordre d'entrée
            </p>
            <p className="text-6xl font-extrabold text-primary-700">#{successOrdre}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={resetAll}
              className="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Nouveau véhicule
            </button>
            <button
              onClick={() => navigate('/reception')}
              className="flex-1 py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700"
            >
              Voir la liste
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Phase 1 : Recherche ─────────────────────────────────────────
  if (!enlevement) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Réception véhicule</h1>
        <p className="text-sm text-gray-500 mb-8">
          Entrez le matricule du véhicule pour vérifier son enlèvement et procéder à la réception.
        </p>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Matricule du véhicule</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchMatricule}
              onChange={(e) => setSearchMatricule(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ex : DK-123-AB"
              autoFocus
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-base font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleSearch}
              disabled={searching || !searchMatricule.trim()}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
            >
              {searching ? <Spinner size="sm" /> : <span>🔍</span>}
              Rechercher
            </button>
          </div>
          {searchError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span>{searchError}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Phase 2 : Infos + formulaire de réception ───────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Réception véhicule</h1>
        <button
          type="button"
          onClick={resetAll}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Autre matricule
        </button>
      </div>

      {/* ── Bloc : Véhicule ── */}
      <section className="bg-blue-50 border border-blue-200 rounded-xl overflow-hidden">
        <div className="bg-blue-600 px-5 py-3 flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Véhicule</h2>
          <span className="font-mono text-white font-bold text-lg tracking-widest">
            {enlevement.vehicule_matricule}
          </span>
        </div>
        <div className="p-5 grid grid-cols-2 gap-x-6">
          <InfoRow label="Marque" value={enlevement.vehicule_marque} />
          <InfoRow label="Modèle" value={enlevement.vehicule_modele} />
          <InfoRow label="Couleur" value={enlevement.vehicule_couleur} />
          <div className="py-2 border-b border-blue-100">
            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">État</span>
            <p className="mt-0.5">
              {enlevement.etat_vehicule ? (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ETAT_COLORS[enlevement.etat_vehicule] || 'bg-gray-100 text-gray-700'}`}>
                  {enlevement.etat_vehicule}
                </span>
              ) : '—'}
            </p>
          </div>
        </div>
      </section>

      {/* ── Bloc : Enlèvement ── */}
      <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-700 px-5 py-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Détails de l'enlèvement</h2>
        </div>
        <div className="p-5 space-y-0 divide-y divide-gray-100">
          <InfoRow label="Motif de saisie" value={enlevement.cadre_saisie} />
          {enlevement.date_enlevement && (
            <div className="py-2">
              <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Date & heure</span>
              <p className="text-sm text-gray-900 mt-0.5">
                {new Date(enlevement.date_enlevement).toLocaleDateString('fr-FR')}
                {enlevement.heure_enlevement && ` à ${enlevement.heure_enlevement.slice(0, 5)}`}
              </p>
            </div>
          )}
          <InfoRow label="Lieu d'enlèvement" value={enlevement.lieu_enlevement} />
          <InfoRow label="Adresse GPS" value={enlevement.gps_adresse} />
          <InfoRow label="Agent terrain" value={enlevement.agent} />
          <InfoRow label="Agent collecte" value={enlevement.agent_collecte} />
          <InfoRow label="Responsable" value={enlevement.responsable} />
          <InfoRow label="Commentaires" value={enlevement.commentaires} />
        </div>
      </section>

      {/* ── Bloc : Autorité ── */}
      {(enlevement.autorite_type || enlevement.autorite_identifiant) && (
        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-700 px-5 py-3">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Autorité requérante</h2>
          </div>
          <div className="p-5 divide-y divide-gray-100">
            <InfoRow label="Type" value={enlevement.autorite_type} />
            <InfoRow label="Identifiant" value={enlevement.autorite_identifiant} />
          </div>
        </section>
      )}

      {/* ── Bloc : Chauffeur ── */}
      {(enlevement.chauffeur_prenom || enlevement.chauffeur_nom) && (
        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-700 px-5 py-3">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Chauffeur plateau</h2>
          </div>
          <div className="p-5 divide-y divide-gray-100">
            <InfoRow
              label="Nom"
              value={[enlevement.chauffeur_prenom, enlevement.chauffeur_nom].filter(Boolean).join(' ')}
            />
            <InfoRow label="Matricule plateau" value={enlevement.matricule_plateau} />
          </div>
        </section>
      )}

      {/* ── Bloc : Photos d'enlèvement ── */}
      <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-700 px-5 py-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
            Photos prises lors de l'enlèvement
          </h2>
        </div>
        <div className="p-5">
          {loadingPhotos ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : enlevementPhotos.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-3">Aucune photo disponible</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {enlevementPhotos.map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <img
                    src={photo.data}
                    alt={photo.type_photo}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5 capitalize">
                    {photo.type_photo}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Formulaire de réception ── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="bg-white border-2 border-primary-200 rounded-xl overflow-hidden">
          <div className="bg-primary-600 px-5 py-3">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Réception — à remplir</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agent responsable <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={agentResponsable}
                onChange={(e) => setAgentResponsable(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'entrée <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dateEntree}
                  onChange={(e) => setDateEntree(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure d'entrée <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={heureEntree}
                  onChange={(e) => setHeureEntree(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zone de placement <span className="text-red-500">*</span>
              </label>
              <select
                value={zonePlacement}
                onChange={(e) => setZonePlacement(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">— Sélectionner une zone —</option>
                {ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observations</label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={2}
                placeholder="Remarques éventuelles..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>
        </section>

        {/* Photos de dommages (optionnelles) */}
        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-orange-500 px-5 py-3">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
              Photos de dommages constatés — optionnel
            </h2>
          </div>
          <div className="p-5">
            <p className="text-xs text-gray-500 mb-4">
              À prendre uniquement si le véhicule présente des dommages survenus durant le transport.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div key={index}>
                  {photo.preview ? (
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <img src={photo.preview} alt={`Dommage ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-orange-300 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                      <span className="text-2xl text-orange-300">📷</span>
                      <span className="text-xs text-orange-400 mt-1">Photo {index + 1}</span>
                      <input
                        ref={fileRefs[index]}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handlePhotoChange(index, e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-primary-600 text-white rounded-xl text-base font-bold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? <Spinner size="sm" /> : null}
          Confirmer la réception
        </button>
      </form>
    </div>
  )
}

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/api/client'
import { useAuth } from '@/hooks/useAuth'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'

interface EnlevementData {
  id: string
  timestamp: string
  vehicule_matricule: string
  vehicule_marque: string | null
  vehicule_modele: string | null
  vehicule_couleur: string | null
  cadre_saisie: string | null
  etat_vehicule: string | null
  commentaires: string | null
  gps_latitude: number | null
  gps_longitude: number | null
  gps_adresse: string | null
  autorite_identifiant: string | null
  autorite_type: string | null
  agent: string
  agent_collecte: string | null
  responsable: string | null
  date_enlevement: string | null
  heure_enlevement: string | null
  lieu_enlevement: string | null
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

type EtatVariant = 'success' | 'warning' | 'danger' | 'neutral'

const ETAT_VARIANT: Record<string, EtatVariant> = {
  Bon: 'success',
  Dégradé: 'warning',
  Accidenté: 'danger',
  Épave: 'danger',
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      <p className="text-sm text-slate-900 mt-0.5 font-medium">{value}</p>
    </div>
  )
}

export default function ReceptionPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [searchMatricule, setSearchMatricule] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const [enlevement, setEnlevement] = useState<EnlevementData | null>(null)
  const [enlevementPhotos, setEnlevementPhotos] = useState<EnlevementPhoto[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)

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

  // ── Écran de succès ──────────────────────────────────────────────
  if (successOrdre !== null) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-green-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Véhicule réceptionné</h2>
          <p className="text-sm text-slate-500 mb-6">
            Le véhicule <span className="font-mono font-bold text-slate-800">{successMatricule}</span> a bien été
            enregistré à la fourrière.
          </p>
          <div className="bg-primary-50 rounded-2xl py-6 mb-6">
            <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-2">Ordre d'entrée</p>
            <p className="text-6xl font-extrabold text-primary-700">#{successOrdre}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={resetAll}
              className="btn-secondary flex-1 py-3"
            >
              Nouveau véhicule
            </button>
            <button
              onClick={() => navigate('/reception')}
              className="btn-primary flex-1 py-3"
            >
              Voir la liste
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Phase 1 : Recherche ──────────────────────────────────────────
  if (!enlevement) {
    return (
      <div className="max-w-lg py-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Réception véhicule</h1>
        <p className="text-sm text-slate-500 mb-8">
          Entrez le matricule du véhicule pour vérifier son enlèvement et procéder à la réception.
        </p>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Matricule du véhicule</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchMatricule}
              onChange={(e) => setSearchMatricule(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ex : DK-123-AB"
              autoFocus
              className="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-base font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleSearch}
              disabled={searching || !searchMatricule.trim()}
              className="btn-primary px-6 py-3 flex items-center gap-2"
            >
              {searching ? <Spinner size="sm" /> : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              )}
              Rechercher
            </button>
          </div>
          {searchError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {searchError}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Phase 2 : Infos + formulaire de réception ────────────────────
  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Réception véhicule</h1>
        <button
          type="button"
          onClick={resetAll}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          ← Autre matricule
        </button>
      </div>

      {/* Bloc Véhicule */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-primary-600 px-5 py-3 flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Véhicule</h2>
          <span className="font-mono text-white font-bold text-lg tracking-widest">{enlevement.vehicule_matricule}</span>
        </div>
        <div className="p-5 grid grid-cols-2 gap-x-6">
          <InfoRow label="Marque" value={enlevement.vehicule_marque} />
          <InfoRow label="Modèle" value={enlevement.vehicule_modele} />
          <InfoRow label="Couleur" value={enlevement.vehicule_couleur} />
          <div className="py-2.5 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">État</span>
            <p className="mt-0.5">
              {enlevement.etat_vehicule ? (
                <Badge variant={ETAT_VARIANT[enlevement.etat_vehicule] ?? 'neutral'}>
                  {enlevement.etat_vehicule}
                </Badge>
              ) : '—'}
            </p>
          </div>
        </div>
      </section>

      {/* Bloc Enlèvement */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-700 px-5 py-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Détails de l'enlèvement</h2>
        </div>
        <div className="p-5">
          <InfoRow label="Motif de saisie" value={enlevement.cadre_saisie} />
          {enlevement.date_enlevement && (
            <div className="py-2.5 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date &amp; heure</span>
              <p className="text-sm text-slate-900 mt-0.5 font-medium">
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

      {/* Bloc Autorité */}
      {(enlevement.autorite_type || enlevement.autorite_identifiant) && (
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-700 px-5 py-3">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Autorité requérante</h2>
          </div>
          <div className="p-5">
            <InfoRow label="Type" value={enlevement.autorite_type} />
            <InfoRow label="Identifiant" value={enlevement.autorite_identifiant} />
          </div>
        </section>
      )}

      {/* Bloc Chauffeur */}
      {(enlevement.chauffeur_prenom || enlevement.chauffeur_nom) && (
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-700 px-5 py-3">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Chauffeur plateau</h2>
          </div>
          <div className="p-5">
            <InfoRow
              label="Nom"
              value={[enlevement.chauffeur_prenom, enlevement.chauffeur_nom].filter(Boolean).join(' ')}
            />
            <InfoRow label="Matricule plateau" value={enlevement.matricule_plateau} />
          </div>
        </section>
      )}

      {/* Bloc Photos d'enlèvement */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-700 px-5 py-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
            Photos prises lors de l'enlèvement
          </h2>
        </div>
        <div className="p-5">
          {loadingPhotos ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : enlevementPhotos.length === 0 ? (
            <p className="text-sm text-slate-400 italic text-center py-3">Aucune photo disponible</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {enlevementPhotos.map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img src={photo.data} alt={photo.type_photo} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5 capitalize">
                    {photo.type_photo}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Formulaire de réception */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="bg-white rounded-2xl border-2 border-primary-200 overflow-hidden">
          <div className="bg-primary-600 px-5 py-3">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Réception — à remplir</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Agent responsable <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={agentResponsable}
                onChange={(e) => setAgentResponsable(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date d'entrée <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dateEntree}
                  onChange={(e) => setDateEntree(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Heure d'entrée <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={heureEntree}
                  onChange={(e) => setHeureEntree(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Zone de placement <span className="text-red-500">*</span>
              </label>
              <select
                value={zonePlacement}
                onChange={(e) => setZonePlacement(e.target.value)}
                className="input-field"
                required
              >
                <option value="">— Sélectionner une zone —</option>
                {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Observations</label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={2}
                placeholder="Remarques éventuelles…"
                className="input-field resize-none"
              />
            </div>
          </div>
        </section>

        {/* Photos de dommages */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-orange-500 px-5 py-3">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
              Photos de dommages constatés — optionnel
            </h2>
          </div>
          <div className="p-5">
            <p className="text-xs text-slate-500 mb-4">
              À prendre uniquement si le véhicule présente des dommages survenus durant le transport.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div key={index}>
                  {photo.preview ? (
                    <div className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
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
                    <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-orange-300 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-orange-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
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
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
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

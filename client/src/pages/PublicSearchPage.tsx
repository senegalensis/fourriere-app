import { useState } from 'react'
import { Link } from 'react-router-dom'

interface VehiculePublic {
  matricule: string
  marque: string | null
  modele: string | null
  couleur: string | null
  statut: string
  date_enlevement: string
  lieu_enlevement: string | null
  zone_placement: string | null
}

export default function PublicSearchPage() {
  const [matricule, setMatricule] = useState('')
  const [result, setResult] = useState<VehiculePublic | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = matricule.trim().toUpperCase()
    if (!q) return
    setLoading(true)
    setResult(null)
    setNotFound(false)
    setSearched(q)
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '/api'
      const res = await fetch(`${API_BASE}/public/search/${encodeURIComponent(q)}`)
      if (res.status === 404) {
        setNotFound(true)
      } else if (res.ok) {
        const data = await res.json()
        setResult(data)
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-900 px-4 py-10 flex flex-col items-center">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-white rounded-2xl shadow-lg px-6 py-3 inline-block mb-5">
          <img src="/logo-entete.png" alt="DGCV" className="h-16 mx-auto" />
        </div>
        <h1 className="text-xl font-bold text-white">Recherche de véhicule en fourrière</h1>
        <p className="text-primary-300 text-sm mt-1">Direction Générale du Cadre de Vie</p>
      </div>

      {/* Formulaire */}
      <div className="w-full max-w-md">
        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numéro de plaque
            </label>
            <input
              type="text"
              value={matricule}
              onChange={e => setMatricule(e.target.value.toUpperCase())}
              placeholder="Ex : DK-123-AB"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 font-mono text-lg tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || !matricule.trim()}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold text-base hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : '🔍 Rechercher'}
          </button>
        </form>

        {/* Résultat */}
        {notFound && (
          <div className="mt-4 bg-white rounded-2xl shadow p-6 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-lg font-semibold text-gray-900">Véhicule non trouvé</p>
            <p className="text-sm text-gray-500 mt-1">
              Le véhicule <span className="font-mono font-bold">{searched}</span> n'est pas recensé en fourrière actuellement.
            </p>
          </div>
        )}

        {result && (
          <div className="mt-4 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-red-500 px-5 py-3">
              <p className="text-white font-bold text-base">⚠️ Véhicule en fourrière</p>
              <p className="text-red-100 text-xs mt-0.5">Ce véhicule a été enlevé et se trouve au parc.</p>
            </div>
            <div className="p-5 space-y-3">
              <Row label="Matricule" value={result.matricule} mono />
              {result.marque && <Row label="Véhicule" value={[result.marque, result.modele, result.couleur].filter(Boolean).join(' ')} />}
              <Row label="Date d'enlèvement" value={result.date_enlevement ? new Date(result.date_enlevement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
              {result.lieu_enlevement && <Row label="Lieu d'enlèvement" value={result.lieu_enlevement} />}
              {result.zone_placement && <Row label="Zone de stockage" value={result.zone_placement} />}
              <div className="pt-3 border-t border-gray-100 text-xs text-gray-500 text-center">
                Pour récupérer votre véhicule, présentez-vous au parc de fourrière avec vos pièces d'identité et le titre de propriété.
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-primary-200 text-sm hover:text-white underline">
            ← Connexion agent
          </Link>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className={`text-sm font-medium text-gray-900 text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

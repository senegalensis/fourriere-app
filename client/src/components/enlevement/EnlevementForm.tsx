import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StepAutorite from './steps/StepAutorite'
import StepChauffeur from './steps/StepChauffeur'
import StepVehicule from './steps/StepVehicule'
import StepEnlevement from './steps/StepEnlevement'
import StepPhotos from './steps/StepPhotos'
import StepRecap from './steps/StepRecap'
import api from '@/api/client'
import { db } from '@/db/database'
import { useSyncStore } from '@/store/syncStore'
import { useToast } from '@/components/ui/Toast'

export interface EnlevementData {
  autorite: {
    identifiant: string
    type: string
    telephone: string
  }
  chauffeur: {
    id?: string
    prenom: string
    nom: string
    matricule_plateau: string
    telephone: string
  }
  vehicule: {
    matricule: string
    marque: string
    modele: string
    couleur: string
  }
  enlevement: {
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
  photos: { type: string; data: string }[]
}

const STEPS = ['Autorite', 'Chauffeur', 'Vehicule', 'Enlevement', 'Photos', 'Recap']

const initialData: EnlevementData = {
  autorite: { identifiant: '', type: '', telephone: '' },
  chauffeur: { prenom: '', nom: '', matricule_plateau: '', telephone: '' },
  vehicule: { matricule: '', marque: '', modele: '', couleur: '' },
  enlevement: {
    date_enlevement: new Date().toISOString().split('T')[0],
    heure_enlevement: new Date().toTimeString().slice(0, 5),
    lieu_enlevement: '',
    cadre_saisie: '',
    etat_vehicule: '',
    commentaires: '',
    agent_collecte: '',
    responsable: '',
    gps_latitude: null,
    gps_longitude: null,
    gps_accuracy: null,
    gps_adresse: ''
  },
  photos: []
}

export default function EnlevementForm() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<EnlevementData>(initialData)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { isOnline } = useSyncStore()
  const toast = useToast()

  const updateData = (section: keyof EnlevementData, value: any) => {
    setData((prev) => ({ ...prev, [section]: value }))
  }

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const prev = () => setStep((s) => Math.max(s - 1, 0))

  const submit = async () => {
    setSubmitting(true)
    const clientId = crypto.randomUUID()
    try {
      if (isOnline) {
        // Créer le chauffeur à la volée si les infos sont renseignées
        let chauffeurId: string | undefined = data.chauffeur.id
        if (!chauffeurId && data.chauffeur.prenom && data.chauffeur.nom) {
          const { data: ch } = await api.post('/chauffeurs', {
            prenom: data.chauffeur.prenom,
            nom: data.chauffeur.nom,
            telephone: data.chauffeur.telephone || '',
            matricule_plateau: data.chauffeur.matricule_plateau || '',
          })
          chauffeurId = ch.id
        }

        const { data: enlevement } = await api.post('/enlevements', {
          vehicule: data.vehicule,
          details: {
            cadre: data.enlevement.cadre_saisie,
            etat: data.enlevement.etat_vehicule,
            commentaires: data.enlevement.commentaires
          },
          gps: {
            latitude: data.enlevement.gps_latitude || 0,
            longitude: data.enlevement.gps_longitude || 0,
            accuracy: data.enlevement.gps_accuracy
          },
          autorite: data.autorite,
          chauffeur_id: chauffeurId || null,
          date_enlevement: data.enlevement.date_enlevement,
          heure_enlevement: data.enlevement.heure_enlevement,
          lieu_enlevement: data.enlevement.lieu_enlevement,
          agent_collecte: data.enlevement.agent_collecte,
          responsable: data.enlevement.responsable,
          client_id: clientId
        })

        if (data.photos.length > 0) {
          await api.post('/photos', {
            enlevementId: enlevement.id,
            photos: data.photos
          })
        }

        toast.add('Enlevement cree avec succes', 'success')
      } else {
        await db.enlevements.add({
          clientId,
          data: JSON.parse(JSON.stringify(data)),
          createdAt: new Date().toISOString(),
          synced: false
        })
        await db.syncQueue.add({
          clientId,
          action: 'create',
          entityType: 'enlevement',
          payload: data,
          createdAt: new Date().toISOString()
        })
        toast.add('Sauvegarde hors ligne - sera synchronise', 'info')
      }
      navigate('/enlevements')
    } catch (err: any) {
      toast.add(err.response?.data?.error || 'Erreur lors de la creation', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center mb-6 gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col items-center">
            <div className={`w-full h-1.5 rounded-full ${i <= step ? 'bg-primary-600' : 'bg-gray-200'}`} />
            <span className={`text-[10px] mt-1 ${i <= step ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="card">
        {step === 0 && <StepAutorite data={data.autorite} onChange={(v) => updateData('autorite', v)} />}
        {step === 1 && <StepChauffeur data={data.chauffeur} onChange={(v) => updateData('chauffeur', v)} />}
        {step === 2 && <StepVehicule data={data.vehicule} onChange={(v) => updateData('vehicule', v)} />}
        {step === 3 && <StepEnlevement data={data.enlevement} onChange={(v) => updateData('enlevement', v)} />}
        {step === 4 && <StepPhotos photos={data.photos} onChange={(v) => updateData('photos', v)} />}
        {step === 5 && <StepRecap data={data} />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-4">
        <button onClick={prev} disabled={step === 0} className="btn-secondary">
          Precedent
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={next} className="btn-primary">
            Suivant
          </button>
        ) : (
          <button onClick={submit} disabled={submitting} className="btn-primary">
            {submitting ? 'Envoi...' : 'Valider'}
          </button>
        )}
      </div>
    </div>
  )
}

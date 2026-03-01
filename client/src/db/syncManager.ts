import { db } from './database'
import api from '@/api/client'
import { useSyncStore } from '@/store/syncStore'

const MAX_RETRIES = 3

export async function drainQueue() {
  const store = useSyncStore.getState()
  if (store.syncing || !navigator.onLine) return

  store.setSyncing(true)

  try {
    const items = await db.syncQueue.toArray()

    if (items.length === 0) {
      store.setPendingCount(0)
      return
    }

    for (const item of items) {
      try {
        if (item.entityType === 'enlevement' && item.action === 'create') {
          const payload = item.payload

          // Créer le chauffeur s'il a été saisi hors ligne (pas d'ID existant)
          let chauffeurId: string | undefined = payload.chauffeur?.id
          if (!chauffeurId && payload.chauffeur?.prenom && payload.chauffeur?.nom) {
            const { data: ch } = await api.post('/chauffeurs', {
              prenom: payload.chauffeur.prenom,
              nom: payload.chauffeur.nom,
              telephone: payload.chauffeur.telephone || '',
              matricule_plateau: payload.chauffeur.matricule_plateau || '',
            })
            chauffeurId = ch.id
          }

          const { data: enlevement } = await api.post('/enlevements', {
            vehicule: payload.vehicule,
            details: {
              cadre: payload.enlevement.cadre_saisie,
              etat: payload.enlevement.etat_vehicule,
              commentaires: payload.enlevement.commentaires
            },
            gps: {
              latitude: payload.enlevement.gps_latitude || 0,
              longitude: payload.enlevement.gps_longitude || 0,
              accuracy: payload.enlevement.gps_accuracy
            },
            autorite: payload.autorite,
            chauffeur_id: chauffeurId || null,
            date_enlevement: payload.enlevement.date_enlevement,
            heure_enlevement: payload.enlevement.heure_enlevement,
            lieu_enlevement: payload.enlevement.lieu_enlevement,
            agent_collecte: payload.enlevement.agent_collecte,
            responsable: payload.enlevement.responsable,
            client_id: item.clientId
          })

          // Upload photos if any
          if (payload.photos?.length > 0) {
            await api.post('/photos', {
              enlevementId: enlevement.id,
              photos: payload.photos
            })
          }

          // Mark local record as synced
          const localRecord = await db.enlevements.where('clientId').equals(item.clientId).first()
          if (localRecord?.id) {
            await db.enlevements.update(localRecord.id, { synced: true })
          }
        }

        // Remove from queue
        if (item.id) {
          await db.syncQueue.delete(item.id)
        }
      } catch (err) {
        const retries = (item.retries || 0) + 1
        if (retries >= MAX_RETRIES && item.id) {
          await db.syncQueue.delete(item.id)
        } else if (item.id) {
          await db.syncQueue.update(item.id, { retries })
        }
      }
    }

    const remaining = await db.syncQueue.count()
    store.setPendingCount(remaining)
    if (remaining === 0) {
      store.setLastSync(new Date().toISOString())
    }
  } finally {
    store.setSyncing(false)
  }
}

export async function updatePendingCount() {
  const count = await db.syncQueue.count()
  useSyncStore.getState().setPendingCount(count)
}

export function initSyncListeners() {
  window.addEventListener('online', () => {
    drainQueue()
  })
  updatePendingCount()
}

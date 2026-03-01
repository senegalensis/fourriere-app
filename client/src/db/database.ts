import Dexie, { type EntityTable } from 'dexie'

interface OfflineEnlevement {
  id?: number
  clientId: string
  data: any
  createdAt: string
  synced: boolean
}

interface OfflinePhoto {
  id?: number
  clientId: string
  enlevementClientId: string
  data: string
  type: string
  synced: boolean
}

interface CachedChauffeur {
  id?: number
  serverId: string
  prenom: string
  nom: string
  matricule_plateau: string
}

interface SyncQueueItem {
  id?: number
  clientId: string
  action: string
  entityType: string
  payload: any
  createdAt: string
  retries?: number
}

interface MetadataItem {
  key: string
  value: string
}

const db = new Dexie('FourriereDB') as Dexie & {
  enlevements: EntityTable<OfflineEnlevement, 'id'>
  photos: EntityTable<OfflinePhoto, 'id'>
  chauffeurs: EntityTable<CachedChauffeur, 'id'>
  syncQueue: EntityTable<SyncQueueItem, 'id'>
  metadata: EntityTable<MetadataItem, 'key'>
}

db.version(1).stores({
  enlevements: '++id, clientId, synced, createdAt',
  photos: '++id, clientId, enlevementClientId, synced',
  chauffeurs: '++id, serverId',
  syncQueue: '++id, clientId, action, entityType, createdAt',
  metadata: 'key'
})

export { db }
export type { OfflineEnlevement, OfflinePhoto, CachedChauffeur, SyncQueueItem }

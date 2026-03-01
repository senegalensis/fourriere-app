import { create } from 'zustand'

interface SyncState {
  isOnline: boolean
  pendingCount: number
  syncing: boolean
  lastSyncAt: string | null
  setOnline: (online: boolean) => void
  setPendingCount: (count: number) => void
  setSyncing: (syncing: boolean) => void
  setLastSync: (date: string) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: navigator.onLine,
  pendingCount: 0,
  syncing: false,
  lastSyncAt: null,

  setOnline: (online) => set({ isOnline: online }),
  setPendingCount: (count) => set({ pendingCount: count }),
  setSyncing: (syncing) => set({ syncing }),
  setLastSync: (date) => set({ lastSyncAt: date })
}))

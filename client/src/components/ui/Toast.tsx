import { useEffect, useState } from 'react'
import { create } from 'zustand'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastStore {
  toasts: ToastItem[]
  add: (message: string, type?: 'success' | 'error' | 'info') => void
  remove: (id: number) => void
}

let nextId = 0

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, type = 'info') => {
    const id = ++nextId
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000)
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}))

const bgColors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-primary-500'
}

export default function ToastContainer() {
  const { toasts, remove } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => remove(t.id)}
          className={`${bgColors[t.type]} text-white px-4 py-3 rounded-lg shadow-lg cursor-pointer text-sm max-w-sm animate-slide-in`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

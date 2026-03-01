import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import NewEnlevementPage from '@/pages/NewEnlevementPage'
import EnlevementsListPage from '@/pages/EnlevementsListPage'
import EnlevementDetailPage from '@/pages/EnlevementDetailPage'
import ReceptionPage from '@/pages/ReceptionPage'
import ReceptionListPage from '@/pages/ReceptionListPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminSortiesPage from '@/pages/admin/AdminSortiesPage'
import DocumentsPage from '@/pages/DocumentsPage'
import ToastContainer from '@/components/ui/Toast'
import { initSyncListeners } from '@/db/syncManager'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export default function App() {
  useOnlineStatus()

  useEffect(() => {
    initSyncListeners()
  }, [])

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route
            path="/enlevements/nouveau"
            element={
              <ProtectedRoute allowedRoles={['admin', 'agent']}>
                <NewEnlevementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/enlevements"
            element={
              <ProtectedRoute allowedRoles={['admin', 'agent']}>
                <EnlevementsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/enlevements/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'agent']}>
                <EnlevementDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reception/nouvelle"
            element={
              <ProtectedRoute allowedRoles={['admin', 'fourriere']}>
                <ReceptionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reception"
            element={
              <ProtectedRoute allowedRoles={['admin', 'fourriere']}>
                <ReceptionListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/utilisateurs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sorties"
            element={
              <ProtectedRoute allowedRoles={['admin', 'fourriere']}>
                <AdminSortiesPage />
              </ProtectedRoute>
            }
          />
          <Route path="/documents" element={<DocumentsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import OperationsPage from './pages/OperationsPage'
import ReportsPage from './pages/ReportsPage'
import FamilyPage from './pages/FamilyPage'
import CategoriesPage from './pages/CategoriesPage'
import LimitsPage from './pages/LimitsPage'
import SettingsPage from './pages/SettingsPage'
import type { ReactElement } from 'react'

function RequireAuth({ children }: { children: ReactElement }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user } = useAuth()
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<DashboardPage />} />
          <Route path="operations" element={<OperationsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="family" element={<FamilyPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="limits" element={<LimitsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

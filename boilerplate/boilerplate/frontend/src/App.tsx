import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './providers/AuthProvider'
import { InstallBanner } from './atoms/InstallBanner'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import PautaPage from './pages/PautaPage'
import ProgresoPage from './pages/ProgresoPage'
import ChatPage from './pages/ChatPage'
import HabitsPage from './pages/HabitsPage'
import HabitsPersonalizePage from './pages/HabitsPersonalizePage'
import ProfilePage from './pages/ProfilePage'
import NutricionistaPage from './pages/NutricionistaPage'
import PlanSelectionPage from './pages/PlanSelectionPage'
import RecipesPage from './pages/RecipesPage'
import ShoppingListPage from './pages/ShoppingListPage'
import TrainingPage from './pages/TrainingPage'
import R24Page from './pages/R24Page'
import MealPrepPage from './pages/MealPrepPage'

// Authenticated patient — no onboarding gate
function PatientRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (role === 'nutritionist') return <Navigate to="/nutricionista" replace />
  return <>{children}</>
}

// Authenticated user (any role) — for onboarding itself
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

// Nutritionist only
function NutricionistaRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (role !== 'nutritionist') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

// Unauthenticated only — redirect to dashboard if already logged in
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth()
  if (loading) return null
  if (!user) return <>{children}</>
  if (role === 'nutritionist') return <Navigate to="/nutricionista" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <>
    <InstallBanner />
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/onboarding" element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
      <Route path="/planes" element={<PrivateRoute><PlanSelectionPage /></PrivateRoute>} />
      <Route path="/dashboard" element={<PatientRoute><DashboardPage /></PatientRoute>} />
      <Route path="/pauta" element={<PatientRoute><PautaPage /></PatientRoute>} />
      <Route path="/progreso" element={<PatientRoute><ProgresoPage /></PatientRoute>} />
      <Route path="/chat" element={<PatientRoute><ChatPage /></PatientRoute>} />
      <Route path="/habitos" element={<PatientRoute><HabitsPage /></PatientRoute>} />
      <Route path="/habitos/personalizar" element={<PatientRoute><HabitsPersonalizePage /></PatientRoute>} />
      <Route path="/perfil" element={<PatientRoute><ProfilePage /></PatientRoute>} />
      <Route path="/recetas" element={<PatientRoute><RecipesPage /></PatientRoute>} />
      <Route path="/lista-compras" element={<PatientRoute><ShoppingListPage /></PatientRoute>} />
      <Route path="/entrenamiento" element={<PatientRoute><TrainingPage /></PatientRoute>} />
      <Route path="/r24" element={<PatientRoute><R24Page /></PatientRoute>} />
      <Route path="/meal-prep" element={<PatientRoute><MealPrepPage /></PatientRoute>} />
      <Route path="/nutricionista" element={<NutricionistaRoute><NutricionistaPage /></NutricionistaRoute>} />
      <Route path="/nutricionista/paciente/:patientId" element={<NutricionistaRoute><NutricionistaPage /></NutricionistaRoute>} />
    </Routes>
    </>
  )
}

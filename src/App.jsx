import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Fincas from '@/pages/Fincas';
import Lotes from '@/pages/Lotes';
import Animales from '@/pages/Animales';
import AnimalForm from '@/pages/AnimalForm';
import AnimalDetail from '@/pages/AnimalDetail';
import Pesajes from '@/pages/Pesajes';
import PesajeForm from '@/pages/PesajeForm';
import Gastos from '@/pages/Gastos';
import Ventas from '@/pages/Ventas';
import Tratamientos from '@/pages/Tratamientos';
import Reportes from '@/pages/Reportes';
import Configuracion from '@/pages/Configuracion';
import CaballosDashboard from '@/pages/CaballosDashboard';
import YeguasList from '@/pages/YeguasList';
import YeguaForm from '@/pages/YeguaForm';
import YeguaDetail from '@/pages/YeguaDetail';
import InseminacionForm from '@/pages/InseminacionForm';
import ConfirmacionPreñezForm from '@/pages/ConfirmacionPreñezForm';
import RepeticionCeloForm from '@/pages/RepeticionCeloForm';
import PartoForm from '@/pages/PartoForm';
import DesteteForm from '@/pages/DesteteForm';
import CriasList from '@/pages/CriasList';
import CalendarioReproductivo from '@/pages/CalendarioReproductivo';
import { Navigate } from 'react-router-dom';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/fincas" element={<Fincas />} />
          <Route path="/lotes" element={<Lotes />} />
          <Route path="/animales" element={<Animales />} />
          <Route path="/animales/nuevo" element={<AnimalForm />} />
          <Route path="/animales/:id" element={<AnimalDetail />} />
          <Route path="/animales/:id/editar" element={<AnimalForm />} />
          <Route path="/pesajes" element={<Pesajes />} />
          <Route path="/pesajes/nuevo" element={<PesajeForm />} />
          <Route path="/gastos" element={<Gastos />} />
          <Route path="/gastos/nuevo" element={<Gastos />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/ventas/nueva" element={<Ventas />} />
          <Route path="/tratamientos" element={<Tratamientos />} />
          <Route path="/tratamientos/nuevo" element={<Tratamientos />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/configuracion" element={<Configuracion />} />
          {/* Caballos / Reproducción de Yeguas */}
          <Route path="/caballos" element={<CaballosDashboard />} />
          <Route path="/caballos/yeguas" element={<YeguasList />} />
          <Route path="/caballos/yeguas/nueva" element={<YeguaForm />} />
          <Route path="/caballos/yeguas/:id" element={<YeguaDetail />} />
          <Route path="/caballos/yeguas/:id/editar" element={<YeguaForm />} />
          <Route path="/caballos/inseminacion/nueva" element={<InseminacionForm />} />
          <Route path="/caballos/preñez/nueva" element={<ConfirmacionPreñezForm />} />
          <Route path="/caballos/celo/nueva" element={<RepeticionCeloForm />} />
          <Route path="/caballos/parto/nuevo" element={<PartoForm />} />
          <Route path="/caballos/destete/nuevo" element={<DesteteForm />} />
          <Route path="/caballos/crias" element={<CriasList />} />
          <Route path="/caballos/calendario" element={<CalendarioReproductivo />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
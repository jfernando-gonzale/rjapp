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
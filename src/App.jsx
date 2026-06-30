import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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

// Pages
import Dashboard from '@/pages/Dashboard';
import Bovinos from '@/pages/Bovinos';
import Ovinos from '@/pages/Ovinos';
import Equinos from '@/pages/Equinos';
import Fincas from '@/pages/Fincas';
import Lotes from '@/pages/Lotes';
import Animales from '@/pages/Animales';
import AnimalForm from '@/pages/AnimalForm';
import AnimalDetail from '@/pages/AnimalDetail';
import Pesajes from '@/pages/Pesajes';
import PesajeForm from '@/pages/PesajeForm';
import Gastos from '@/pages/Gastos';
import Ventas from '@/pages/Ventas';
import Clientes from '@/pages/Clientes';
import Despachos from '@/pages/Despachos';
import Tratamientos from '@/pages/Tratamientos';
import Procedimientos from '@/pages/Procedimientos';
import RegistroMasivo from '@/pages/RegistroMasivo';
import Reproduccion from '@/pages/Reproduccion';
import Reportes from '@/pages/Reportes';
import Configuracion from '@/pages/Configuracion';

// Reproductores equinos
import ReproductoresList from '@/pages/ReproductoresList';
import ReproductorForm from '@/pages/ReproductorForm';
import ReproductorDetail from '@/pages/ReproductorDetail';

// Equinos / Caballos submodule
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
import CalendarioIntegral from '@/pages/CalendarioIntegral';
import CalendarioReproductivo from '@/pages/CalendarioReproductivo';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#111111]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
            <span className="font-black text-black text-lg">RJ</span>
          </div>
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />

          {/* Especies */}
          <Route path="/bovinos" element={<Bovinos />} />
          <Route path="/ovinos" element={<Ovinos />} />
          <Route path="/equinos" element={<Equinos />} />

          {/* Operación */}
          <Route path="/fincas" element={<Fincas />} />
          <Route path="/lotes" element={<Lotes />} />
          <Route path="/animales" element={<Animales />} />
          <Route path="/animales/nuevo" element={<AnimalForm />} />
          <Route path="/animales/:id" element={<AnimalDetail />} />
          <Route path="/animales/:id/editar" element={<AnimalForm />} />
          <Route path="/pesajes" element={<Pesajes />} />
          <Route path="/pesajes/nuevo" element={<PesajeForm />} />
          <Route path="/tratamientos" element={<Tratamientos />} />
          <Route path="/tratamientos/nuevo" element={<Tratamientos />} />
          <Route path="/procedimientos" element={<Procedimientos />} />
          <Route path="/procedimientos/nuevo" element={<Procedimientos />} />
          <Route path="/animales/masivo" element={<RegistroMasivo />} />
          <Route path="/reproduccion" element={<Reproduccion />} />

          {/* Comercial */}
          <Route path="/gastos" element={<Gastos />} />
          <Route path="/gastos/nuevo" element={<Gastos />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/ventas/nueva" element={<Ventas />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/despachos" element={<Despachos />} />

          {/* Análisis */}
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/calendario" element={<CalendarioIntegral />} />

          {/* Sistema */}
          <Route path="/configuracion" element={<Configuracion />} />

          {/* Reproductores */}
          <Route path="/reproductores" element={<ReproductoresList />} />
          <Route path="/reproductores/nuevo" element={<ReproductorForm />} />
          <Route path="/reproductores/:id" element={<ReproductorDetail />} />
          <Route path="/reproductores/:id/editar" element={<ReproductorForm />} />

          {/* Equinos submodule (caballos) */}
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
  );
}

export default App;
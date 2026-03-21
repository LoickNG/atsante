import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import PatientsList from "./pages/PatientsList";
import NewPatient from "./pages/NewPatient";
import PatientDetail from "./pages/PatientDetail";
import WaitingQueue from "./pages/WaitingQueue";
import Consultations from "./pages/Consultations";
import Pharmacy from "./pages/Pharmacy";
import Laboratory from "./pages/Laboratory";
import Imaging from "./pages/Imaging";
import Billing from "./pages/Billing";
import Payments from "./pages/Payments";
import Settings from "./pages/Settings";
import Extracts from "./pages/Extracts";
import Hospitalizations from "./pages/Hospitalizations";
import SurgeryPage from "./pages/Surgery";
import Maternity from "./pages/Maternity";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute allowedRoles={['admin', 'accueil', 'medecin', 'infirmier', 'caissier', 'pharmacien', 'laborantin', 'imagerie']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/patients" element={
              <ProtectedRoute allowedRoles={['admin', 'accueil', 'medecin', 'infirmier', 'caissier']}>
                <PatientsList />
              </ProtectedRoute>
            } />
            <Route path="/patients/nouveau" element={
              <ProtectedRoute allowedRoles={['admin', 'accueil']}>
                <NewPatient />
              </ProtectedRoute>
            } />
            <Route path="/patients/:id" element={
              <ProtectedRoute allowedRoles={['admin', 'accueil', 'medecin', 'infirmier', 'caissier', 'pharmacien', 'laborantin', 'imagerie']}>
                <PatientDetail />
              </ProtectedRoute>
            } />
            <Route path="/file-attente" element={
              <ProtectedRoute allowedRoles={['admin', 'accueil', 'medecin', 'infirmier']}>
                <WaitingQueue />
              </ProtectedRoute>
            } />
            <Route path="/consultations" element={
              <ProtectedRoute allowedRoles={['admin', 'medecin', 'infirmier']}>
                <Consultations />
              </ProtectedRoute>
            } />
            <Route path="/hospitalisations" element={
              <ProtectedRoute allowedRoles={['admin', 'medecin', 'infirmier']}>
                <Hospitalizations />
              </ProtectedRoute>
            } />
            <Route path="/bloc-operatoire" element={
              <ProtectedRoute allowedRoles={['admin', 'medecin', 'infirmier']}>
                <SurgeryPage />
              </ProtectedRoute>
            } />
            <Route path="/pharmacie" element={
              <ProtectedRoute allowedRoles={['admin', 'pharmacien', 'medecin']}>
                <Pharmacy />
              </ProtectedRoute>
            } />
            <Route path="/laboratoire" element={
              <ProtectedRoute allowedRoles={['admin', 'laborantin', 'medecin']}>
                <Laboratory />
              </ProtectedRoute>
            } />
            <Route path="/imagerie" element={
              <ProtectedRoute allowedRoles={['admin', 'imagerie', 'medecin']}>
                <Imaging />
              </ProtectedRoute>
            } />
            <Route path="/facturation" element={
              <ProtectedRoute allowedRoles={['admin', 'caissier']}>
                <Billing />
              </ProtectedRoute>
            } />
            <Route path="/paiements" element={
              <ProtectedRoute allowedRoles={['admin', 'caissier']}>
                <Payments />
              </ProtectedRoute>
            } />
            <Route path="/extraits" element={
              <ProtectedRoute allowedRoles={['admin', 'caissier']}>
                <Extracts />
              </ProtectedRoute>
            } />
            <Route path="/parametres" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Settings />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="/maternite" element={
              <ProtectedRoute allowedRoles={['admin', 'medecin', 'infirmier']}>
                <Maternity />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

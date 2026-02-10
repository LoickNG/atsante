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
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute><PatientsList /></ProtectedRoute>} />
            <Route path="/patients/nouveau" element={<ProtectedRoute><NewPatient /></ProtectedRoute>} />
            <Route path="/patients/:id" element={<ProtectedRoute><PatientDetail /></ProtectedRoute>} />
            <Route path="/file-attente" element={<ProtectedRoute><WaitingQueue /></ProtectedRoute>} />
            <Route path="/consultations" element={<ProtectedRoute><Consultations /></ProtectedRoute>} />
            <Route path="/pharmacie" element={<ProtectedRoute><Pharmacy /></ProtectedRoute>} />
            <Route path="/laboratoire" element={<ProtectedRoute><Laboratory /></ProtectedRoute>} />
            <Route path="/imagerie" element={<ProtectedRoute><Imaging /></ProtectedRoute>} />
            <Route path="/facturation" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="/paiements" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
            <Route path="/parametres" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

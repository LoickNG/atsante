import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
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
import StockManagement from "./pages/StockManagement";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/patients" element={<PatientsList />} />
            <Route path="/patients/nouveau" element={<NewPatient />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/file-attente" element={<WaitingQueue />} />
            <Route path="/consultations" element={<Consultations />} />
            <Route path="/pharmacie" element={<Pharmacy />} />
            <Route path="/laboratoire" element={<Laboratory />} />
            <Route path="/imagerie" element={<Imaging />} />
            <Route path="/facturation" element={<Billing />} />
            <Route path="/stocks" element={<StockManagement />} />
            <Route path="/utilisateurs" element={<UserManagement />} />
            <Route path="/parametres" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

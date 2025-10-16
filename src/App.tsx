import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Alcance from "./pages/Alcance";
import Estadisticas from "./pages/Estadisticas";
import Rankings from "./pages/Rankings";
import RankingAlertas from "./pages/RankingAlertas";
import RankingAutores from "./pages/RankingAutores";
import RankingPaises from "./pages/RankingPaises";
import RankingFuentes from "./pages/RankingFuentes";
import RankingLenguajes from "./pages/RankingLenguajes";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import Sentimiento from "./pages/Sentimiento";
import InformeSentimiento from "./pages/InformeSentimiento";
import GeneroEdad from "./pages/GeneroEdad";
import Fuentes from "./pages/Fuentes";
import Paises from "./pages/Paises";
import MapaCalor from "./pages/MapaCalor";
import Comparador from "./pages/Comparador";
import ComparandoTopicos from "./pages/ComparandoTopicos";
import TopicCloud from "./pages/TopicCloud";
import ListaMenciones from "./pages/ListaMenciones";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/estadisticas" 
              element={
                <ProtectedRoute>
                  <Estadisticas />
                </ProtectedRoute>
              } 
            />
             <Route 
              path="/alcance" 
              element={
                <ProtectedRoute>
                  <Alcance />
                </ProtectedRoute>
              } 
            />
             <Route 
              path="/sentimiento" 
              element={
                <ProtectedRoute>
                  <Sentimiento />
                </ProtectedRoute>
              } 
            />
             <Route 
              path="/informeSentimiento" 
              element={
                <ProtectedRoute>
                  <InformeSentimiento />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/rankings" 
              element={
                <ProtectedRoute>
                  <Rankings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/rankings/alertas" 
              element={
                <ProtectedRoute>
                  <RankingAlertas />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/rankings/autores" 
              element={
                <ProtectedRoute>
                  <RankingAutores />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/fuentes" 
              element={
                <ProtectedRoute>
                  <Fuentes />
                </ProtectedRoute>
              } 
            />
             <Route 
              path="/paises" 
              element={
                <ProtectedRoute>
                  <Paises />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mapa-calor" 
              element={
                <ProtectedRoute>
                  <MapaCalor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/comparador" 
              element={
                <ProtectedRoute>
                  <Comparador />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/comparandoTopicos" 
              element={
                <ProtectedRoute>
                  <ComparandoTopicos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/topicCLoud" 
              element={
                <ProtectedRoute>
                  <TopicCloud />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lista-menciones" 
              element={
                <ProtectedRoute>
                  <ListaMenciones />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/genero-edad" 
              element={
                <ProtectedRoute>
                  <GeneroEdad />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/rankings/paises" 
              element={
                <ProtectedRoute>
                  <RankingPaises />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/rankings/fuentes" 
              element={
                <ProtectedRoute>
                  <RankingFuentes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/rankings/lenguajes" 
              element={
                <ProtectedRoute>
                  <RankingLenguajes />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
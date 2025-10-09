import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import AlertCard from '@/components/AlertCard';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import MathBackground from '@/components/MathBackground';
import Header from '@/components/Header';

interface StatsData {
  total_mentions: number;
  total_reach: number;
  unique_authors: number;
  total_sources: number;
}

interface Alert {
  id: string;
  name: string;
}

const AnimatedNumber = ({ value, duration = 2000, className = "" }: { value: number; duration?: number; className?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function para suavizar
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  // Reservar espacio para el número final
  const finalWidth = value.toLocaleString().length;

  return (
    <span className={className} style={{ display: 'inline-block', minWidth: `${finalWidth}ch` }}>
      {displayValue.toLocaleString()}
    </span>
  );
};

const Dashboard = () => {
  const { userEmail, companyId, setCompanyId } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);

  useEffect(() => {
    if (userEmail && !companyId) {
      fetchCompanyId();
    }
  }, [userEmail, companyId]);

  useEffect(() => {
    if (companyId) {
      fetchStats();
      fetchAlerts();
    }
  }, [companyId]);

  const fetchCompanyId = async () => {
    try {
      const response = await apiFetch(`/api/info/getIdEmpresa?email=${userEmail}`);
      if (!response.ok) throw new Error('Error al obtener ID de empresa');
      
      const result = await response.json();
      setCompanyId(result.data.company_id.toString());
    } catch (error) {
      toast.error('Error al cargar información de empresa');
      console.error(error);
    }
  };

  const fetchStats = async (alertId?: string) => {
    if (!companyId) return;
    
    setIsLoadingStats(true);
    try {
      const endpoint = alertId 
        ? `/api/stats/general/overview?company_id=${companyId}&alert_id=${alertId}`
        : `/api/stats/general/overview?company_id=${companyId}`;
      
      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error('Error al obtener estadísticas');
      
      const result = await response.json();
      setStats(result.data);
    } catch (error) {
      toast.error('Error al cargar estadísticas');
      console.error(error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchAlerts = async () => {
    if (!companyId) return;
    
    setIsLoadingAlerts(true);
    try {
      const response = await apiFetch(`/api/info/getAlerts?company_id=${companyId}`);
      if (!response.ok) throw new Error('Error al obtener alertas');
      
      const result = await response.json();
      setAlerts(result.data.alerts || []);
    } catch (error) {
      toast.error('Error al cargar alertas');
      console.error(error);
      setAlerts([]);
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  const handleAlertClick = (alertId: string | null) => {
    if (alertId === null) {
      // Vista general - siempre refresca
      setSelectedAlertId(null);
      fetchStats();
    } else if (selectedAlertId === alertId) {
      // Si clickeas la misma alerta, vuelve a vista general
      setSelectedAlertId(null);
      fetchStats();
    } else {
      // Selecciona nueva alerta
      setSelectedAlertId(alertId);
      fetchStats(alertId);
    }
  };

  return (
    <div className="min-h-screen flex">
      <MathBackground />
      <Sidebar />
      
      <div className="flex-1 p-6 relative z-10">
        <div className="max-w-7xl mx-auto space-y-12">
          <Header />

          {/* Stats Cards */}
          {isLoadingStats ? (
            <div className="flex justify-center items-center py-32">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : stats ? (
            <div className="flex items-center justify-center gap-32 animate-fade-in py-24">
              {/* Menciones Totales - Izquierda */}
              <div className="text-center space-y-3">
                <div className="text-6xl font-bold text-foreground">
                  <AnimatedNumber value={stats.total_mentions} duration={1800} />
                </div>
                <p className="text-base text-foreground font-bold">Menciones Totales</p>
              </div>

              {/* Alcance Total - Centro y más grande */}
              <div className="text-center space-y-3">
                <div className="text-9xl font-bold text-foreground">
                  <AnimatedNumber value={stats.total_reach} duration={2000} />
                </div>
                <p className="text-2xl text-foreground font-bold">Alcance Total</p>
              </div>
              
              {/* Autores Únicos - Derecha */}
              <div className="text-center space-y-3">
                <div className="text-6xl font-bold text-foreground">
                  <AnimatedNumber value={stats.unique_authors} duration={1800} />
                </div>
                <p className="text-base text-foreground font-bold">Autores Únicos</p>
              </div>
            </div>
          ) : null}

          {/* Alerts Grid */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground/80">Alertas</h2>
            {isLoadingAlerts ? (
              <div className="flex justify-center items-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in">
                {/* Vista General - Hardcoded */}
                <AlertCard
                  id="general"
                  name="Vista General"
                  onClick={() => handleAlertClick(null)}
                  isActive={selectedAlertId === null}
                />
                
                {/* Alertas dinámicas */}
                {alerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    id={alert.id}
                    name={alert.name}
                    onClick={handleAlertClick}
                    isActive={selectedAlertId === alert.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
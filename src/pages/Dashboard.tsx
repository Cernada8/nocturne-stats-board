import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import AlertCard from '@/components/AlertCard';
import ArgosAI from './ArgosAI';
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

const AnimatedNumber = ({
  value,
  duration = 2000,
  className = '',
}: {
  value: number;
  duration?: number;
  className?: string;
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span className={className}>{displayValue.toLocaleString()}</span>;
};

const Dashboard = () => {
  const { userEmail, companyId, setCompanyId } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);

  // Obtener companyId a partir del email
  useEffect(() => {
    if (userEmail && !companyId) {
      fetchCompanyId();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail, companyId]);

  const fetchCompanyId = async () => {
    try {
      const response = await apiFetch(
        `/api/info/getIdEmpresa?email=${userEmail}`
      );
      if (!response.ok) throw new Error('Error al obtener ID de empresa');

      const result = await response.json();
      setCompanyId(result.data.company_id.toString());
    } catch (error) {
      toast.error('Error al cargar información de empresa');
      console.error(error);
    }
  };

  // Cuando tengamos companyId, traer alerts
  useEffect(() => {
    if (companyId) {
      fetchAlerts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const fetchAlerts = async () => {
    if (!companyId) return;

    setIsLoadingAlerts(true);
    try {
      const response = await apiFetch(
        `/api/info/getAlerts?company_id=${companyId}`
      );
      if (!response.ok) throw new Error('Error al obtener alertas');

      const result = await response.json();
      // Filtramos Leads una sola vez aquí
      const alertsList: Alert[] = (result.data.alerts || []).filter(
        (alert: Alert) => alert.name !== 'Leads'
      );

      setAlerts(alertsList);

      // Autoseleccionar primera alerta si no hay ninguna seleccionada
      if (alertsList.length > 0 && !selectedAlertId) {
        setSelectedAlertId(alertsList[0].id);
      }
    } catch (error) {
      toast.error('Error al cargar alertas');
      console.error(error);
      setAlerts([]);
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  const fetchStats = async (alertId?: string | null) => {
    if (!companyId) return;

    setIsLoadingStats(true);
    try {
      const endpoint = alertId
        ? `/api/stats/general/overview?company_id=${companyId}&alert_id=${alertId}`
        : `/api/stats/general/overview?company_id=${companyId}`;

      console.log('Llamando a overview:', endpoint);

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

  // Efecto centralizado que decide CUÁNDO llamar al overview
  useEffect(() => {
    if (!companyId) return;

    if (selectedAlertId) {
      // Overview filtrado por alerta
      fetchStats(selectedAlertId);
    } else {
      // Overview general de la empresa
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, selectedAlertId]);

  const handleAlertClick = (alertId: string | null) => {
    // Si clicas la misma alerta, no hacemos nada
    if (!alertId || alertId === selectedAlertId) return;
    setSelectedAlertId(alertId);
    // NO llamamos aquí a fetchStats; lo hace el useEffect de arriba
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-x-hidden">
      <MathBackground />
      <Sidebar />

      <div className="flex-1 w-full px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-8 relative z-10">
        <div className="max-w-7xl mx-auto w-full space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12">
          <Header />

          {/* Stats Cards */}
          {isLoadingStats ? (
            <div className="flex justify-center items-center py-12 sm:py-16 md:py-20 lg:py-32">
              <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-spin text-primary" />
            </div>
          ) : stats ? (
            <div className="animate-fade-in w-full">
              {/* Mobile: Vertical Stack */}
              <div className="flex flex-col gap-6 sm:hidden px-2 py-6">
                {/* Alcance Total */}
                <div className="text-center space-y-1.5">
                  <div className="text-4xl xs:text-5xl font-bold text-foreground break-words">
                    <AnimatedNumber value={stats.total_reach} duration={2000} />
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    Alcance Total
                  </p>
                </div>

                {/* Grid 2 columnas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center space-y-1.5">
                    <div className="text-2xl xs:text-3xl font-bold text-foreground">
                      <AnimatedNumber
                        value={stats.total_mentions}
                        duration={1800}
                      />
                    </div>
                    <p className="text-xs font-bold text-foreground leading-tight">
                      Menciones
                      <br />
                      Totales
                    </p>
                  </div>

                  <div className="text-center space-y-1.5">
                    <div className="text-2xl xs:text-3xl font-bold text-foreground">
                      <AnimatedNumber
                        value={stats.unique_authors}
                        duration={1800}
                      />
                    </div>
                    <p className="text-xs font-bold text-foreground leading-tight">
                      Autores
                      <br />
                      Únicos
                    </p>
                  </div>
                </div>
              </div>

              {/* Tablet: 3 columnas */}
              <div className="hidden sm:flex lg:hidden items-center justify-center gap-6 md:gap-12 py-10 md:py-16 px-4">
                <div className="text-center space-y-2 flex-shrink-0">
                  <div className="text-3xl md:text-4xl xl:text-5xl font-bold text-foreground">
                    <AnimatedNumber
                      value={stats.total_mentions}
                      duration={1800}
                    />
                  </div>
                  <p className="text-xs md:text-sm font-bold text-foreground whitespace-nowrap">
                    Menciones Totales
                  </p>
                </div>

                <div className="text-center space-y-2 flex-shrink-0">
                  <div className="text-5xl md:text-6xl xl:text-7xl font-bold text-foreground">
                    <AnimatedNumber
                      value={stats.total_reach}
                      duration={2000}
                    />
                  </div>
                  <p className="text-base md:text-lg font-bold text-foreground whitespace-nowrap">
                    Alcance Total
                  </p>
                </div>

                <div className="text-center space-y-2 flex-shrink-0">
                  <div className="text-3xl md:text-4xl xl:text-5xl font-bold text-foreground">
                    <AnimatedNumber
                      value={stats.unique_authors}
                      duration={1800}
                    />
                  </div>
                  <p className="text-xs md:text-sm font-bold text-foreground whitespace-nowrap">
                    Autores Únicos
                  </p>
                </div>
              </div>

              {/* Desktop */}
              <div className="hidden lg:flex items-center justify-center gap-16 xl:gap-32 py-16 xl:py-24">
                <div className="text-center space-y-3 min-w-[200px] xl:min-w-[250px]">
                  <div className="text-5xl xl:text-6xl font-bold text-foreground min-h-[60px] xl:min-h-[72px] flex items-center justify-center">
                    <AnimatedNumber
                      value={stats.total_mentions}
                      duration={1800}
                    />
                  </div>
                  <p className="text-sm xl:text-base font-bold text-foreground">
                    Menciones Totales
                  </p>
                </div>

                <div className="text-center space-y-3 min-w-[300px] xl:min-w-[400px]">
                  <div className="text-7xl xl:text-9xl font-bold text-foreground min-h-[84px] xl:min-h-[108px] flex items-center justify-center">
                    <AnimatedNumber
                      value={stats.total_reach}
                      duration={2000}
                    />
                  </div>
                  <p className="text-xl xl:text-2xl font-bold text-foreground">
                    Alcance Total
                  </p>
                </div>

                <div className="text-center space-y-3 min-w-[200px] xl:min-w-[250px]">
                  <div className="text-5xl xl:text-6xl font-bold text-foreground min-h-[60px] xl:min-h-[72px] flex items-center justify-center">
                    <AnimatedNumber
                      value={stats.unique_authors}
                      duration={1800}
                    />
                  </div>
                  <p className="text-sm xl:text-base font-bold text-foreground">
                    Autores Únicos
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Alerts Grid */}
          <div className="space-y-2 sm:space-y-3 w-full">
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-foreground/80 px-1">
              Temas
            </h2>
            {isLoadingAlerts ? (
              <div className="flex justify-center items-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-2.5 md:gap-3 animate-fade-in w-full">
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

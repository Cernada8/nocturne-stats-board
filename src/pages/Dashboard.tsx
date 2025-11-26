import { useEffect, useState } from 'react';
import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import AlertCard from '@/components/AlertCard';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import MathBackground from '@/components/MathBackground';
import Header from '@/components/Header';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface StatsData {
  total_mentions: number;
  total_reach: number;
}

interface Alert {
  id: string;
  name: string;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
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
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Ref para trackear si ya tenemos rango completo (from Y to)
  const hadCompleteRange = React.useRef(false);

  // Actualizar el ref cuando cambia dateRange
  useEffect(() => {
    hadCompleteRange.current = !!(dateRange?.from && dateRange?.to);
  }, [dateRange]);

  useEffect(() => {
    if (userEmail && !companyId) {
      fetchCompanyId();
    }
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

  useEffect(() => {
    if (companyId) {
      fetchAlerts();
    }
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
      const alertsList: Alert[] = (result.data.alerts || []).filter(
        (alert: Alert) => alert.name !== 'Leads'
      );

      setAlerts(alertsList);

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
      let endpoint = alertId
        ? `/api/stats/general/overview?company_id=${companyId}&alert_id=${alertId}`
        : `/api/stats/general/overview?company_id=${companyId}`;

      if (dateRange?.from && dateRange?.to) {
        const fromStr = format(dateRange.from, 'yyyy-MM-dd');
        const toStr = format(dateRange.to, 'yyyy-MM-dd');
        endpoint += `&from=${fromStr}&to=${toStr}`;
      }

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

  useEffect(() => {
    if (!companyId) return;

    if (selectedAlertId) {
      fetchStats(selectedAlertId);
    } else {
      fetchStats();
    }
  }, [companyId, selectedAlertId, dateRange]);

  const handleAlertClick = (alertId: string | null) => {
    if (!alertId || alertId === selectedAlertId) return;
    setSelectedAlertId(alertId);
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    // Si ya teníamos un rango completo (from Y to), cualquier click nuevo debe resetear
    if (hadCompleteRange.current && range) {
      // Encontrar qué fecha es la "nueva" (la que el usuario acaba de clickear)
      let clickedDate: Date | undefined;
      
      // Comparar con el rango anterior para encontrar la fecha nueva
      const prevFrom = dateRange?.from?.getTime();
      const prevTo = dateRange?.to?.getTime();
      const newFrom = range.from?.getTime();
      const newTo = range.to?.getTime();
      
      if (newTo && newTo !== prevTo && newTo !== prevFrom) {
        // El "to" es nuevo -> usuario clickeó fecha posterior
        clickedDate = range.to;
      } else if (newFrom && newFrom !== prevFrom && newFrom !== prevTo) {
        // El "from" es nuevo -> usuario clickeó fecha anterior
        clickedDate = range.from;
      } else if (newFrom && !newTo) {
        // Solo hay from, sin to -> usar from
        clickedDate = range.from;
      } else {
        // Fallback: usar from o to, lo que exista
        clickedDate = range.to || range.from;
      }
      
      // Resetear el ref ANTES de actualizar el estado
      hadCompleteRange.current = false;
      
      // Resetear: fecha clickeada como nuevo "from", sin "to"
      setDateRange({ from: clickedDate, to: undefined });
      return;
    }
    
    // Comportamiento normal: no teníamos rango completo, usar lo que DayPicker devuelve
    setDateRange(range);
  };

  const handlePredefinedPeriodSelect = (range: { from: Date; to: Date }) => {
    setDateRange(range);
    setIsCalendarOpen(false);
  };

  const formatDateRange = () => {
    if (!dateRange?.from) {
      return 'Seleccionar período';
    }
    if (!dateRange?.to) {
      return format(dateRange.from, 'dd MMM yyyy', { locale: es });
    }
    return `${format(dateRange.from, 'dd MMM yyyy', { locale: es })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: es })}`;
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-x-hidden">
      <MathBackground />
      <Sidebar />

      <div className="flex-1 w-full px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-8 relative z-10">
        <div className="max-w-7xl mx-auto w-full space-y-4 sm:space-y-5 md:space-y-6">
          <Header />

          {/* Date Range Selector */}
          <div className="flex justify-center">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto justify-start text-left font-normal bg-background/50 backdrop-blur-sm border-white/10 hover:bg-background/70"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateRange()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background/95 backdrop-blur-md border-white/10" align="center">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDateRangeSelect}
                  numberOfMonths={2}
                  showPredefinedPeriods={true}
                  onPredefinedPeriodSelect={handlePredefinedPeriodSelect}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Stats Cards */}
          {isLoadingStats ? (
            <div className="flex justify-center items-center py-8 sm:py-12 md:py-16">
              <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
            </div>
          ) : stats ? (
            <div className="animate-fade-in w-full">
              {/* Mobile: Vertical Stack */}
              <div className="flex flex-col gap-4 sm:hidden px-2 py-4 items-center">
                {/* Alcance Total */}
                <div className="text-center space-y-1.5">
                  <div className="text-4xl font-bold text-foreground">
                    <AnimatedNumber value={stats.total_reach} duration={2000} />
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    Alcance Total
                  </p>
                </div>

                {/* Menciones Totales */}
                <div className="text-center space-y-1.5">
                  <div className="text-3xl font-bold text-foreground">
                    <AnimatedNumber
                      value={stats.total_mentions}
                      duration={1800}
                    />
                  </div>
                  <p className="text-xs font-bold text-foreground">
                    Menciones Totales
                  </p>
                </div>
              </div>

              {/* Tablet: Vertical Stack Centered */}
              <div className="hidden sm:flex lg:hidden flex-col items-center justify-center gap-6 py-6 md:py-8 px-4">
                {/* Alcance Total */}
                <div className="text-center space-y-2">
                  <div className="text-6xl md:text-7xl font-bold text-foreground">
                    <AnimatedNumber
                      value={stats.total_reach}
                      duration={2000}
                    />
                  </div>
                  <p className="text-base md:text-lg font-bold text-foreground">
                    Alcance Total
                  </p>
                </div>

                {/* Menciones Totales */}
                <div className="text-center space-y-2">
                  <div className="text-4xl md:text-5xl font-bold text-foreground">
                    <AnimatedNumber
                      value={stats.total_mentions}
                      duration={1800}
                    />
                  </div>
                  <p className="text-sm md:text-base font-bold text-foreground">
                    Menciones Totales
                  </p>
                </div>
              </div>

              {/* Desktop: Vertical Stack Centered */}
              <div className="hidden lg:flex flex-col items-center justify-center gap-6 xl:gap-8 py-6 xl:py-8">
                {/* Alcance Total */}
                <div className="text-center space-y-2">
                  <div className="text-7xl xl:text-8xl font-bold text-foreground leading-none">
                    <AnimatedNumber
                      value={stats.total_reach}
                      duration={2000}
                    />
                  </div>
                  <p className="text-lg xl:text-xl font-bold text-foreground">
                    Alcance Total
                  </p>
                </div>

                {/* Menciones Totales */}
                <div className="text-center space-y-2">
                  <div className="text-5xl xl:text-6xl font-bold text-foreground leading-none">
                    <AnimatedNumber
                      value={stats.total_mentions}
                      duration={1800}
                    />
                  </div>
                  <p className="text-base xl:text-lg font-bold text-foreground">
                    Menciones Totales
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
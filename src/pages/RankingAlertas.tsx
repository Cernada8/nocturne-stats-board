import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Sidebar from '@/components/Sidebar';
import { Loader2,   Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import SoftMathBackground from '@/components/SoftMathBackground';
import Header from '@/components/Header';

interface AlertRanking {
  alert_id: number;
  alert_name: string;
  total_mentions: number;
  total_reach: number;
}

const RankingAlertas = () => {
  const { userEmail, companyId, setCompanyId, logout } = useAuth();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [rankings, setRankings] = useState<AlertRanking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2020, 0, 1),
    to: new Date()
  });
  const [limit, setLimit] = useState<number>(5);
  const [orderBy, setOrderBy] = useState<'mentions' | 'reach'>('mentions');
  const navigate = useNavigate();

  const orderOptions = [
    { value: 'mentions' as const, label: 'Menciones', shortLabel: 'Menc.' },
    { value: 'reach' as const, label: 'Alcance', shortLabel: 'Alc.' }
  ];

  const limitOptions = [5, 10, 20, 50];

  useEffect(() => {
    if (userEmail && !companyId) {
      fetchCompanyId();
    } else if (userEmail && companyId && !companyLogo) {
      fetchCompanyId();
    }
  }, [userEmail, companyId, companyLogo]);

  useEffect(() => {
    if (companyId && dateRange.from && dateRange.to) {
      fetchRankings();
    }
  }, [companyId, dateRange, limit, orderBy]);

  const fetchCompanyId = async () => {
    try {
      const response = await apiFetch(`/api/info/getIdEmpresa?email=${userEmail}`);
      if (!response.ok) throw new Error('Error al obtener ID de empresa');
      
      const result = await response.json();
      const companyName = result.data.name;
      const logoFileName = `logo_${companyName.toLowerCase().replace(/\s+/g, '_')}.png`;
      const logoUrl = `/assets/${logoFileName}`;
      
      setCompanyId(result.data.company_id.toString());
      setCompanyLogo(logoUrl);
    } catch (error) {
      toast.error('Error al cargar información de empresa');
      console.error(error);
    }
  };

  const fetchRankings = async () => {
    if (!companyId || !dateRange.from || !dateRange.to) return;
    
    setIsLoading(true);
    try {
      const fromStr = format(dateRange.from, 'yyyy-MM-dd');
      const toStr = format(dateRange.to, 'yyyy-MM-dd');
      
      const endpoint = `/api/stats/general/top_alerts?company_id=${companyId}&from=${fromStr}&to=${toStr}&limit=${limit}&order_by=${orderBy}`;
      
      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error('Error al obtener ranking de alertas');
      
      const result = await response.json();
      setRankings(result.data.alerts || []);
    } catch (error) {
      toast.error('Error al cargar ranking de alertas');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-h-screen overflow-hidden flex flex-col lg:flex-row">
      <SoftMathBackground />
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-slate-900/50 hover:scrollbar-thumb-slate-600/70">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <Header/>

          {/* Title with back button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <Button
              onClick={() => navigate('/rankings')}
              variant="outline"
              className="glass-effect border-white/10 hover:bg-white/10 text-white shrink-0"
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">
                Ranking de Tópicos
              </h1>
              <p className="text-sm sm:text-base text-white/70">
                Top de tópicos ordenados por menciones o alcance
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center flex-wrap">
            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="glass-effect border-white/10 hover:bg-white/10 text-white w-full sm:w-auto text-sm"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {dateRange.from && dateRange.to ? (
                      <>
                        <span className="hidden md:inline">
                          {format(dateRange.from, 'dd MMM yyyy', { locale: es })} - {format(dateRange.to, 'dd MMM yyyy', { locale: es })}
                        </span>
                        <span className="md:hidden">
                          {format(dateRange.from, 'dd/MM/yy')} - {format(dateRange.to, 'dd/MM/yy')}
                        </span>
                      </>
                    ) : (
                      'Seleccionar fechas'
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 glass-card border-white/10" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={1}
                  locale={es}
                  fromYear={1960}
                  toYear={2030}
                  className="sm:hidden"
                />
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                  locale={es}
                  fromYear={1960}
                  toYear={2030}
                  className="hidden sm:block"
                />
              </PopoverContent>
            </Popover>

            {/* Order By Selector */}
            <div className="flex gap-2 w-full sm:w-auto">
              {orderOptions.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => setOrderBy(option.value)}
                  className={`flex-1 sm:flex-none transition-all duration-300 text-xs sm:text-sm ${
                    orderBy === option.value
                      ? 'bg-primary/20 border border-cyan-300/60 shadow-xl shadow-cyan-400/30 scale-105 hover:bg-primary/20 text-white'
                      : 'glass-effect border-white/10 hover:bg-white/10 text-white'
                  }`}
                  variant={orderBy === option.value ? 'default' : 'outline'}
                  size="sm"
                >
                  <span className="sm:hidden">{option.shortLabel}</span>
                  <span className="hidden sm:inline">{option.label}</span>
                </Button>
              ))}
            </div>

            {/* Limit Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="glass-effect border-white/10 hover:bg-white/10 text-white w-full sm:w-auto text-xs sm:text-sm"
                >
                  Mostrar: {limit}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-32 p-2 glass-card border-white/10" align="start">
                <div className="space-y-1">
                  {limitOptions.map((option) => (
                    <Button
                      key={option}
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-start text-white hover:bg-white/10 text-xs sm:text-sm ${
                        limit === option ? 'bg-white/10' : ''
                      }`}
                      onClick={() => setLimit(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Rankings List */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-cyan-500/10 blur-3xl rounded-2xl"></div>
            
            <div className="relative p-0 sm:p-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-[300px] sm:h-[400px]">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-spin text-primary" />
                </div>
              ) : rankings.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {rankings.map((alert, index) => (
                    <div
                      key={alert.alert_id}
                      className="glass-card p-4 sm:p-5 lg:p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 rounded-xl"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Left side: Position and Name */}
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] shrink-0">
                            #{index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white truncate">
                              {alert.alert_name}
                            </h3>
                          </div>
                        </div>
                        
                        {/* Right side: Stats */}
                        <div className="flex gap-4 sm:gap-6 lg:gap-8 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-center sm:text-right">
                            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                              {alert.total_mentions.toLocaleString()}
                            </p>
                            <p className="text-xs sm:text-sm text-white/70">Menciones</p>
                          </div>
                          <div className="text-center sm:text-right">
                            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                              {alert.total_reach.toLocaleString()}
                            </p>
                            <p className="text-xs sm:text-sm text-white/70">Alcance</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center items-center h-[300px] sm:h-[400px] text-sm sm:text-base text-white/70">
                  No hay datos disponibles para el rango seleccionado
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingAlertas;
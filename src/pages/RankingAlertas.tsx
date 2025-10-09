import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Sidebar from '@/components/Sidebar';
import { LogOut, Loader2, CalendarIcon, ArrowLeft } from 'lucide-react';
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
    { value: 'mentions' as const, label: 'Menciones' },
    { value: 'reach' as const, label: 'Alcance' }
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
    <div className="min-h-screen max-h-screen overflow-hidden flex">
      <SoftMathBackground />
      <Sidebar />
      
      <div className="flex-1 p-6 overflow-y-auto relative z-10">
        <div className="max-w-7xl mx-auto space-y-6">
        <Header/>

          {/* Title with back button */}
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/rankings')}
              variant="outline"
              className="glass-effect border-white/10 hover:bg-white/10 text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Ranking de Alertas</h1>
              <p className="text-white/70">Top de alertas ordenadas por menciones o alcance</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-center flex-wrap">
            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="glass-effect border-white/10 hover:bg-white/10 text-white"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from && dateRange.to ? (
                    `${format(dateRange.from, 'dd MMM yyyy', { locale: es })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: es })}`
                  ) : (
                    'Seleccionar fechas'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 glass-card border-white/10" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                  locale={es}
                  fromYear={1960}
                  toYear={2030}
                />
              </PopoverContent>
            </Popover>

            {/* Order By Selector */}
            <div className="flex gap-2">
              {orderOptions.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => setOrderBy(option.value)}
                  className={`transition-all duration-300 ${
                    orderBy === option.value
                      ? 'bg-primary/20 border border-cyan-300/60 shadow-xl shadow-cyan-400/30 scale-105 hover:bg-primary/20 text-white'
                      : 'glass-effect border-white/10 hover:bg-white/10 text-white'
                  }`}
                  variant={orderBy === option.value ? 'default' : 'outline'}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            {/* Limit Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="glass-effect border-white/10 hover:bg-white/10 text-white"
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
                      className={`w-full justify-start text-white hover:bg-white/10 ${
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

          {/* Rankings Table */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-cyan-500/10 blur-3xl"></div>
            
            <div className="relative p-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-96">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : rankings.length > 0 ? (
                <div className="space-y-3">
                  {rankings.map((alert, index) => (
                    <div
                      key={alert.alert_id}
                      className="glass-card p-6 border border-white/10 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-4xl font-bold text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
                            #{index + 1}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">{alert.alert_name}</h3>
                          </div>
                        </div>
                        <div className="flex gap-8 text-right">
                          <div>
                            <p className="text-2xl font-bold text-white">
                              {alert.total_mentions.toLocaleString()}
                            </p>
                            <p className="text-sm text-white/70">Menciones</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">
                              {alert.total_reach.toLocaleString()}
                            </p>
                            <p className="text-sm text-white/70">Alcance</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center items-center h-96 text-white/70">
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
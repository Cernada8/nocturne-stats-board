import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Sidebar from '@/components/Sidebar';
import { Loader2, Calendar as CalendarIcon, BookOpen, TrendingUp, Users, Hash, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ResponsiveContainer, Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import SoftMathBackground from '@/components/SoftMathBackground';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';

interface ReachData {
  date: string | number;
  reach: number;
}

interface Alert {
  id: string;
  name: string;
}

interface AuthorData {
  author: string;
  author_url: string;
  mentions: number;
  total_reach: number;
  avg_reach: number;
  audience_avg: number;
}

interface KeywordData {
  keyword: string;
  mentions: number;
  total_reach: number;
  avg_reach: number;
}

const Alcance = () => {
  const { userEmail, companyId, setCompanyId } = useAuth();
  const navigate = useNavigate();
  const [reachData, setReachData] = useState<ReachData[]>([]);
  const [authorsData, setAuthorsData] = useState<AuthorData[]>([]);
  const [keywordsData, setKeywordsData] = useState<KeywordData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2020, 0, 1),
    to: new Date()
  });
  const [interval, setInterval] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [driverLimit, setDriverLimit] = useState(10);
  const [driverWeight, setDriverWeight] = useState<'reach' | 'mentions'>('reach');

  const intervals = [
    { value: 'day' as const, label: 'Diario', shortLabel: 'D' },
    { value: 'week' as const, label: 'Semanal', shortLabel: 'S' },
    { value: 'month' as const, label: 'Mensual', shortLabel: 'M' },
    { value: 'year' as const, label: 'Anual', shortLabel: 'A' }
  ];

  const weightOptions = [
    { value: 'reach' as const, label: 'Alcance' },
    { value: 'mentions' as const, label: 'Menciones' }
  ];

  const limitOptions = [5, 10, 15, 20, 30, 50];

  useEffect(() => {
    if (userEmail && !companyId) {
      fetchCompanyId();
    }
  }, [userEmail, companyId]);

  useEffect(() => {
    if (companyId && dateRange.from && dateRange.to) {
      fetchReachData();
    }
  }, [companyId, interval, dateRange, selectedAlertId]);

  useEffect(() => {
    if (companyId && dateRange.from && dateRange.to) {
      fetchDriversData();
    }
  }, [companyId, dateRange, selectedAlertId, driverLimit, driverWeight]);

  useEffect(() => {
    if (companyId) {
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

  const fetchReachData = async () => {
    if (!companyId || !dateRange.from || !dateRange.to) return;
    
    setIsLoading(true);
    try {
      const fromStr = format(dateRange.from, 'yyyy-MM-dd');
      const toStr = format(dateRange.to, 'yyyy-MM-dd');
      
      let endpoint = `/api/stats/reach/evolution?company_id=${companyId}&interval=${interval}&from=${fromStr}&to=${toStr}`;
      
      if (selectedAlertId) {
        endpoint += `&alert_id=${selectedAlertId}`;
      }
      
      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error('Error al obtener datos de alcance');
      
      const result = await response.json();
      setReachData(result.data.evolution);
    } catch (error) {
      toast.error('Error al cargar datos de alcance');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDriversData = async () => {
    if (!companyId || !dateRange.from || !dateRange.to) return;
    
    setIsLoadingDrivers(true);
    try {
      const fromStr = format(dateRange.from, 'yyyy-MM-dd');
      const toStr = format(dateRange.to, 'yyyy-MM-dd');
      
      let endpoint = `/api/insights/engagement_drivers?company_id=${companyId}&from=${fromStr}&to=${toStr}&mode=both&limit=${driverLimit}&weight=${driverWeight}`;
      
      if (selectedAlertId) {
        endpoint += `&alert_id=${selectedAlertId}`;
      }
      
      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error('Error al obtener drivers de engagement');
      
      const result = await response.json();
      
      setAuthorsData(result.data.drivers.authors || []);
      setKeywordsData(result.data.drivers.keywords || []);
    } catch (error) {
      toast.error('Error al cargar drivers de engagement');
      console.error(error);
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  const fetchAlerts = async () => {
    if (!companyId) return;
    
    try {
      const response = await apiFetch(`/api/info/getAlerts?company_id=${companyId}`);
      if (!response.ok) throw new Error('Error al obtener alertas');
      
      const result = await response.json();
      setAlerts(result.data.alerts || []);
    } catch (error) {
      toast.error('Error al cargar alertas');
      console.error(error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatXAxis = (value: string | number) => {
    if (interval === 'year') return value.toString();
    if (interval === 'week') return value.toString();
    if (interval === 'month') {
      const [year, month] = value.toString().split('-');
      return `${month}/${year}`;
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 sm:p-4 border border-cyan-300/30 shadow-xl shadow-cyan-400/20">
          <p className="text-xs sm:text-sm text-white/70">{payload[0].payload.date}</p>
          <p className="text-base sm:text-lg font-bold text-white">
            Alcance: {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  const BarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card p-3 sm:p-4 border border-cyan-300/30 shadow-xl shadow-cyan-400/20">
          <p className="text-cyan-300 font-bold mb-2 text-sm sm:text-base">{data.author || data.keyword}</p>
          <p className="text-white text-xs sm:text-sm">
            Alcance: <span className="font-bold text-cyan-400">{data.total_reach.toLocaleString()}</span>
          </p>
          <p className="text-white/70 text-xs mt-1">
            Menciones: {data.mentions}
          </p>
        </div>
      );
    }
    return null;
  };

  const gradientColors = [
    '#22d3ee', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316',
    '#22c55e', '#eab308', '#f43f5e', '#a855f7', '#0ea5e9'
  ];

  const shouldShowDots = reachData.length <= 30;

  return (
    <div className="min-h-screen max-h-screen overflow-hidden flex">
      <SoftMathBackground />
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-slate-900/50 hover:scrollbar-thumb-slate-600/70">
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          <Header />

          {/* Title with Back Button - Responsive */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              onClick={() => navigate('/estadisticas')}
              variant="outline"
              size="icon"
              className="glass-effect border-white/10 hover:bg-white/10 text-white h-8 w-8 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">
                Análisis de Alcance
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-white/70">
                Dashboard completo de métricas y engagement
              </p>
            </div>
          </div>

          {/* Filters - Responsive */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="glass-effect border-white/10 hover:bg-white/10 text-white w-full sm:w-[240px] justify-between text-sm"
                >
                  <span className="truncate">
                    {selectedAlertId 
                      ? alerts.find(a => a.id === selectedAlertId)?.name 
                      : "Todos los tópicos"}
                  </span>
                  <BookOpen className="ml-2 h-4 w-4 flex-shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[240px] p-2 glass-card border-white/10" align="start">
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-white hover:bg-white/10 text-sm ${
                      !selectedAlertId ? 'bg-white/10' : ''
                    }`}
                    onClick={() => setSelectedAlertId(null)}
                  >
                    Todos los tópicos
                  </Button>
                  {alerts.map((alert) => (
                    <Button
                      key={alert.id}
                      variant="ghost"
                      className={`w-full justify-start text-white hover:bg-white/10 text-sm ${
                        selectedAlertId === alert.id ? 'bg-white/10' : ''
                      }`}
                      onClick={() => setSelectedAlertId(alert.id)}
                    >
                      <span className="truncate">{alert.name}</span>
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="glass-effect border-white/10 hover:bg-white/10 text-white w-full sm:w-auto text-sm"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
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
                  numberOfMonths={typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 2}
                  locale={es}
                  fromYear={1960}
                  toYear={2030}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Evolution Chart - Responsive */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-cyan-500/10 blur-3xl rounded-2xl"></div>
            
            <div className="relative p-3 sm:p-4 lg:p-6 glass-effect rounded-xl sm:rounded-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 glass-effect rounded-xl">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                      Evolución del Alcance
                    </h2>
                    <p className="text-white/70 text-xs sm:text-sm">
                      Análisis temporal de menciones
                    </p>
                  </div>
                </div>

                {/* Interval Selector - Responsive */}
                <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
                  {intervals.map((int) => (
                    <Button
                      key={int.value}
                      onClick={() => setInterval(int.value)}
                      className={`transition-all duration-300 flex-1 sm:flex-initial text-xs sm:text-sm ${
                        interval === int.value
                          ? 'bg-primary/20 border border-cyan-300/60 shadow-xl shadow-cyan-400/30 scale-105 hover:bg-primary/20 text-white'
                          : 'glass-effect border-white/10 hover:bg-white/10 text-white'
                      }`}
                      variant={interval === int.value ? 'default' : 'outline'}
                      size="sm"
                    >
                      <span className="sm:hidden">{int.shortLabel}</span>
                      <span className="hidden sm:inline">{int.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-[300px] sm:h-[350px] lg:h-[400px]">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-spin text-primary" />
                </div>
              ) : reachData.length > 0 ? (
                <ResponsiveContainer width="100%" height={typeof window !== 'undefined' && window.innerWidth < 640 ? 300 : window.innerWidth < 1024 ? 350 : 400}>
                  <AreaChart data={reachData} margin={{ top: 20, right: 10, left: 0, bottom: 40 }}>
                    <defs>
                      <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.15)" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatXAxis}
                      stroke="rgba(255,255,255,0.9)"
                      style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '10px' : '12px', fontWeight: 600, fill: '#ffffff' }}
                      height={60}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis 
                      tickFormatter={(value) => formatNumber(value)}
                      stroke="rgba(255,255,255,0.9)"
                      style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '10px' : '12px', fontWeight: 600, fill: '#ffffff' }}
                      width={typeof window !== 'undefined' && window.innerWidth < 640 ? 50 : 70}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="reach" 
                      stroke="#22d3ee" 
                      strokeWidth={typeof window !== 'undefined' && window.innerWidth < 640 ? 2 : 3}
                      fill="url(#colorReach)"
                      filter="url(#glow)"
                      dot={shouldShowDots ? { fill: '#22d3ee', strokeWidth: 2, r: typeof window !== 'undefined' && window.innerWidth < 640 ? 3 : 4 } : false}
                      activeDot={{ r: typeof window !== 'undefined' && window.innerWidth < 640 ? 5 : 6, fill: '#22d3ee', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-[300px] sm:h-[350px] lg:h-[400px] text-white/70 text-sm">
                  No hay datos disponibles para el rango seleccionado
                </div>
              )}
            </div>
          </div>

          {/* Drivers Grid - Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Top Authors */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10 blur-3xl rounded-2xl"></div>
              
              <div className="relative p-3 sm:p-4 lg:p-6 glass-effect rounded-xl sm:rounded-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 glass-effect rounded-xl">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Top Autores</h2>
                      <p className="text-white/70 text-xs sm:text-sm">Por alcance total generado</p>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center w-full sm:w-auto">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="glass-effect border-white/10 hover:bg-white/10 text-white flex-1 sm:flex-initial text-xs sm:text-sm"
                        >
                          {weightOptions.find(w => w.value === driverWeight)?.label}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[160px] p-2 glass-card border-white/10">
                        <div className="space-y-1">
                          {weightOptions.map((option) => (
                            <Button
                              key={option.value}
                              variant="ghost"
                              size="sm"
                              className={`w-full justify-start text-white hover:bg-white/10 text-sm ${
                                driverWeight === option.value ? 'bg-white/10' : ''
                              }`}
                              onClick={() => setDriverWeight(option.value)}
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="glass-effect border-white/10 hover:bg-white/10 text-white flex-1 sm:flex-initial text-xs sm:text-sm"
                        >
                          Top {driverLimit}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[120px] p-2 glass-card border-white/10">
                        <div className="space-y-1">
                          {limitOptions.map((limit) => (
                            <Button
                              key={limit}
                              variant="ghost"
                              size="sm"
                              className={`w-full justify-start text-white hover:bg-white/10 text-sm ${
                                driverLimit === limit ? 'bg-white/10' : ''
                              }`}
                              onClick={() => setDriverLimit(limit)}
                            >
                              Top {limit}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {isLoadingDrivers ? (
                  <div className="flex justify-center items-center h-[350px] sm:h-[400px] lg:h-[500px]">
                    <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-spin text-blue-400" />
                  </div>
                ) : authorsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={typeof window !== 'undefined' && window.innerWidth < 640 ? 350 : window.innerWidth < 1024 ? 400 : 500}>
                    <BarChart 
                      data={authorsData} 
                      layout="vertical" 
                      margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis 
                        type="number" 
                        tickFormatter={formatNumber}
                        stroke="rgba(255,255,255,0.9)"
                        style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '10px' : '11px', fontWeight: 600 }}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="author" 
                        width={typeof window !== 'undefined' && window.innerWidth < 640 ? 80 : 110}
                        stroke="rgba(255,255,255,0.9)"
                        style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '9px' : '10px', fontWeight: 500 }}
                      />
                      <Tooltip content={<BarTooltip />} />
                      <Bar 
                        dataKey="total_reach" 
                        radius={[0, 8, 8, 0]}
                      >
                        {authorsData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={gradientColors[index % gradientColors.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-[350px] sm:h-[400px] lg:h-[500px] text-white/70 text-sm">
                    No hay datos de autores disponibles
                  </div>
                )}
              </div>
            </div>

            {/* Top Keywords */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10 blur-3xl rounded-2xl"></div>
              
              <div className="relative p-3 sm:p-4 lg:p-6 glass-effect rounded-xl sm:rounded-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 glass-effect rounded-xl">
                      <Hash className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Top Keywords</h2>
                      <p className="text-white/70 text-xs sm:text-sm">Palabras clave más relevantes</p>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center w-full sm:w-auto">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="glass-effect border-white/10 hover:bg-white/10 text-white flex-1 sm:flex-initial text-xs sm:text-sm"
                        >
                          {weightOptions.find(w => w.value === driverWeight)?.label}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[160px] p-2 glass-card border-white/10">
                        <div className="space-y-1">
                          {weightOptions.map((option) => (
                            <Button
                              key={option.value}
                              variant="ghost"
                              size="sm"
                              className={`w-full justify-start text-white hover:bg-white/10 text-sm ${
                                driverWeight === option.value ? 'bg-white/10' : ''
                              }`}
                              onClick={() => setDriverWeight(option.value)}
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="glass-effect border-white/10 hover:bg-white/10 text-white flex-1 sm:flex-initial text-xs sm:text-sm"
                        >
                          Top {driverLimit}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[120px] p-2 glass-card border-white/10">
                        <div className="space-y-1">
                          {limitOptions.map((limit) => (
                            <Button
                              key={limit}
                              variant="ghost"
                              size="sm"
                              className={`w-full justify-start text-white hover:bg-white/10 text-sm ${
                                driverLimit === limit ? 'bg-white/10' : ''
                              }`}
                              onClick={() => setDriverLimit(limit)}
                            >
                              Top {limit}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {isLoadingDrivers ? (
                  <div className="flex justify-center items-center h-[350px] sm:h-[400px] lg:h-[500px]">
                    <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-spin text-purple-400" />
                  </div>
                ) : keywordsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={typeof window !== 'undefined' && window.innerWidth < 640 ? 350 : window.innerWidth < 1024 ? 400 : 500}>
                    <BarChart 
                      data={keywordsData} 
                      layout="vertical" 
                      margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis 
                        type="number" 
                        tickFormatter={formatNumber}
                        stroke="rgba(255,255,255,0.9)"
                        style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '10px' : '11px', fontWeight: 600 }}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="keyword" 
                        width={typeof window !== 'undefined' && window.innerWidth < 640 ? 80 : 110}
                        stroke="rgba(255,255,255,0.9)"
                        style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '9px' : '10px', fontWeight: 500 }}
                      />
                      <Tooltip content={<BarTooltip />} />
                      <Bar 
                        dataKey="total_reach" 
                        radius={[0, 8, 8, 0]}
                      >
                        {keywordsData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={gradientColors[index % gradientColors.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-[350px] sm:h-[400px] lg:h-[500px] text-white/70 text-sm">
                    No hay datos de keywords disponibles
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alcance;
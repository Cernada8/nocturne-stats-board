import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Sidebar from '@/components/Sidebar';
import {
  Loader2,
  Calendar as CalendarIcon,
  BookOpen,
  Globe,
  ArrowLeft,
  TrendingUp,
  Award
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import SoftMathBackground from '@/components/SoftMathBackground';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';

interface Alert {
  id: string;
  name: string;
}

interface SourceDistribution {
  source: string;
  mentions: number;
  percentage: number;
}

interface TrendItem {
  date: string;
  source: string;
  mentions: number;
}

interface RankingItem {
  source: string;
  total_mentions: number;
  total_reach: number;
}

const Fuentes = () => {
  const { userEmail, companyId, setCompanyId } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2025, 0, 1),
    to: new Date()
  });

  const [distribution, setDistribution] = useState<SourceDistribution[]>([]);
  const [trendData, setTrendData] = useState<TrendItem[]>([]);
  const [rankingData, setRankingData] = useState<RankingItem[]>([]);
  const [totalMentions, setTotalMentions] = useState(0);

  const [isLoadingDistribution, setIsLoadingDistribution] = useState(false);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);

  const [interval, setInterval] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [rankingLimit, setRankingLimit] = useState(5);
  const [rankingOrderBy, setRankingOrderBy] = useState<'mentions' | 'reach'>('reach');

  const intervals = [
    { value: 'day' as const, label: 'Diario', shortLabel: 'D' },
    { value: 'week' as const, label: 'Semanal', shortLabel: 'S' },
    { value: 'month' as const, label: 'Mensual', shortLabel: 'M' },
    { value: 'year' as const, label: 'Anual', shortLabel: 'A' }
  ];

  const limitOptions = [5, 10, 15, 20];

  const orderByOptions = [
    { value: 'mentions' as const, label: 'Menciones' },
    { value: 'reach' as const, label: 'Alcance' }
  ];

  const sourceLabels: { [key: string]: string } = {
    'news-blogs': 'Noticias y Blogs',
    'youtube': 'YouTube',
    'web': 'Web',
    'reddit': 'Reddit',
    'vimeo': 'Vimeo',
    'twitter': 'Twitter/X',
    'instagram': 'Instagram',
    'facebook': 'Facebook'
  };

  const sourceColors: { [key: string]: string } = {
    'news-blogs': '#3b82f6',
    'youtube': '#ef4444',
    'web': '#8b5cf6',
    'reddit': '#f97316',
    'vimeo': '#06b6d4',
    'twitter': '#0ea5e9',
    'instagram': '#ec4899',
    'facebook': '#6366f1'
  };

  // Función para navegar a lista de menciones con filtro de fuente
  const handleSourceClick = (source: string) => {
    const params = new URLSearchParams();
    params.set('source', source);
    
    if (selectedAlertId) {
      params.set('alert_id', selectedAlertId);
    }
    
    if (dateRange.from) {
      params.set('date_from', format(dateRange.from, 'yyyy-MM-dd'));
    }
    
    if (dateRange.to) {
      params.set('date_to', format(dateRange.to, 'yyyy-MM-dd'));
    }
    
    navigate(`/lista-menciones?${params.toString()}`);
  };

  useEffect(() => {
    if (userEmail && !companyId) {
      fetchCompanyId();
    }
  }, [userEmail, companyId]);

  useEffect(() => {
    if (companyId) {
      fetchAlerts();
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId && dateRange.from && dateRange.to) {
      fetchDistribution();
      fetchRanking();
    }
  }, [companyId, dateRange, selectedAlertId, rankingLimit, rankingOrderBy]);

  useEffect(() => {
    if (companyId && dateRange.from && dateRange.to) {
      fetchTrend();
    }
  }, [companyId, dateRange, selectedAlertId, interval]);

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

  const fetchDistribution = async () => {
    if (!companyId || !dateRange.from || !dateRange.to) return;

    setIsLoadingDistribution(true);
    try {
      const fromStr = format(dateRange.from, 'yyyy-MM-dd');
      const toStr = format(dateRange.to, 'yyyy-MM-dd');

      let endpoint = `/api/stats/source/distribution?company_id=${companyId}&from=${fromStr}&to=${toStr}`;
      if (selectedAlertId) endpoint += `&alert_id=${selectedAlertId}`;

      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error('Error al obtener distribución');

      const result = await response.json();
      setDistribution(result.data.sources || []);
      setTotalMentions(result.data.total_mentions || 0);
    } catch (error) {
      toast.error('Error al cargar distribución de fuentes');
      console.error(error);
    } finally {
      setIsLoadingDistribution(false);
    }
  };

  const fetchTrend = async () => {
    if (!companyId || !dateRange.from || !dateRange.to) return;

    setIsLoadingTrend(true);
    try {
      const fromStr = format(dateRange.from, 'yyyy-MM-dd');
      const toStr = format(dateRange.to, 'yyyy-MM-dd');

      let endpoint = `/api/stats/source/trend?company_id=${companyId}&interval=${interval}&from=${fromStr}&to=${toStr}`;
      if (selectedAlertId) endpoint += `&alert_id=${selectedAlertId}`;

      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error('Error al obtener tendencia');

      const result = await response.json();
      setTrendData(result.data.trend || []);
    } catch (error) {
      toast.error('Error al cargar tendencia de fuentes');
      console.error(error);
    } finally {
      setIsLoadingTrend(false);
    }
  };

  const fetchRanking = async () => {
    if (!companyId || !dateRange.from || !dateRange.to) return;

    setIsLoadingRanking(true);
    try {
      const fromStr = format(dateRange.from, 'yyyy-MM-dd');
      const toStr = format(dateRange.to, 'yyyy-MM-dd');

      let endpoint = `/api/stats/source/top_sources?company_id=${companyId}&from=${fromStr}&to=${toStr}&limit=${rankingLimit}&order_by=${rankingOrderBy}`;
      if (selectedAlertId) endpoint += `&alert_id=${selectedAlertId}`;

      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error('Error al obtener ranking');

      const result = await response.json();
      setRankingData(result.data.sources || []);
    } catch (error) {
      toast.error('Error al cargar ranking de fuentes');
      console.error(error);
    } finally {
      setIsLoadingRanking(false);
    }
  };

  const formatXAxis = (value: string) => {
    if (interval === 'year') return value.toString();
    if (interval === 'week') return value.toString();
    if (interval === 'month') {
      const [year, month] = value.toString().split('-');
      return `${month}/${year}`;
    }
    return value.toString();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTrendChartData = () => {
    const groupedByDate: { [key: string]: any } = {};

    trendData.forEach(item => {
      if (!groupedByDate[item.date]) {
        groupedByDate[item.date] = { date: item.date };
      }
      groupedByDate[item.date][item.source] = item.mentions;
    });

    return Object.values(groupedByDate);
  };

  const trendChartData = getTrendChartData();
  const uniqueSources = [...new Set(trendData.map(item => item.source))];

  const radarChartData = distribution.map(item => ({
    source: sourceLabels[item.source] || item.source,
    sourceKey: item.source,
    value: item.percentage,
    mentions: item.mentions
  }));

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="glass-card p-3 sm:p-4 border border-cyan-300/30 shadow-xl shadow-cyan-400/20">
          <p className="text-cyan-300 font-bold mb-1 sm:mb-2 text-xs sm:text-sm">
            {sourceLabels[data.name] || data.name}
          </p>
          <p className="text-white text-xs sm:text-sm">
            Menciones: <span className="font-bold text-cyan-400">{data.value.toLocaleString()}</span>
          </p>
          <p className="text-white/70 text-xs mt-1">
            {data.payload.percentage.toFixed(1)}% del total
          </p>
          <p className="text-cyan-400/70 text-xs mt-2 italic">
            Click para ver menciones
          </p>
        </div>
      );
    }
    return null;
  };

  const LineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 sm:p-4 border border-cyan-300/30 shadow-xl shadow-cyan-400/20">
          <p className="text-white font-bold mb-1 sm:mb-2 text-xs sm:text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs sm:text-sm" style={{ color: entry.color }}>
              {sourceLabels[entry.name] || entry.name}: {entry.value}
            </p>
          ))}
          <p className="text-cyan-400/70 text-xs mt-2 italic">
            Click para ver menciones
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
          <p className="text-cyan-300 font-bold mb-1 sm:mb-2 text-xs sm:text-sm">
            {sourceLabels[data.source] || data.source}
          </p>
          <p className="text-white text-xs sm:text-sm">
            Menciones: <span className="font-bold text-cyan-400">{data.total_mentions.toLocaleString()}</span>
          </p>
          <p className="text-white text-xs sm:text-sm">
            Alcance: <span className="font-bold text-purple-400">{data.total_reach.toLocaleString()}</span>
          </p>
          <p className="text-cyan-400/70 text-xs mt-2 italic">
            Click para ver menciones
          </p>
        </div>
      );
    }
    return null;
  };

  const shouldShowDots = trendChartData.length <= 30;

  return (
    <div className="min-h-screen max-h-screen overflow-hidden flex flex-col lg:flex-row">
      <SoftMathBackground />
      <Sidebar />

      <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-slate-900/50 hover:scrollbar-thumb-slate-600/70">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          <Header />

          {/* Title with Back Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <Button
              onClick={() => navigate('/estadisticas')}
              variant="outline"
              className="glass-effect border-white/10 hover:bg-white/10 text-white shrink-0"
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">
                Análisis por Fuentes
              </h1>
              <p className="text-sm sm:text-base text-white/70">
                Distribución y evolución de menciones por plataforma
              </p>
            </div>
          </div>

          {/* Filters */}
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
                      : "Todos los temas"}
                  </span>
                  <BookOpen className="ml-2 h-4 w-4 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[240px] p-2 glass-card border-white/10" align="start">
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-white hover:bg-white/10 text-sm ${!selectedAlertId ? 'bg-white/10' : ''
                      }`}
                    onClick={() => setSelectedAlertId(null)}
                  >
                    Todos los temas
                  </Button>
                  {alerts.map((alert) => (
                    <Button
                      key={alert.id}
                      variant="ghost"
                      className={`w-full justify-start text-white hover:bg-white/10 text-sm ${selectedAlertId === alert.id ? 'bg-white/10' : ''
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
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {dateRange.from && dateRange.to ? (
                      <>
                        <span className="hidden sm:inline">
                          {format(dateRange.from, 'dd MMM yyyy', { locale: es })} - {format(dateRange.to, 'dd MMM yyyy', { locale: es })}
                        </span>
                        <span className="sm:hidden">
                          {format(dateRange.from, 'dd/MM/yy', { locale: es })} - {format(dateRange.to, 'dd/MM/yy', { locale: es })}
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
                  showPredefinedPeriods={true}
                  onPredefinedPeriodSelect={(range) => setDateRange(range)}
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
                  showPredefinedPeriods={true}
                  onPredefinedPeriodSelect={(range) => setDateRange(range)}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Graph 1: Distribution */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 blur-3xl rounded-3xl"></div>

            <div className="relative p-4 sm:p-6 lg:p-8 glass-effect rounded-2xl lg:rounded-3xl border-2 border-white/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="p-3 sm:p-4 glass-effect rounded-xl shrink-0">
                  <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    Distribución por Fuente
                  </h2>
                  <p className="text-sm sm:text-base lg:text-lg text-white/70">
                    Análisis comparativo de menciones
                  </p>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <p className="text-white/70 text-xs sm:text-sm">Total de menciones</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-cyan-400">
                    {totalMentions.toLocaleString()}
                  </p>
                </div>
              </div>

              {isLoadingDistribution ? (
                <div className="flex justify-center items-center h-[300px] sm:h-[400px] lg:h-[500px]">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-spin text-purple-400" />
                </div>
              ) : distribution.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {/* Radar Chart */}
                  <div className="h-[300px] sm:h-[350px] lg:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarChartData}>
                        <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
                        <PolarAngleAxis
                          dataKey="source"
                          tick={{ fill: '#ffffff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                          className="sm:text-xs"
                          onClick={(data) => {
                            if (data && data.value) {
                              const item = radarChartData.find(d => d.source === data.value);
                              if (item) handleSourceClick(item.sourceKey);
                            }
                          }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 100]}
                          tick={{ fill: '#ffffff', fontSize: 9 }}
                        />
                        <Radar
                          name="Porcentaje"
                          dataKey="value"
                          stroke="#a855f7"
                          fill="#a855f7"
                          fillOpacity={0.6}
                          onClick={(data) => data && handleSourceClick(data.sourceKey)}
                          style={{ cursor: 'pointer' }}
                        />
                        <Tooltip content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="glass-card p-3 sm:p-4 border border-purple-300/30 shadow-xl">
                                <p className="text-purple-300 font-bold mb-1 sm:mb-2 text-xs sm:text-sm">
                                  {data.source}
                                </p>
                                <p className="text-white text-xs sm:text-sm">
                                  Porcentaje: <span className="font-bold text-purple-400">{data.value.toFixed(1)}%</span>
                                </p>
                                <p className="text-white/70 text-xs mt-1">
                                  {data.mentions.toLocaleString()} menciones
                                </p>
                                <p className="text-purple-400/70 text-xs mt-2 italic">
                                  Click para ver menciones
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pie Chart */}
                  <div className="h-[300px] sm:h-[350px] lg:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius="70%"
                          dataKey="mentions"
                          label={({ source, percentage }) =>
                            `${(sourceLabels[source] || source).substring(0, 10)}: ${percentage.toFixed(1)}%`
                          }
                          style={{ fontSize: '10px', cursor: 'pointer' }}
                          className="sm:text-xs"
                          onClick={(data) => data && handleSourceClick(data.source)}
                        >
                          {distribution.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={sourceColors[entry.source] || `hsl(${index * 45}, 70%, 50%)`}
                              style={{ cursor: 'pointer' }}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center h-[300px] sm:h-[400px] lg:h-[500px] text-sm sm:text-base text-white/70">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>

          {/* Graph 2: Trend Line Chart */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 blur-3xl rounded-3xl"></div>

            <div className="relative p-4 sm:p-6 lg:p-8 glass-effect rounded-2xl lg:rounded-3xl border-2 border-white/20">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 sm:p-4 glass-effect rounded-xl shrink-0">
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                      Evolución Temporal
                    </h2>
                    <p className="text-sm sm:text-base lg:text-lg text-white/70">
                      Tendencia de menciones por fuente
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 w-full lg:w-auto">
                  {intervals.map((int) => (
                    <Button
                      key={int.value}
                      onClick={() => setInterval(int.value)}
                      size="sm"
                      className={`flex-1 sm:flex-none transition-all duration-300 text-xs sm:text-sm ${interval === int.value
                          ? 'bg-primary/20 border border-cyan-300/60 shadow-xl shadow-cyan-400/30 scale-105 hover:bg-primary/20 text-white'
                          : 'glass-effect border-white/10 hover:bg-white/10 text-white'
                        }`}
                      variant={interval === int.value ? 'default' : 'outline'}
                    >
                      <span className="sm:hidden">{int.shortLabel}</span>
                      <span className="hidden sm:inline">{int.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {isLoadingTrend ? (
                <div className="flex justify-center items-center h-[300px] sm:h-[400px] lg:h-[500px]">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-spin text-cyan-400" />
                </div>
              ) : trendChartData.length > 0 ? (
                <div className="h-[350px] sm:h-[450px] lg:h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trendChartData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 60
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatXAxis}
                        stroke="rgba(255,255,255,0.9)"
                        style={{ fontSize: '10px', fontWeight: 600 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        className="sm:text-xs"
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.9)"
                        style={{ fontSize: '10px', fontWeight: 600 }}
                        className="sm:text-xs"
                      />
                      <Tooltip content={<LineTooltip />} />
                      <Legend
                        wrapperStyle={{ paddingTop: '10px', fontSize: '11px', cursor: 'pointer' }}
                        formatter={(value) => sourceLabels[value] || value}
                        className="sm:text-xs"
                        onClick={(data) => data && data.value && handleSourceClick(data.value)}
                      />
                      {uniqueSources.map((source, index) => (
                        <Line
                          key={source}
                          type="monotone"
                          dataKey={source}
                          stroke={sourceColors[source] || `hsl(${index * 45}, 70%, 50%)`}
                          strokeWidth={2}
                          dot={shouldShowDots ? { r: 3, cursor: 'pointer' } : false}
                          activeDot={{ r: 5, cursor: 'pointer' }}
                          className="sm:stroke-[3]"
                          onClick={() => handleSourceClick(source)}
                          style={{ cursor: 'pointer' }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex justify-center items-center h-[300px] sm:h-[400px] lg:h-[500px] text-sm sm:text-base text-white/70">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>

          {/* Graph 3: Ranking Bar Chart */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-purple-500/10 blur-3xl rounded-3xl"></div>

            <div className="relative p-4 sm:p-6 lg:p-8 glass-effect rounded-2xl lg:rounded-3xl border-2 border-white/20">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 sm:p-4 glass-effect rounded-xl shrink-0">
                    <Award className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                      Ranking de Fuentes
                    </h2>
                    <p className="text-sm sm:text-base lg:text-lg text-white/70">
                      Top fuentes por impacto
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 items-center w-full lg:w-auto">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="glass-effect border-white/10 hover:bg-white/10 text-white flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        <span className="truncate">
                          {orderByOptions.find(o => o.value === rankingOrderBy)?.label}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[160px] p-2 glass-card border-white/10">
                      <div className="space-y-1">
                        {orderByOptions.map((option) => (
                          <Button
                            key={option.value}
                            variant="ghost"
                            size="sm"
                            className={`w-full justify-start text-white hover:bg-white/10 text-xs sm:text-sm ${rankingOrderBy === option.value ? 'bg-white/10' : ''
                              }`}
                            onClick={() => setRankingOrderBy(option.value)}
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
                        className="glass-effect border-white/10 hover:bg-white/10 text-white flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        Top {rankingLimit}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[120px] p-2 glass-card border-white/10">
                      <div className="space-y-1">
                        {limitOptions.map((limit) => (
                          <Button
                            key={limit}
                            variant="ghost"
                            size="sm"
                            className={`w-full justify-start text-white hover:bg-white/10 text-xs sm:text-sm ${rankingLimit === limit ? 'bg-white/10' : ''
                              }`}
                            onClick={() => setRankingLimit(limit)}
                          >
                            Top {limit}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {isLoadingRanking ? (
                <div className="flex justify-center items-center h-[300px] sm:h-[400px] lg:h-[500px]">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-spin text-orange-400" />
                </div>
              ) : rankingData.length > 0 ? (
                <>
                  <div className="h-[300px] sm:h-[350px] lg:h-[400px] mb-6 sm:mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={rankingData}
                        layout="horizontal"
                        margin={{ top: 10, right: 10, left: 0, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                        <XAxis
                          type="category"
                          dataKey="source"
                          tickFormatter={(value) => {
                            const label = sourceLabels[value] || value;
                            return label.length > 10 ? label.substring(0, 10) + '...' : label;
                          }}
                          stroke="rgba(255,255,255,0.9)"
                          style={{ fontSize: '10px', fontWeight: 600 }}
                          angle={-45}
                          textAnchor="end"
                          height={90}
                          className="sm:text-xs"
                        />
                        <YAxis
                          type="number"
                          tickFormatter={formatNumber}
                          stroke="rgba(255,255,255,0.9)"
                          style={{ fontSize: '10px', fontWeight: 600 }}
                          className="sm:text-xs"
                        />
                        <Tooltip content={<BarTooltip />} />
                        <Bar
                          dataKey={rankingOrderBy === 'reach' ? 'total_reach' : 'total_mentions'}
                          fill="#f97316"
                          radius={[8, 8, 0, 0]}
                          onClick={(data) => data && handleSourceClick(data.source)}
                          style={{ cursor: 'pointer' }}
                        >
                          {rankingData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={sourceColors[entry.source] || '#f97316'}
                              style={{ cursor: 'pointer' }}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Detailed Table */}
                  <div className="glass-effect rounded-xl lg:rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[500px]">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-white">
                              Pos
                            </th>
                            <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-white">
                              Fuente
                            </th>
                            <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-cyan-400">
                              Menciones
                            </th>
                            <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-purple-400">
                              Alcance
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {rankingData.map((item, index) => (
                            <tr 
                              key={index} 
                              className="hover:bg-white/5 transition-colors cursor-pointer"
                              onClick={() => handleSourceClick(item.source)}
                            >
                              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg"
                                    style={{
                                      backgroundColor: sourceColors[item.source] + '30',
                                      color: sourceColors[item.source]
                                    }}
                                  >
                                    {index + 1}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                                <span className="text-white font-medium text-xs sm:text-sm">
                                  {sourceLabels[item.source] || item.source}
                                </span>
                              </td>
                              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
                                <div className="text-cyan-400 font-bold text-sm sm:text-base lg:text-lg">
                                  {item.total_mentions.toLocaleString()}
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
                                <div className="text-purple-400 font-bold text-sm sm:text-base lg:text-lg">
                                  {formatNumber(item.total_reach)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex justify-center items-center h-[300px] sm:h-[400px] lg:h-[500px] text-sm sm:text-base text-white/70">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fuentes;
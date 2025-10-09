import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Sidebar from '@/components/Sidebar';
import { Loader2, CalendarIcon, BellIcon, TrendingUp, Smile, Meh, Frown, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ResponsiveContainer, Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import SoftMathBackground from '@/components/SoftMathBackground';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';

interface Alert {
  id: string;
  name: string;
}

interface SentimentDistribution {
  sentiment: string;
  mentions: number;
  percentage: number;
}

interface TrendData {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

interface ScoreData {
  score: {
    index: number;
    ratios: {
      positive_ratio: number;
      neutral_ratio: number;
      negative_ratio: number;
    };
  };
  totals: {
    positive: number;
    neutral: number;
    negative: number;
    total_mentions: number;
    total_reach: number;
  };
}

const Sentimiento = () => {
  const { userEmail, companyId, setCompanyId } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2020, 0, 1),
    to: new Date()
  });
  const [interval, setInterval] = useState<'day' | 'week' | 'month' | 'year'>('month');
  
  const [distribution, setDistribution] = useState<SentimentDistribution[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  
  const [isLoadingDistribution, setIsLoadingDistribution] = useState(false);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);
  const [isLoadingScore, setIsLoadingScore] = useState(false);

  const intervals = [
    { value: 'day' as const, label: 'Diario' },
    { value: 'week' as const, label: 'Semanal' },
    { value: 'month' as const, label: 'Mensual' },
    { value: 'year' as const, label: 'Anual' }
  ];

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
      fetchScore();
    }
  }, [companyId, dateRange, selectedAlertId]);

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
      
      let endpoint = `/api/stats/sentiment/distribution?company_id=${companyId}&from=${fromStr}&to=${toStr}`;
      if (selectedAlertId) endpoint += `&alert_id=${selectedAlertId}`;
      
      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error('Error al obtener distribución');
      
      const result = await response.json();
      setDistribution(result.data.sentiment_distribution);
    } catch (error) {
      toast.error('Error al cargar distribución de sentimiento');
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
      
      let endpoint = `/api/stats/sentiment/trend?company_id=${companyId}&interval=${interval}&from=${fromStr}&to=${toStr}`;
      if (selectedAlertId) endpoint += `&alert_id=${selectedAlertId}`;
      
      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error('Error al obtener tendencia');
      
      const result = await response.json();
      setTrendData(result.data.trend);
    } catch (error) {
      toast.error('Error al cargar tendencia de sentimiento');
      console.error(error);
    } finally {
      setIsLoadingTrend(false);
    }
  };

  const fetchScore = async () => {
    if (!companyId || !dateRange.from || !dateRange.to) return;
    
    setIsLoadingScore(true);
    try {
      const fromStr = format(dateRange.from, 'yyyy-MM-dd');
      const toStr = format(dateRange.to, 'yyyy-MM-dd');
      
      let endpoint = `/api/stats/sentiment/score?company_id=${companyId}&from=${fromStr}&to=${toStr}&weight=mentions`;
      if (selectedAlertId) endpoint += `&alert_id=${selectedAlertId}`;
      
      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error('Error al obtener score');
      
      const result = await response.json();
      setScoreData(result.data);
    } catch (error) {
      toast.error('Error al cargar score de sentimiento');
      console.error(error);
    } finally {
      setIsLoadingScore(false);
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-4 border border-cyan-300/30 shadow-xl shadow-cyan-400/20">
          <p className="text-sm text-white/70 mb-2">{payload[0].payload.date}</p>
          <p className="text-sm text-green-400">Positivo: {payload[0].payload.positive}</p>
          <p className="text-sm text-gray-400">Neutral: {payload[0].payload.neutral}</p>
          <p className="text-sm text-red-400">Negativo: {payload[0].payload.negative}</p>
        </div>
      );
    }
    return null;
  };

  const pieData = distribution.map(item => ({
    name: item.sentiment === 'positive' ? 'Positivo' : item.sentiment === 'neutral' ? 'Neutral' : 'Negativo',
    value: item.mentions,
    percentage: item.percentage
  }));

  const COLORS = {
    positive: '#22c55e',
    neutral: '#94a3b8',
    negative: '#ef4444'
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 70) return 'from-green-500/20 to-green-600/20';
    if (score >= 40) return 'from-yellow-500/20 to-yellow-600/20';
    return 'from-red-500/20 to-red-600/20';
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="glass-card p-4 border border-cyan-300/30 shadow-xl shadow-cyan-400/20">
          <p className="text-cyan-300 font-bold mb-2">{data.name}</p>
          <p className="text-white text-sm">
            Menciones: <span className="font-bold text-cyan-400">{data.value.toLocaleString()}</span>
          </p>
          <p className="text-white/70 text-xs mt-1">
            {data.payload.percentage.toFixed(1)}% del total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen max-h-screen overflow-hidden flex">
      <SoftMathBackground />
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-slate-900/50 hover:scrollbar-thumb-slate-600/70">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <Header />

          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Análisis de Sentimiento</h1>
            <p className="text-white/70">Dashboard completo de análisis emocional</p>
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-center flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="glass-effect border-white/10 hover:bg-white/10 text-white w-[240px] justify-between"
                >
                  {selectedAlertId 
                    ? alerts.find(a => a.id === selectedAlertId)?.name 
                    : "Todas las alertas"}
                  <BellIcon className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-2 glass-card border-white/10" align="start">
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-white hover:bg-white/10 ${
                      !selectedAlertId ? 'bg-white/10' : ''
                    }`}
                    onClick={() => setSelectedAlertId(null)}
                  >
                    Todas las alertas
                  </Button>
                  {alerts.map((alert) => (
                    <Button
                      key={alert.id}
                      variant="ghost"
                      className={`w-full justify-start text-white hover:bg-white/10 ${
                        selectedAlertId === alert.id ? 'bg-white/10' : ''
                      }`}
                      onClick={() => setSelectedAlertId(alert.id)}
                    >
                      {alert.name}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

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
          </div>

          {/* Score Card - DESTACADO */}
          <div className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${scoreData ? getScoreGradient(scoreData.score.index) : 'from-cyan-500/10 to-purple-500/10'} blur-3xl rounded-3xl`}></div>
            
            <div className="relative p-8 glass-effect rounded-3xl border-2 border-white/20">
              {isLoadingScore ? (
                <div className="flex justify-center items-center h-[300px]">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : scoreData ? (
                <div className="text-center space-y-6">
                  <h2 className="text-3xl font-bold text-white/90">Score de Sentimiento</h2>
                  
                  <div className="relative">
                    <div className={`text-[120px] font-black ${getScoreColor(scoreData.score.index)} leading-none`}>
                      {scoreData.score.index.toFixed(1)}
                    </div>
                    <div className="text-2xl text-white/60 mt-2">Índice General</div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 mt-8">
                    <div className="glass-effect p-6 rounded-2xl">
                      <Smile className="h-8 w-8 text-green-400 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-green-400">{scoreData.score.ratios.positive_ratio.toFixed(1)}%</div>
                      <div className="text-white/70 mt-2">Positivo</div>
                      <div className="text-sm text-white/50 mt-1">{scoreData.totals.positive.toLocaleString()} menciones</div>
                    </div>
                    
                    <div className="glass-effect p-6 rounded-2xl">
                      <Meh className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-gray-400">{scoreData.score.ratios.neutral_ratio.toFixed(1)}%</div>
                      <div className="text-white/70 mt-2">Neutral</div>
                      <div className="text-sm text-white/50 mt-1">{scoreData.totals.neutral.toLocaleString()} menciones</div>
                    </div>
                    
                    <div className="glass-effect p-6 rounded-2xl">
                      <Frown className="h-8 w-8 text-red-400 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-red-400">{scoreData.score.ratios.negative_ratio.toFixed(1)}%</div>
                      <div className="text-white/70 mt-2">Negativo</div>
                      <div className="text-sm text-white/50 mt-1">{scoreData.totals.negative.toLocaleString()} menciones</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center h-[300px] text-white/70">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>

          {/* Trend y Distribution Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Trend Chart - 2/3 del ancho */}
            <div className="relative lg:col-span-2">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-blue-500/10 blur-3xl rounded-2xl"></div>
              
              <div className="relative p-6 glass-effect rounded-2xl h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 glass-effect rounded-xl">
                      <TrendingUp className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Evolución Temporal</h2>
                      <p className="text-white/70 text-sm">Tendencia de sentimientos</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {intervals.map((int) => (
                      <Button
                        key={int.value}
                        onClick={() => setInterval(int.value)}
                        size="sm"
                        className={`transition-all duration-300 ${
                          interval === int.value
                            ? 'bg-primary/20 border border-cyan-300/60 shadow-xl shadow-cyan-400/30 scale-105 hover:bg-primary/20 text-white'
                            : 'glass-effect border-white/10 hover:bg-white/10 text-white'
                        }`}
                        variant={interval === int.value ? 'default' : 'outline'}
                      >
                        {int.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {isLoadingTrend ? (
                  <div className="flex justify-center items-center h-[400px]">
                    <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
                  </div>
                ) : trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                      <defs>
                        <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatXAxis}
                        stroke="rgba(255,255,255,0.9)"
                        style={{ fontSize: '12px', fontWeight: 600 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.9)"
                        style={{ fontSize: '12px', fontWeight: 600 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="positive" 
                        stroke="#22c55e" 
                        fill="url(#colorPositive)"
                        strokeWidth={2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="neutral" 
                        stroke="#94a3b8" 
                        fill="url(#colorNeutral)"
                        strokeWidth={2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="negative" 
                        stroke="#ef4444" 
                        fill="url(#colorNegative)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-[400px] text-white/70">
                    No hay datos disponibles
                  </div>
                )}
              </div>
            </div>

            {/* Distribution Pie Chart - 1/3 del ancho */}
            <div className="relative lg:col-span-1">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10 blur-3xl rounded-2xl"></div>
              
              <div className="relative p-6 glass-effect rounded-2xl h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 glass-effect rounded-xl">
                    <Smile className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Distribución</h2>
                    <p className="text-white/70 text-sm">Proporción de sentimientos</p>
                  </div>
                </div>

                {isLoadingDistribution ? (
                  <div className="flex justify-center items-center h-[400px]">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
                  </div>
                ) : pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={450}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="40%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.name === 'Positivo' ? COLORS.positive : entry.name === 'Neutral' ? COLORS.neutral : COLORS.negative}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value, entry: any) => (
                          <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: 600 }}>
                            {value}: {entry.payload.value} menciones
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-[400px] text-white/70">
                    No hay datos disponibles
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botón Informe Avanzado - Movido al final */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-cyan-500/30 blur-xl rounded-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Button
              onClick={() => navigate('/informeSentimiento')}
              className="relative w-full bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-700 hover:via-pink-700 hover:to-cyan-700 text-white font-bold py-6 px-8 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-[1.02] border-2 border-white/20 flex items-center justify-center"
            >
              <FileText className="mr-3 h-6 w-6" />
              <span className="text-lg">Informe Avanzado de Sentimiento</span>
              <div className="ml-3 text-xs bg-white/20 px-3 py-1 rounded-full">Análisis Completo</div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sentimiento;
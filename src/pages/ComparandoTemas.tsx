import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Calendar as CalendarIcon, ArrowLeft, Trophy, TrendingUp, Smile, Meh, Frown, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SoftMathBackground from '@/components/SoftMathBackground';
import Header from '@/components/Header';

interface ReachData {
  total_mentions: number;
  total_reach: number;
  average_reach_per_mention: number;
}

interface SentimentData {
  totals: {
    positive: number;
    neutral: number;
    negative: number;
    total_mentions: number;
    total_reach: number;
  };
  score: {
    index: number;
    ratios: {
      positive_ratio: number;
      neutral_ratio: number;
      negative_ratio: number;
    };
  };
}

interface Alert {
  id: number;
  name: string;
  type?: string;
  project_name?: string;
  created_at?: string;
}

const ComparandoTemas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { companyId } = useAuth();
  
  const blueAlertId = searchParams.get('blue');
  const redAlertId = searchParams.get('red');
  
  const [blueData, setBlueData] = useState<ReachData | null>(null);
  const [redData, setRedData] = useState<ReachData | null>(null);
  const [blueSentiment, setBlueSentiment] = useState<SentimentData | null>(null);
  const [redSentiment, setRedSentiment] = useState<SentimentData | null>(null);
  const [blueAlert, setBlueAlert] = useState<Alert | null>(null);
  const [redAlert, setRedAlert] = useState<Alert | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2025, 0, 1),
    to: new Date()
  });

  const hadCompleteRange = useRef(false);

  useEffect(() => {
    hadCompleteRange.current = !!(dateRange.from && dateRange.to);
  }, [dateRange]);

  useEffect(() => {
    if (!blueAlertId || !redAlertId || !companyId) {
      toast.error('Faltan parámetros para comparar');
      navigate('/comparador');
      return;
    }
    
    fetchAlertNames();
    fetchComparisonData();
  }, [blueAlertId, redAlertId, companyId]);

  useEffect(() => {
    if (companyId && blueAlertId && redAlertId && dateRange.from && dateRange.to) {
      fetchComparisonData();
    }
  }, [dateRange]);

  const fetchAlertNames = async () => {
    if (!companyId) return;
    
    try {
      const response = await apiFetch(`/api/info/getAlerts?company_id=${companyId}`);
      if (!response.ok) throw new Error('Error al obtener alertas');
      
      const result = await response.json();
      const alerts = result.data.alerts || [];
      
      const blue = alerts.find((a: Alert) => a.id.toString() === blueAlertId);
      const red = alerts.find((a: Alert) => a.id.toString() === redAlertId);
      
      setBlueAlert(blue || null);
      setRedAlert(red || null);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchComparisonData = async () => {
    if (!companyId || !blueAlertId || !redAlertId || !dateRange.from || !dateRange.to) return;
    
    setIsLoading(true);
    try {
      const fromStr = format(dateRange.from, 'yyyy-MM-dd');
      const toStr = format(dateRange.to, 'yyyy-MM-dd');
      
      const [blueResponse, redResponse, blueSentimentResponse, redSentimentResponse] = await Promise.all([
        apiFetch(`/api/stats/reach/summary?company_id=${companyId}&alert_id=${blueAlertId}&from=${fromStr}&to=${toStr}`),
        apiFetch(`/api/stats/reach/summary?company_id=${companyId}&alert_id=${redAlertId}&from=${fromStr}&to=${toStr}`),
        apiFetch(`/api/stats/sentiment/score?company_id=${companyId}&alert_id=${blueAlertId}&from=${fromStr}&to=${toStr}&weight=mentions`),
        apiFetch(`/api/stats/sentiment/score?company_id=${companyId}&alert_id=${redAlertId}&from=${fromStr}&to=${toStr}&weight=mentions`)
      ]);

      if (!blueResponse.ok || !redResponse.ok || !blueSentimentResponse.ok || !redSentimentResponse.ok) {
        throw new Error('Error al obtener datos de comparación');
      }

      const blueResult = await blueResponse.json();
      const redResult = await redResponse.json();
      const blueSentimentResult = await blueSentimentResponse.json();
      const redSentimentResult = await redSentimentResponse.json();

      setBlueData(blueResult.data);
      setRedData(redResult.data);
      setBlueSentiment(blueSentimentResult.data);
      setRedSentiment(redSentimentResult.data);
    } catch (error) {
      toast.error('Error al cargar datos de comparación');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (hadCompleteRange.current && range) {
      let clickedDate: Date | undefined;
      const prevFrom = dateRange.from?.getTime();
      const prevTo = dateRange.to?.getTime();
      const newFrom = range.from?.getTime();
      const newTo = range.to?.getTime();
      
      if (newTo && newTo !== prevTo && newTo !== prevFrom) {
        clickedDate = range.to;
      } else if (newFrom && newFrom !== prevFrom && newFrom !== prevTo) {
        clickedDate = range.from;
      } else if (newFrom && !newTo) {
        clickedDate = range.from;
      } else {
        clickedDate = range.to || range.from;
      }
      
      hadCompleteRange.current = false;
      setDateRange({ from: clickedDate, to: undefined });
      return;
    }
    setDateRange({ from: range?.from, to: range?.to });
  };

  const getWinner = (blueValue: number, redValue: number): 'blue' | 'red' | 'tie' => {
    if (blueValue > redValue) return 'blue';
    if (redValue > blueValue) return 'red';
    return 'tie';
  };

  const MetricCard = ({ 
    title, 
    blueValue, 
    redValue, 
    format = 'number',
    icon: Icon,
    invertWinner = false
  }: { 
    title: string; 
    blueValue: number; 
    redValue: number; 
    format?: 'number' | 'decimal';
    icon: any;
    invertWinner?: boolean;
  }) => {
    let winner = getWinner(blueValue, redValue);
    
    if (invertWinner && winner !== 'tie') {
      winner = winner === 'blue' ? 'red' : 'blue';
    }
    
    const formatValue = (value: number) => {
      if (format === 'decimal') {
        return value.toLocaleString('es-ES', { maximumFractionDigits: 2 });
      }
      return value.toLocaleString('es-ES');
    };

    return (
      <div className="relative">
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground/90">{title}</h3>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 items-center">
          <div className={`text-center p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl border-2 sm:border-4 transition-all duration-500 ${
            winner === 'blue' 
              ? 'border-blue-400 bg-gradient-to-br from-blue-500/30 to-blue-900/20 shadow-[0_0_30px_rgba(59,130,246,0.6)] scale-105' 
              : 'border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-900/5'
          }`}>
            {winner === 'blue' && (
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-400 mx-auto mb-1 sm:mb-2 animate-bounce" />
            )}
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-blue-400 break-all">
              {formatValue(blueValue)}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-red-400">
              VS
            </div>
          </div>

          <div className={`text-center p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl border-2 sm:border-4 transition-all duration-500 ${
            winner === 'red' 
              ? 'border-red-400 bg-gradient-to-br from-red-500/30 to-red-900/20 shadow-[0_0_30px_rgba(239,68,68,0.6)] scale-105' 
              : 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-900/5'
          }`}>
            {winner === 'red' && (
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-400 mx-auto mb-1 sm:mb-2 animate-bounce" />
            )}
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-red-400 break-all">
              {formatValue(redValue)}
            </div>
          </div>
        </div>

        {winner !== 'tie' && (
          <div className="text-center mt-3 sm:mt-4">
            <div className="text-xs sm:text-sm text-foreground/60">
              Diferencia: {Math.abs(((blueValue - redValue) / Math.max(blueValue, redValue)) * 100).toFixed(1)}%
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-x-hidden">
      <SoftMathBackground />
      <Sidebar />
      
      <div className="flex-1 w-full px-2 py-3 sm:px-3 sm:py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 relative z-10">
        <div className="max-w-7xl mx-auto w-full space-y-4 sm:space-y-6">
          <Header />

          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/comparador')}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg bg-foreground/10 hover:bg-foreground/20 transition-colors"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Volver</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 items-center mb-6 sm:mb-8">
            <div className="text-center space-y-1 sm:space-y-2">
              <div className="text-2xl sm:text-3xl md:text-4xl"></div>
              <div className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-blue-400 break-words px-1 sm:px-2">
                {blueAlert?.name || 'Cargando...'}
              </div>
            </div>

            <div className="flex justify-center">
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 animate-pulse">
                VS
              </div>
            </div>

            <div className="text-center space-y-1 sm:space-y-2">
              <div className="text-2xl sm:text-3xl md:text-4xl"></div>
              <div className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-red-400 break-words px-1 sm:px-2">
                {redAlert?.name || 'Cargando...'}
              </div>
            </div>
          </div>

          <div className="flex justify-center px-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="glass-effect border-white/10 hover:bg-white/10 text-white w-full sm:w-auto text-xs sm:text-sm"
                >
                  <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
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
              <PopoverContent className="w-auto p-0 glass-card border-white/10" align="center">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={handleDateRangeSelect}
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
                  onSelect={handleDateRangeSelect}
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

          {isLoading ? (
            <div className="flex justify-center items-center py-12 sm:py-16 md:py-20">
              <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 animate-spin text-primary" />
            </div>
          ) : blueData && redData && blueSentiment && redSentiment ? (
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 inline-flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                    ALCANCE
                  </h2>
                </div>
                
                <MetricCard
                  title="Alcance Total"
                  blueValue={blueData.total_reach}
                  redValue={redData.total_reach}
                  icon={TrendingUp}
                />
                
                <MetricCard
                  title="Menciones Totales"
                  blueValue={blueData.total_mentions}
                  redValue={redData.total_mentions}
                  icon={TrendingUp}
                />
                
                <MetricCard
                  title="Alcance Promedio por Mención"
                  blueValue={blueData.average_reach_per_mention}
                  redValue={redData.average_reach_per_mention}
                  format="decimal"
                  icon={TrendingUp}
                />
              </div>

              <div className="relative py-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gradient-to-r from-transparent via-foreground/20 to-transparent"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-4 text-2xl"></span>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600 inline-flex items-center gap-2">
                    <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
                    SENTIMIENTO
                  </h2>
                </div>
                
                <MetricCard
                  title="Índice de Sentimiento"
                  blueValue={blueSentiment.score.index}
                  redValue={redSentiment.score.index}
                  format="decimal"
                  icon={Heart}
                />
                
                <MetricCard
                  title="Menciones Positivas"
                  blueValue={blueSentiment.totals.positive}
                  redValue={redSentiment.totals.positive}
                  icon={Smile}
                />
                
                <MetricCard
                  title="Menciones Neutrales"
                  blueValue={blueSentiment.totals.neutral}
                  redValue={redSentiment.totals.neutral}
                  icon={Meh}
                />
                
                <MetricCard
                  title="Menciones Negativas"
                  blueValue={blueSentiment.totals.negative}
                  redValue={redSentiment.totals.negative}
                  icon={Frown}
                  invertWinner
                />
                
                <MetricCard
                  title="Ratio Positivo (%)"
                  blueValue={blueSentiment.score.ratios.positive_ratio}
                  redValue={redSentiment.score.ratios.positive_ratio}
                  format="decimal"
                  icon={Smile}
                />
                
                <MetricCard
                  title="Ratio Negativo (%)"
                  blueValue={blueSentiment.score.ratios.negative_ratio}
                  redValue={redSentiment.score.ratios.negative_ratio}
                  format="decimal"
                  icon={Frown}
                  invertWinner
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ComparandoTemas;
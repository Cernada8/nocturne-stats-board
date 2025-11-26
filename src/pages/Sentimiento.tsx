import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Sidebar from '@/components/Sidebar';
import { Loader2, Calendar as CalendarIcon, Bell, TrendingUp, Smile, Meh, Frown, FileText, ArrowLeft, GitCompare } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ResponsiveContainer, Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import SoftMathBackground from '@/components/SoftMathBackground';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const hadCompleteRange = useRef(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2025, 0, 1),
    to: new Date()
  });
  const [interval, setInterval] = useState<'day' | 'week' | 'month' | 'year'>('month');
  
  const [distribution, setDistribution] = useState<SentimentDistribution[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  
  const [isLoadingDistribution, setIsLoadingDistribution] = useState(false);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);
  const [isLoadingScore, setIsLoadingScore] = useState(false);

  // Estados para comparación
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [period1, setPeriod1] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [period2, setPeriod2] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [isComparing, setIsComparing] = useState(false);

  const intervals = [
    { value: 'day' as const, label: 'Diario', shortLabel: 'D' },
    { value: 'week' as const, label: 'Semanal', shortLabel: 'S' },
    { value: 'month' as const, label: 'Mensual', shortLabel: 'M' },
    { value: 'year' as const, label: 'Anual', shortLabel: 'A' }
  ];

    useEffect(() => {
    hadCompleteRange.current = !!(dateRange.from && dateRange.to);
  }, [dateRange]);

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

  // Función para obtener datos de un periodo específico
  const fetchPeriodData = async (from: Date, to: Date) => {
    const fromStr = format(from, 'yyyy-MM-dd');
    const toStr = format(to, 'yyyy-MM-dd');
    
    let distributionEndpoint = `/api/stats/sentiment/distribution?company_id=${companyId}&from=${fromStr}&to=${toStr}`;
    let scoreEndpoint = `/api/stats/sentiment/score?company_id=${companyId}&from=${fromStr}&to=${toStr}&weight=mentions`;
    
    if (selectedAlertId) {
      distributionEndpoint += `&alert_id=${selectedAlertId}`;
      scoreEndpoint += `&alert_id=${selectedAlertId}`;
    }
    
    const [distResponse, scoreResponse] = await Promise.all([
      apiFetch(distributionEndpoint),
      apiFetch(scoreEndpoint)
    ]);
    
    const distResult = await distResponse.json();
    const scoreResult = await scoreResponse.json();
    
    return {
      distribution: distResult.data.sentiment_distribution,
      score: scoreResult.data
    };
  };

  const handleCompare = async () => {
    if (!period1.from || !period1.to || !period2.from || !period2.to) {
      toast.error('Por favor selecciona ambos periodos');
      return;
    }

    setIsComparing(true);
    toast.info('Generando comparación...');

    try {
      // Obtener datos de ambos periodos
      const [data1, data2] = await Promise.all([
        fetchPeriodData(period1.from, period1.to),
        fetchPeriodData(period2.from, period2.to)
      ]);

      // Generar PDF
      generateComparisonPDF(data1, data2);
      
      toast.success('Comparación generada correctamente');
      setShowCompareDialog(false);
    } catch (error) {
      console.error('Error al comparar periodos:', error);
      toast.error('Error al generar la comparación');
    } finally {
      setIsComparing(false);
    }
  };

  const generateComparisonPDF = (data1: any, data2: any) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;

    // Título principal
    pdf.setFontSize(22);
    pdf.setTextColor(40, 40, 40);
    pdf.text('Comparación de Periodos', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 8;
    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Análisis Comparativo de Sentimiento', pageWidth / 2, yPosition, { align: 'center' });
    
    // Información de periodos
    yPosition += 15;
    pdf.setFontSize(11);
    pdf.setTextColor(80, 80, 80);
    
    const alertName = selectedAlertId 
      ? alerts.find(a => a.id === selectedAlertId)?.name 
      : 'Todos los temas';
    
    pdf.text(`Tema: ${alertName}`, 14, yPosition);
    yPosition += 7;
    
    if (period1.from && period1.to) {
      const period1Str = `${format(period1.from, 'dd MMM yyyy', { locale: es })} - ${format(period1.to, 'dd MMM yyyy', { locale: es })}`;
      pdf.setTextColor(59, 130, 246);
      pdf.text(`Periodo 1: ${period1Str}`, 14, yPosition);
    }
    yPosition += 7;
    
    if (period2.from && period2.to) {
      const period2Str = `${format(period2.from, 'dd MMM yyyy', { locale: es })} - ${format(period2.to, 'dd MMM yyyy', { locale: es })}`;
      pdf.setTextColor(168, 85, 247);
      pdf.text(`Periodo 2: ${period2Str}`, 14, yPosition);
    }
    yPosition += 7;
    
    pdf.setTextColor(80, 80, 80);
    pdf.text(`Fecha de generación: ${format(new Date(), 'dd MMM yyyy HH:mm', { locale: es })}`, 14, yPosition);
    yPosition += 15;

    // Tabla de Score Comparativo
    pdf.setFontSize(14);
    pdf.setTextColor(40, 40, 40);
    pdf.text('Índice de Sentimiento', 14, yPosition);
    yPosition += 8;

    const scoreTableData = [
      [
        'Score General',
        data1.score.score.index.toFixed(1),
        data2.score.score.index.toFixed(1),
        (data2.score.score.index - data1.score.score.index).toFixed(1)
      ],
      [
        '% Positivo',
        `${data1.score.score.ratios.positive_ratio.toFixed(1)}%`,
        `${data2.score.score.ratios.positive_ratio.toFixed(1)}%`,
        `${(data2.score.score.ratios.positive_ratio - data1.score.score.ratios.positive_ratio).toFixed(1)}%`
      ],
      [
        '% Neutral',
        `${data1.score.score.ratios.neutral_ratio.toFixed(1)}%`,
        `${data2.score.score.ratios.neutral_ratio.toFixed(1)}%`,
        `${(data2.score.score.ratios.neutral_ratio - data1.score.score.ratios.neutral_ratio).toFixed(1)}%`
      ],
      [
        '% Negativo',
        `${data1.score.score.ratios.negative_ratio.toFixed(1)}%`,
        `${data2.score.score.ratios.negative_ratio.toFixed(1)}%`,
        `${(data2.score.score.ratios.negative_ratio - data1.score.score.ratios.negative_ratio).toFixed(1)}%`
      ]
    ];

    autoTable(pdf, {
      startY: yPosition,
      head: [['Métrica', 'Periodo 1', 'Periodo 2', 'Diferencia']],
      body: scoreTableData,
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 50 },
        1: { halign: 'center', cellWidth: 40 },
        2: { halign: 'center', cellWidth: 40 },
        3: { halign: 'center', cellWidth: 40, fontStyle: 'bold' }
      },
      styles: {
        fontSize: 10,
        cellPadding: 4
      }
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 15;

    // Tabla de Menciones Totales
    pdf.setFontSize(14);
    pdf.setTextColor(40, 40, 40);
    pdf.text('Volumen de Menciones', 14, yPosition);
    yPosition += 8;

    const mentionsTableData = [
      [
        'Menciones Positivas',
        data1.score.totals.positive.toLocaleString(),
        data2.score.totals.positive.toLocaleString(),
        (data2.score.totals.positive - data1.score.totals.positive).toLocaleString()
      ],
      [
        'Menciones Neutrales',
        data1.score.totals.neutral.toLocaleString(),
        data2.score.totals.neutral.toLocaleString(),
        (data2.score.totals.neutral - data1.score.totals.neutral).toLocaleString()
      ],
      [
        'Menciones Negativas',
        data1.score.totals.negative.toLocaleString(),
        data2.score.totals.negative.toLocaleString(),
        (data2.score.totals.negative - data1.score.totals.negative).toLocaleString()
      ],
      [
        'Total Menciones',
        data1.score.totals.total_mentions.toLocaleString(),
        data2.score.totals.total_mentions.toLocaleString(),
        (data2.score.totals.total_mentions - data1.score.totals.total_mentions).toLocaleString()
      ]
    ];

    autoTable(pdf, {
      startY: yPosition,
      head: [['Tipo', 'Periodo 1', 'Periodo 2', 'Variación']],
      body: mentionsTableData,
      theme: 'striped',
      headStyles: {
        fillColor: [168, 85, 247],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 50 },
        1: { halign: 'center', cellWidth: 40 },
        2: { halign: 'center', cellWidth: 40 },
        3: { halign: 'center', cellWidth: 40, fontStyle: 'bold' }
      },
      styles: {
        fontSize: 10,
        cellPadding: 4
      }
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 15;

    // Resumen ejecutivo
    if (yPosition > 220) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(40, 40, 40);
    pdf.text('Resumen Ejecutivo', 14, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);

    const scoreDiff = data2.score.score.index - data1.score.score.index;
    const scoreText = scoreDiff > 0 
      ? `El sentimiento ha mejorado en ${scoreDiff.toFixed(1)} puntos.`
      : scoreDiff < 0
      ? `El sentimiento ha empeorado en ${Math.abs(scoreDiff).toFixed(1)} puntos.`
      : 'El sentimiento se ha mantenido estable.';
    
    pdf.text(scoreText, 14, yPosition);
    yPosition += 7;

    const mentionsDiff = data2.score.totals.total_mentions - data1.score.totals.total_mentions;
    const mentionsPercent = ((mentionsDiff / data1.score.totals.total_mentions) * 100).toFixed(1);
    const mentionsText = mentionsDiff > 0
      ? `El volumen de menciones aumentó en ${mentionsDiff.toLocaleString()} (${mentionsPercent}%).`
      : mentionsDiff < 0
      ? `El volumen de menciones disminuyó en ${Math.abs(mentionsDiff).toLocaleString()} (${Math.abs(parseFloat(mentionsPercent))}%).`
      : 'El volumen de menciones se mantuvo constante.';
    
    pdf.text(mentionsText, 14, yPosition);
    yPosition += 7;

    const positiveDiff = data2.score.score.ratios.positive_ratio - data1.score.score.ratios.positive_ratio;
    if (Math.abs(positiveDiff) > 2) {
      const positiveText = positiveDiff > 0
        ? `Las menciones positivas aumentaron ${positiveDiff.toFixed(1)} puntos porcentuales.`
        : `Las menciones positivas disminuyeron ${Math.abs(positiveDiff).toFixed(1)} puntos porcentuales.`;
      pdf.text(positiveText, 14, yPosition);
    }

    // Nombre del archivo
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const fileName = `comparacion-sentimiento-${dateStr}.pdf`;
    pdf.save(fileName);
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
        <div className="glass-card p-3 sm:p-4 border border-cyan-300/30 shadow-xl shadow-cyan-400/20">
          <p className="text-xs sm:text-sm text-white/70 mb-2">{payload[0].payload.date}</p>
          <p className="text-xs sm:text-sm text-green-400">Positivo: {payload[0].payload.positive}</p>
          <p className="text-xs sm:text-sm text-gray-400">Neutral: {payload[0].payload.neutral}</p>
          <p className="text-xs sm:text-sm text-red-400">Negativo: {payload[0].payload.negative}</p>
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
        <div className="glass-card p-3 sm:p-4 border border-cyan-300/30 shadow-xl shadow-cyan-400/20">
          <p className="text-cyan-300 font-bold mb-2 text-sm">{data.name}</p>
          <p className="text-white text-xs sm:text-sm">
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

  return (
    <div className="min-h-screen max-h-screen overflow-hidden flex">
      <SoftMathBackground />
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-slate-900/50 hover:scrollbar-thumb-slate-600/70">
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          <Header />

          {/* Title - Responsive */}
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
                Análisis de Sentimiento
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-white/70">
                Dashboard completo de análisis emocional
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
                      : "Todos los temas"}
                  </span>
                  <Bell className="ml-2 h-4 w-4 flex-shrink-0" />
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
                    Todos los temas
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
onSelect={handleDateRangeSelect}
                  numberOfMonths={typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 2}
                  locale={es}
                  fromYear={1960}
                  toYear={2030}
                  showPredefinedPeriods={true}
                  onPredefinedPeriodSelect={(range) => setDateRange(range)}
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              className="glass-effect border-purple-300/30 hover:bg-purple-500/20 text-white w-full sm:w-auto text-sm"
              onClick={() => setShowCompareDialog(true)}
            >
              <GitCompare className="mr-2 h-4 w-4 flex-shrink-0" />
              <span>Comparar Periodos</span>
            </Button>
          </div>

          {/* Dialog de Comparación */}
          <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
            <DialogContent className="glass-card border-white/10 text-white max-w-4xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white">Comparar Periodos</DialogTitle>
                <DialogDescription className="text-white/70">
                  Selecciona dos periodos para comparar sus métricas de sentimiento
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Periodo 1 */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-blue-400">Periodo 1</h3>
                  <Calendar
                    mode="range"
                    selected={{ from: period1.from, to: period1.to }}
onSelect={handleDateRangeSelect}
                    numberOfMonths={1}
                    locale={es}
                    fromYear={1960}
                    toYear={2030}
                    className="glass-effect border border-blue-400/30 rounded-lg p-3"
                  />
                  {period1.from && period1.to && (
                    <p className="text-sm text-white/70 text-center">
                      {format(period1.from, 'dd MMM yyyy', { locale: es })} - {format(period1.to, 'dd MMM yyyy', { locale: es })}
                    </p>
                  )}
                </div>

                {/* Periodo 2 */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-purple-400">Periodo 2</h3>
                  <Calendar
                    mode="range"
                    selected={{ from: period2.from, to: period2.to }}
onSelect={handleDateRangeSelect}
                    numberOfMonths={1}
                    locale={es}
                    fromYear={1960}
                    toYear={2030}
                    className="glass-effect border border-purple-400/30 rounded-lg p-3"
                  />
                  {period2.from && period2.to && (
                    <p className="text-sm text-white/70 text-center">
                      {format(period2.from, 'dd MMM yyyy', { locale: es })} - {format(period2.to, 'dd MMM yyyy', { locale: es })}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1 glass-effect border-white/10 hover:bg-white/10 text-white"
                  onClick={() => setShowCompareDialog(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  onClick={handleCompare}
                  disabled={isComparing || !period1.from || !period1.to || !period2.from || !period2.to}
                >
                  {isComparing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    'Generar Comparación'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Score Card - Responsive */}
          <div className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${scoreData ? getScoreGradient(scoreData.score.index) : 'from-cyan-500/10 to-purple-500/10'} blur-3xl rounded-2xl sm:rounded-3xl`}></div>
            
            <div className="relative p-4 sm:p-6 lg:p-8 glass-effect rounded-2xl sm:rounded-3xl border-2 border-white/20">
              {isLoadingScore ? (
                <div className="flex justify-center items-center h-[250px] sm:h-[300px]">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-spin text-primary" />
                </div>
              ) : scoreData ? (
                <div className="text-center space-y-4 sm:space-y-6">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white/90">
                    Score de Sentimiento
                  </h2>
                  
                  <div className="relative">
                    <div className={`text-6xl sm:text-8xl lg:text-[120px] font-black ${getScoreColor(scoreData.score.index)} leading-none`}>
                      {scoreData.score.index.toFixed(1)}
                    </div>
                    <div className="text-base sm:text-xl lg:text-2xl text-white/60 mt-2">
                      Índice General
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6 mt-4 sm:mt-6 lg:mt-8">
                    <div className="glass-effect p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl">
                      <Smile className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-400 mx-auto mb-2 sm:mb-3" />
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-400">
                        {scoreData.score.ratios.positive_ratio.toFixed(1)}%
                      </div>
                      <div className="text-white/70 mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base">
                        Positivo
                      </div>
                      <div className="text-[10px] sm:text-xs lg:text-sm text-white/50 mt-1">
                        {scoreData.totals.positive.toLocaleString()} menciones
                      </div>
                    </div>
                    
                    <div className="glass-effect p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl">
                      <Meh className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-gray-400 mx-auto mb-2 sm:mb-3" />
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-400">
                        {scoreData.score.ratios.neutral_ratio.toFixed(1)}%
                      </div>
                      <div className="text-white/70 mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base">
                        Neutral
                      </div>
                      <div className="text-[10px] sm:text-xs lg:text-sm text-white/50 mt-1">
                        {scoreData.totals.neutral.toLocaleString()} menciones
                      </div>
                    </div>
                    
                    <div className="glass-effect p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl">
                      <Frown className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-red-400 mx-auto mb-2 sm:mb-3" />
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-400">
                        {scoreData.score.ratios.negative_ratio.toFixed(1)}%
                      </div>
                      <div className="text-white/70 mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base">
                        Negativo
                      </div>
                      <div className="text-[10px] sm:text-xs lg:text-sm text-white/50 mt-1">
                        {scoreData.totals.negative.toLocaleString()} menciones
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center h-[250px] sm:h-[300px] text-white/70 text-sm">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>

          {/* Trend y Distribution Grid - Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Trend Chart */}
            <div className="relative lg:col-span-2">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-blue-500/10 blur-3xl rounded-2xl"></div>
              
              <div className="relative p-3 sm:p-4 lg:p-6 glass-effect rounded-xl sm:rounded-2xl h-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 glass-effect rounded-xl">
                      <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                        Evolución Temporal
                      </h2>
                      <p className="text-white/70 text-xs sm:text-sm">
                        Tendencia de sentimientos
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
                    {intervals.map((int) => (
                      <Button
                        key={int.value}
                        onClick={() => setInterval(int.value)}
                        size="sm"
                        className={`transition-all duration-300 flex-1 sm:flex-initial text-xs ${
                          interval === int.value
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
                  <div className="flex justify-center items-center h-[300px] sm:h-[350px] lg:h-[400px]">
                    <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-spin text-cyan-400" />
                  </div>
                ) : trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={typeof window !== 'undefined' && window.innerWidth < 640 ? 300 : window.innerWidth < 1024 ? 350 : 400}>
                    <AreaChart data={trendData} margin={{ top: 20, right: 10, left: 0, bottom: 40 }}>
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
                        style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '10px' : '11px', fontWeight: 600 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.9)"
                        style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '10px' : '11px', fontWeight: 600 }}
                        width={typeof window !== 'undefined' && window.innerWidth < 640 ? 40 : 60}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="positive" 
                        stroke="#22c55e" 
                        fill="url(#colorPositive)"
                        strokeWidth={typeof window !== 'undefined' && window.innerWidth < 640 ? 1.5 : 2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="neutral" 
                        stroke="#94a3b8" 
                        fill="url(#colorNeutral)"
                        strokeWidth={typeof window !== 'undefined' && window.innerWidth < 640 ? 1.5 : 2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="negative" 
                        stroke="#ef4444" 
                        fill="url(#colorNegative)"
                        strokeWidth={typeof window !== 'undefined' && window.innerWidth < 640 ? 1.5 : 2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-[300px] sm:h-[350px] lg:h-[400px] text-white/70 text-sm">
                    No hay datos disponibles
                  </div>
                )}
              </div>
            </div>

            {/* Distribution Pie Chart */}
            <div className="relative lg:col-span-1">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10 blur-3xl rounded-2xl"></div>
              
              <div className="relative p-3 sm:p-4 lg:p-6 glass-effect rounded-xl sm:rounded-2xl h-full">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="p-2 sm:p-3 glass-effect rounded-xl">
                    <Smile className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                      Distribución
                    </h2>
                    <p className="text-white/70 text-xs sm:text-sm">
                      Proporción de sentimientos
                    </p>
                  </div>
                </div>

                {isLoadingDistribution ? (
                  <div className="flex justify-center items-center h-[300px] sm:h-[350px] lg:h-[400px]">
                    <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-spin text-purple-400" />
                  </div>
                ) : pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={typeof window !== 'undefined' && window.innerWidth < 640 ? 300 : window.innerWidth < 1024 ? 380 : 450}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="40%"
                        labelLine={false}
                        outerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 80 : window.innerWidth < 1024 ? 100 : 120}
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
                          <span style={{ color: '#ffffff', fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '11px' : '13px', fontWeight: 600 }}>
                            {value}: {entry.payload.value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-[300px] sm:h-[350px] lg:h-[400px] text-white/70 text-sm">
                    No hay datos disponibles
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botón Informe Avanzado - Responsive */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-cyan-500/30 blur-xl rounded-xl sm:rounded-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Button
              onClick={() => navigate('/informeSentimiento')}
              className="relative w-full bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-700 hover:via-pink-700 hover:to-cyan-700 text-white font-bold py-4 sm:py-5 lg:py-6 px-4 sm:px-6 lg:px-8 rounded-xl sm:rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-[1.02] border-2 border-white/20 flex items-center justify-center gap-2 sm:gap-3"
            >
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="text-sm sm:text-base lg:text-lg">
                Informe Avanzado de Sentimiento
              </span>
              <div className="hidden sm:block text-xs bg-white/20 px-2 sm:px-3 py-1 rounded-full">
                Análisis Completo
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sentimiento;
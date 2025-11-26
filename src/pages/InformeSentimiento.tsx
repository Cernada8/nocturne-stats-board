import { useEffect, useState, useRef } from 'react';
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
  Newspaper, 
  ArrowLeft,
  Download,
  MapPin,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend
} from 'recharts';
import SoftMathBackground from '@/components/SoftMathBackground';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Alert {
  id: string;
  name: string;
}

interface SourceData {
  source: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  positive_pct: number;
  neutral_pct: number;
  negative_pct: number;
}

interface CountryData {
  country: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  positive_pct: number;
  neutral_pct: number;
  negative_pct: number;
}

const InformeSentimiento = () => {
  const { userEmail, companyId, setCompanyId } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2025, 0, 1),
    to: new Date()
  });

  const [sourceData, setSourceData] = useState<SourceData[]>([]);
  const [countryData, setCountryData] = useState<CountryData[]>([]);
  
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const hadCompleteRange = useRef(false);

  const sourceLabels: { [key: string]: string } = {
    'news-blogs': 'Noticias y Blogs',
    'youtube': 'YouTube',
    'web': 'Web',
    'reddit': 'Reddit',
    'vimeo': 'Vimeo',
    'twitter': 'Twitter',
    'instagram': 'Instagram',
    'facebook': 'Facebook'
  };

  const countryLabels: { [key: string]: string } = {
    'ES': 'España',
    'US': 'Estados Unidos',
    'IT': 'Italia',
    'FR': 'Francia',
    'GB': 'Reino Unido',
    'MX': 'México',
    'DE': 'Alemania',
    'PT': 'Portugal',
    'AR': 'Argentina',
    'CO': 'Colombia',
    'CL': 'Chile',
    'PE': 'Perú'
  };

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
      fetchSourceData();
      fetchCountryData();
    }
  }, [companyId, dateRange, selectedAlertId]);

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

  const fetchSourceData = async () => {
    if (!companyId || !dateRange.from || !dateRange.to) return;
    
    setIsLoadingSources(true);
    try {
      const fromStr = format(dateRange.from, 'yyyy-MM-dd');
      const toStr = format(dateRange.to, 'yyyy-MM-dd');
      
      let endpoint = `/api/insights/sentiment_by_source?company_id=${companyId}&from=${fromStr}&to=${toStr}&limit=10`;
      if (selectedAlertId) endpoint += `&alert_id=${selectedAlertId}`;
      
      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error('Error al obtener datos por fuente');
      
      const result = await response.json();
      setSourceData(result.data.sources || []);
    } catch (error) {
      toast.error('Error al cargar datos por fuente');
      console.error(error);
    } finally {
      setIsLoadingSources(false);
    }
  };

  const fetchCountryData = async () => {
    if (!companyId || !dateRange.from || !dateRange.to) return;
    
    setIsLoadingCountries(true);
    try {
      const fromStr = format(dateRange.from, 'yyyy-MM-dd');
      const toStr = format(dateRange.to, 'yyyy-MM-dd');
      
      let endpoint = `/api/insights/sentiment_by_country?company_id=${companyId}&from=${fromStr}&to=${toStr}&limit=10`;
      if (selectedAlertId) endpoint += `&alert_id=${selectedAlertId}`;
      
      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error('Error al obtener datos por país');
      
      const result = await response.json();
      setCountryData(result.data.countries || []);
    } catch (error) {
      toast.error('Error al cargar datos por país');
      console.error(error);
    } finally {
      setIsLoadingCountries(false);
    }
  };

  const handleExportPDF = async () => {
    if (sourceData.length === 0 && countryData.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    
    setIsExporting(true);
    toast.info('Generando PDF...');
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      // Título principal
      pdf.setFontSize(20);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Informe Avanzado de Sentimiento', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Análisis detallado por fuentes y geografía', pageWidth / 2, yPosition, { align: 'center' });
      
      // Información del reporte
      yPosition += 15;
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      
      const alertName = selectedAlertId 
        ? alerts.find(a => a.id === selectedAlertId)?.name 
        : 'Todos los temas';
      
      pdf.text(`Tema: ${alertName}`, 14, yPosition);
      yPosition += 6;
      
      if (dateRange.from && dateRange.to) {
        const dateStr = `${format(dateRange.from, 'dd MMM yyyy', { locale: es })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: es })}`;
        pdf.text(`Periodo: ${dateStr}`, 14, yPosition);
      }
      yPosition += 6;
      
      pdf.text(`Fecha de generación: ${format(new Date(), 'dd MMM yyyy HH:mm', { locale: es })}`, 14, yPosition);
      yPosition += 12;

      // Tabla de análisis por fuente
      if (sourceData.length > 0) {
        pdf.setFontSize(14);
        pdf.setTextColor(40, 40, 40);
        pdf.text('Análisis por Fuente', 14, yPosition);
        yPosition += 8;

        const sourceTableData = sourceData.map(source => [
          sourceLabels[source.source] || source.source,
          `${source.positive} (${source.positive_pct.toFixed(1)}%)`,
          `${source.neutral} (${source.neutral_pct.toFixed(1)}%)`,
          `${source.negative} (${source.negative_pct.toFixed(1)}%)`,
          source.total.toLocaleString()
        ]);

        autoTable(pdf, {
          startY: yPosition,
          head: [['Fuente', 'Positivo', 'Neutral', 'Negativo', 'Total']],
          body: sourceTableData,
          theme: 'striped',
          headStyles: {
            fillColor: [100, 50, 150],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
          },
          columnStyles: {
            0: { halign: 'left', cellWidth: 50 },
            1: { halign: 'center', cellWidth: 30 },
            2: { halign: 'center', cellWidth: 30 },
            3: { halign: 'center', cellWidth: 30 },
            4: { halign: 'center', cellWidth: 30 }
          },
          styles: {
            fontSize: 9,
            cellPadding: 3
          }
        });

        yPosition = (pdf as any).lastAutoTable.finalY + 15;
      }

      // Nueva página si es necesario
      if (yPosition > 200 && countryData.length > 0) {
        pdf.addPage();
        yPosition = 20;
      }

      // Tabla de análisis geográfico
      if (countryData.length > 0) {
        pdf.setFontSize(14);
        pdf.setTextColor(40, 40, 40);
        pdf.text('Análisis Geográfico', 14, yPosition);
        yPosition += 8;

        const countryTableData = countryData.map(country => [
          countryLabels[country.country] || country.country,
          `${country.positive} (${country.positive_pct.toFixed(1)}%)`,
          `${country.neutral} (${country.neutral_pct.toFixed(1)}%)`,
          `${country.negative} (${country.negative_pct.toFixed(1)}%)`,
          country.total.toLocaleString()
        ]);

        autoTable(pdf, {
          startY: yPosition,
          head: [['País', 'Positivo', 'Neutral', 'Negativo', 'Total']],
          body: countryTableData,
          theme: 'striped',
          headStyles: {
            fillColor: [50, 150, 200],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
          },
          columnStyles: {
            0: { halign: 'left', cellWidth: 50 },
            1: { halign: 'center', cellWidth: 30 },
            2: { halign: 'center', cellWidth: 30 },
            3: { halign: 'center', cellWidth: 30 },
            4: { halign: 'center', cellWidth: 30 }
          },
          styles: {
            fontSize: 9,
            cellPadding: 3
          }
        });
      }

      // Generar nombre de archivo y guardar
      const alertNameFile = selectedAlertId 
        ? alerts.find(a => a.id === selectedAlertId)?.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
        : 'todos-los-temas';
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const fileName = `informe-sentimiento-${alertNameFile}-${dateStr}.pdf`;

      pdf.save(fileName);
      toast.success('PDF exportado correctamente');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setIsExporting(false);
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card p-3 sm:p-4 border border-cyan-300/30 shadow-xl shadow-cyan-400/20">
          <p className="text-white font-bold mb-2 text-sm">{data.name}</p>
          <p className="text-xs sm:text-sm text-green-400">Positivo: {data.positive} ({data.positive_pct.toFixed(1)}%)</p>
          <p className="text-xs sm:text-sm text-gray-400">Neutral: {data.neutral} ({data.neutral_pct.toFixed(1)}%)</p>
          <p className="text-xs sm:text-sm text-red-400">Negativo: {data.negative} ({data.negative_pct.toFixed(1)}%)</p>
          <p className="text-xs sm:text-sm text-cyan-400 mt-2 font-bold">Total: {data.total}</p>
        </div>
      );
    }
    return null;
  };

  const sourceChartData = sourceData.map(item => ({
    name: sourceLabels[item.source] || item.source,
    positive: item.positive,
    neutral: item.neutral,
    negative: item.negative,
    total: item.total,
    positive_pct: item.positive_pct,
    neutral_pct: item.neutral_pct,
    negative_pct: item.negative_pct
  }));

  const countryChartData = countryData.map(item => ({
    name: countryLabels[item.country] || item.country,
    positive: item.positive,
    neutral: item.neutral,
    negative: item.negative,
    total: item.total,
    positive_pct: item.positive_pct,
    neutral_pct: item.neutral_pct,
    negative_pct: item.negative_pct
  }));

  const getSourceIcon = (source: string) => {
    const icons: { [key: string]: any } = {
      'news-blogs': Newspaper,
      'youtube': FileText,
      'web': Globe,
      'reddit': FileText,
      'vimeo': FileText
    };
    const Icon = icons[source] || Globe;
    return <Icon className="h-4 w-4 sm:h-5 sm:w-5" />;
  };

  const getFlagEmoji = (countryCode: string): string => {
    const flags: { [key: string]: string } = {
      'ES': '🇪🇸', 'US': '🇺🇸', 'IT': '🇮🇹', 'FR': '🇫🇷',
      'GB': '🇬🇧', 'MX': '🇲🇽', 'DE': '🇩🇪', 'PT': '🇵🇹',
      'AR': '🇦🇷', 'CO': '🇨🇴', 'CL': '🇨🇱', 'PE': '🇵🇪'
    };
    return flags[countryCode] || '🌍';
  };

  return (
    <div className="min-h-screen max-h-screen overflow-hidden flex">
      <SoftMathBackground />
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-slate-900/50 hover:scrollbar-thumb-slate-600/70">
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          <Header />

          {/* Header Section - Responsive */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                onClick={() => navigate('/sentimiento')}
                variant="outline"
                className="glass-effect border-white/10 hover:bg-white/10 text-white h-8 w-8 sm:h-10 sm:w-10"
                size="icon"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">
                  Informe Avanzado de Sentimiento
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-white/70">
                  Análisis detallado por fuentes y geografía
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="glass-effect border-white/10 hover:bg-white/10 text-white text-xs sm:text-sm w-full sm:w-auto"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExporting || isLoadingSources || isLoadingCountries}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Exportar PDF
                </>
              )}
            </Button>
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
          </div>

          {/* Source Analysis - Responsive */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 blur-3xl rounded-2xl sm:rounded-3xl"></div>
            
            <div className="relative p-4 sm:p-6 lg:p-8 glass-effect rounded-2xl sm:rounded-3xl border-2 border-white/20">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 lg:mb-8">
                <div className="p-2 sm:p-3 lg:p-4 glass-effect rounded-xl">
                  <Newspaper className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    Análisis por Fuente
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-lg text-white/70">
                    Distribución de sentimiento según origen del contenido
                  </p>
                </div>
              </div>

              {isLoadingSources ? (
                <div className="flex justify-center items-center h-[350px] sm:h-[400px] lg:h-[500px]">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-spin text-purple-400" />
                </div>
              ) : sourceChartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={typeof window !== 'undefined' && window.innerWidth < 640 ? 350 : window.innerWidth < 1024 ? 400 : 500}>
                    <BarChart data={sourceChartData} margin={{ top: 20, right: 10, left: 0, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis 
                        dataKey="name" 
                        stroke="rgba(255,255,255,0.9)"
                        style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '9px' : '11px', fontWeight: 600 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.9)"
                        style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '10px' : '11px', fontWeight: 600 }}
                        width={typeof window !== 'undefined' && window.innerWidth < 640 ? 40 : 60}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        formatter={(value) => (
                          <span style={{ color: '#ffffff', fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '11px' : '13px', fontWeight: 600 }}>
                            {value === 'positive' ? 'Positivo' : value === 'neutral' ? 'Neutral' : 'Negativo'}
                          </span>
                        )}
                      />
                      <Bar dataKey="positive" fill="#22c55e" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="neutral" fill="#94a3b8" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="negative" fill="#ef4444" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Tabla responsive */}
                  <div className="mt-4 sm:mt-6 lg:mt-8 glass-effect rounded-xl sm:rounded-2xl overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-white">Fuente</th>
                          <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-green-400">Positivo</th>
                          <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-gray-400">Neutral</th>
                          <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-red-400">Negativo</th>
                          <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-cyan-400">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {sourceData.map((source, index) => (
                          <tr key={index} className="hover:bg-white/5 transition-colors">
                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 glass-effect rounded-lg text-cyan-400">
                                  {getSourceIcon(source.source)}
                                </div>
                                <span className="text-white font-medium text-xs sm:text-sm">
                                  {sourceLabels[source.source] || source.source}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
                              <div className="text-green-400 font-bold text-sm sm:text-base">{source.positive}</div>
                              <div className="text-[10px] sm:text-xs text-green-400/70">{source.positive_pct.toFixed(1)}%</div>
                            </td>
                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
                              <div className="text-gray-400 font-bold text-sm sm:text-base">{source.neutral}</div>
                              <div className="text-[10px] sm:text-xs text-gray-400/70">{source.neutral_pct.toFixed(1)}%</div>
                            </td>
                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
                              <div className="text-red-400 font-bold text-sm sm:text-base">{source.negative}</div>
                              <div className="text-[10px] sm:text-xs text-red-400/70">{source.negative_pct.toFixed(1)}%</div>
                            </td>
                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
                              <div className="text-cyan-400 font-bold text-base sm:text-lg">{source.total.toLocaleString()}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="flex justify-center items-center h-[350px] sm:h-[400px] lg:h-[500px] text-white/70 text-sm">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>

          {/* Country Analysis - Responsive */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 blur-3xl rounded-2xl sm:rounded-3xl"></div>
            
            <div className="relative p-4 sm:p-6 lg:p-8 glass-effect rounded-2xl sm:rounded-3xl border-2 border-white/20">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 lg:mb-8">
                <div className="p-2 sm:p-3 lg:p-4 glass-effect rounded-xl">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    Análisis Geográfico
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-lg text-white/70">
                    Distribución de sentimiento por país
                  </p>
                </div>
              </div>

              {isLoadingCountries ? (
                <div className="flex justify-center items-center h-[350px] sm:h-[400px] lg:h-[500px]">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-spin text-cyan-400" />
                </div>
              ) : countryChartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={typeof window !== 'undefined' && window.innerWidth < 640 ? 350 : window.innerWidth < 1024 ? 400 : 500}>
                    <BarChart data={countryChartData} margin={{ top: 20, right: 10, left: 0, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis 
                        dataKey="name" 
                        stroke="rgba(255,255,255,0.9)"
                        style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '9px' : '11px', fontWeight: 600 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.9)"
                        style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '10px' : '11px', fontWeight: 600 }}
                        width={typeof window !== 'undefined' && window.innerWidth < 640 ? 40 : 60}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        formatter={(value) => (
                          <span style={{ color: '#ffffff', fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '11px' : '13px', fontWeight: 600 }}>
                            {value === 'positive' ? 'Positivo' : value === 'neutral' ? 'Neutral' : 'Negativo'}
                          </span>
                        )}
                      />
                      <Bar dataKey="positive" fill="#22c55e" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="neutral" fill="#94a3b8" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="negative" fill="#ef4444" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Tabla responsive */}
                  <div className="mt-4 sm:mt-6 lg:mt-8 glass-effect rounded-xl sm:rounded-2xl overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-white">País</th>
                          <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-green-400">Positivo</th>
                          <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-gray-400">Neutral</th>
                          <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-red-400">Negativo</th>
                          <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-cyan-400">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {countryData.map((country, index) => (
                          <tr key={index} className="hover:bg-white/5 transition-colors">
                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 glass-effect rounded-lg">
                                  <span className="text-xl sm:text-2xl">{getFlagEmoji(country.country)}</span>
                                </div>
                                <span className="text-white font-medium text-xs sm:text-sm">
                                  {countryLabels[country.country] || country.country}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
                              <div className="text-green-400 font-bold text-sm sm:text-base">{country.positive}</div>
                              <div className="text-[10px] sm:text-xs text-green-400/70">{country.positive_pct.toFixed(1)}%</div>
                            </td>
                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
                              <div className="text-gray-400 font-bold text-sm sm:text-base">{country.neutral}</div>
                              <div className="text-[10px] sm:text-xs text-gray-400/70">{country.neutral_pct.toFixed(1)}%</div>
                            </td>
                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
                              <div className="text-red-400 font-bold text-sm sm:text-base">{country.negative}</div>
                              <div className="text-[10px] sm:text-xs text-red-400/70">{country.negative_pct.toFixed(1)}%</div>
                            </td>
                            <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
                              <div className="text-cyan-400 font-bold text-base sm:text-lg">{country.total.toLocaleString()}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="flex justify-center items-center h-[350px] sm:h-[400px] lg:h-[500px] text-white/70 text-sm">
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

export default InformeSentimiento;
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Sidebar from '@/components/Sidebar';
import { Loader2, CalendarDays, ArrowLeft, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import SoftMathBackground from '@/components/SoftMathBackground';
import Header from '@/components/Header';

interface LanguageRanking {
  language: string;
  mentions: number;
  percentage: number;
}

interface RankingData {
  total_mentions: number;
  languages: LanguageRanking[];
}

const RankingLenguajes = () => {
  const { userEmail, companyId, setCompanyId, logout } = useAuth();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2025, 0, 1),
    to: new Date()
  });
  const [limit, setLimit] = useState<number>(5);
  const navigate = useNavigate();

  const limitOptions = [5, 10, 20, 50];

  const languageConfig: Record<string, { name: string; flag: string }> = {
    'es': { name: 'Español', flag: '🇪🇸' },
    'en': { name: 'Inglés', flag: '🇬🇧' },
    'fr': { name: 'Francés', flag: '🇫🇷' },
    'de': { name: 'Alemán', flag: '🇩🇪' },
    'it': { name: 'Italiano', flag: '🇮🇹' },
    'pt': { name: 'Portugués', flag: '🇵🇹' },
    'ru': { name: 'Ruso', flag: '🇷🇺' },
    'ja': { name: 'Japonés', flag: '🇯🇵' },
    'zh': { name: 'Chino', flag: '🇨🇳' },
    'ko': { name: 'Coreano', flag: '🇰🇷' },
    'ar': { name: 'Árabe', flag: '🇸🇦' },
    'hi': { name: 'Hindi', flag: '🇮🇳' },
    'nl': { name: 'Neerlandés', flag: '🇳🇱' },
    'pl': { name: 'Polaco', flag: '🇵🇱' },
    'tr': { name: 'Turco', flag: '🇹🇷' },
    'sv': { name: 'Sueco', flag: '🇸🇪' },
    'da': { name: 'Danés', flag: '🇩🇰' },
    'no': { name: 'Noruego', flag: '🇳🇴' },
    'fi': { name: 'Finés', flag: '🇫🇮' },
    'cs': { name: 'Checo', flag: '🇨🇿' },
    'el': { name: 'Griego', flag: '🇬🇷' },
    'he': { name: 'Hebreo', flag: '🇮🇱' },
    'th': { name: 'Tailandés', flag: '🇹🇭' },
    'vi': { name: 'Vietnamita', flag: '🇻🇳' },
    'id': { name: 'Indonesio', flag: '🇮🇩' },
    'ms': { name: 'Malayo', flag: '🇲🇾' },
    'uk': { name: 'Ucraniano', flag: '🇺🇦' },
    'ro': { name: 'Rumano', flag: '🇷🇴' },
    'hu': { name: 'Húngaro', flag: '🇭🇺' },
    'sk': { name: 'Eslovaco', flag: '🇸🇰' },
    'bg': { name: 'Búlgaro', flag: '🇧🇬' },
    'hr': { name: 'Croata', flag: '🇭🇷' },
    'sr': { name: 'Serbio', flag: '🇷🇸' },
    'ca': { name: 'Catalán', flag: '🏴' },
    'eu': { name: 'Euskera', flag: '🏴' },
    'gl': { name: 'Gallego', flag: '🏴' },
  };

  const getLanguageInfo = (code: string) => {
    const config = languageConfig[code.toLowerCase()];
    if (config) return config;
    
    return {
      name: code.toUpperCase(),
      flag: '🌐'
    };
  };

  const handleLanguageClick = (languageCode: string) => {
    if (!dateRange.from || !dateRange.to) return;
    
    const params = new URLSearchParams({
      language: languageCode,
      date_from: format(dateRange.from, 'yyyy-MM-dd'),
      date_to: format(dateRange.to, 'yyyy-MM-dd')
    });
    
    navigate(`/lista-menciones?${params.toString()}`);
  };

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
  }, [companyId, dateRange, limit]);

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
      
      const endpoint = `/api/stats/language/top_languages?company_id=${companyId}&from=${fromStr}&to=${toStr}&limit=${limit}`;
      
      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error('Error al obtener ranking de idiomas');
      
      const result = await response.json();
      
      const languages = result.data.top_languages || [];
      const total = languages.reduce((sum: number, lang: LanguageRanking) => sum + lang.mentions, 0);
      
      setRankingData({
        total_mentions: total,
        languages: languages
      });
    } catch (error) {
      toast.error('Error al cargar ranking de idiomas');
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
                Ranking de Idiomas
              </h1>
              <p className="text-sm sm:text-base text-white/70">
                Distribución de menciones por idioma - Haz clic para ver detalles
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
                  <CalendarDays className="mr-2 h-4 w-4 shrink-0" />
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

            {/* Total Mentions */}
            {rankingData && (
              <div className="glass-card px-3 sm:px-4 py-2 border border-white/10 w-full sm:w-auto sm:ml-auto">
                <p className="text-xs sm:text-sm text-white/70">Total de menciones</p>
                <p className="text-lg sm:text-xl font-bold text-white">
                  {rankingData.total_mentions.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Rankings List */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-cyan-500/10 blur-3xl rounded-2xl"></div>
            
            <div className="relative p-0 sm:p-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-[300px] sm:h-[400px]">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-spin text-primary" />
                </div>
              ) : rankingData && rankingData.languages.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {rankingData.languages.map((lang, index) => {
                    const langInfo = getLanguageInfo(lang.language);
                    
                    return (
                      <div
                        key={index}
                        onClick={() => handleLanguageClick(lang.language)}
                        className="glass-card p-4 sm:p-5 lg:p-6 border border-white/10 hover:bg-white/10 hover:border-cyan-400/30 transition-all duration-300 rounded-xl cursor-pointer group"
                      >
                        <div className="flex flex-col gap-4">
                          {/* Top section: Position + Flag + Language name */}
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] shrink-0">
                              #{index + 1}
                            </div>
                            
                            <div className="text-3xl sm:text-4xl lg:text-5xl shrink-0">
                              {langInfo.flag}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                                {langInfo.name}
                              </h3>
                              <p className="text-xs sm:text-sm text-white/70">
                                {lang.language.toUpperCase()}
                              </p>
                            </div>

                            <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>

                          {/* Stats section */}
                          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 sm:items-center">
                            {/* Progress Bar */}
                            <div className="flex-1">
                              <div className="flex justify-between text-xs sm:text-sm mb-1 sm:mb-2">
                                <span className="text-white/70">Porcentaje</span>
                                <span className="text-white font-bold">{lang.percentage.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 sm:h-3 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(lang.percentage, 100)}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Mentions */}
                            <div className="text-center sm:text-right sm:min-w-[100px] lg:min-w-[120px]">
                              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                                {lang.mentions.toLocaleString()}
                              </p>
                              <p className="text-xs sm:text-sm text-white/70">Menciones</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

export default RankingLenguajes;
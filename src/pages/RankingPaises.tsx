import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Sidebar from '@/components/Sidebar';
import { LogOut, Loader2, CalendarDays, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import SoftMathBackground from '@/components/SoftMathBackground';
import Header from '@/components/Header';

interface CountryRanking {
  country: string;
  mentions: number;
  percentage: number;
}

interface RankingData {
  total_mentions: number;
  countries: CountryRanking[];
}

const RankingPaises = () => {
  const { userEmail, companyId, setCompanyId, logout } = useAuth();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2020, 0, 1),
    to: new Date()
  });
  const [limit, setLimit] = useState<number>(10);
  const navigate = useNavigate();

  const limitOptions = [5, 10, 20, 50, 100];

  // Mapeo de códigos ISO a nombres de países en español
  const countryNames: Record<string, string> = {
    'ES': 'España',
    'MX': 'México',
    'US': 'Estados Unidos',
    'AR': 'Argentina',
    'CO': 'Colombia',
    'CL': 'Chile',
    'PE': 'Perú',
    'VE': 'Venezuela',
    'EC': 'Ecuador',
    'GT': 'Guatemala',
    'CU': 'Cuba',
    'BO': 'Bolivia',
    'DO': 'República Dominicana',
    'HN': 'Honduras',
    'PY': 'Paraguay',
    'SV': 'El Salvador',
    'NI': 'Nicaragua',
    'CR': 'Costa Rica',
    'PA': 'Panamá',
    'UY': 'Uruguay',
    'GB': 'Reino Unido',
    'FR': 'Francia',
    'DE': 'Alemania',
    'IT': 'Italia',
    'PT': 'Portugal',
    'BR': 'Brasil',
    'CA': 'Canadá',
    'CN': 'China',
    'JP': 'Japón',
    'IN': 'India',
    'RU': 'Rusia',
    'AU': 'Australia',
  };

  const getCountryName = (code: string): string => {
    return countryNames[code] || code;
  };

  const getCountryFlag = (code: string): string => {
    // Convertir código ISO a emoji de bandera
    const codePoints = code
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
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
      
      const endpoint = `/api/stats/geo/top_countries?company_id=${companyId}&from=${fromStr}&to=${toStr}&limit=${limit}`;
      
      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error('Error al obtener ranking de países');
      
      const result = await response.json();
      setRankingData({
        total_mentions: result.data.total_mentions || 0,
        countries: result.data.countries || []
      });
    } catch (error) {
      toast.error('Error al cargar ranking de países');
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
              <h1 className="text-4xl font-bold text-white mb-2">Ranking de Países</h1>
              <p className="text-white/70">Distribución geográfica de menciones</p>
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
                  <CalendarDays className="mr-2 h-4 w-4" />
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

            {/* Total Mentions */}
            {rankingData && (
              <div className="ml-auto glass-card px-4 py-2 border border-white/10">
                <p className="text-sm text-white/70">Total de menciones</p>
                <p className="text-xl font-bold text-white">
                  {rankingData.total_mentions.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Rankings List */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-cyan-500/10 blur-3xl"></div>
            
            <div className="relative p-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-96">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : rankingData && rankingData.countries.length > 0 ? (
                <div className="space-y-3">
                  {rankingData.countries.map((country, index) => (
                    <div
                      key={index}
                      className="glass-card p-6 border border-white/10 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-4xl font-bold text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
                            #{index + 1}
                          </div>
                          
                          {/* Flag */}
                          <div className="text-5xl">
                            {getCountryFlag(country.country)}
                          </div>

                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white">
                              {getCountryName(country.country)}
                            </h3>
                            <p className="text-sm text-white/70">
                              {country.country}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-8 items-center">
                          {/* Progress Bar */}
                          <div className="w-48">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-white/70">Porcentaje</span>
                              <span className="text-white font-bold">{country.percentage.toFixed(1)}%</span>
                            </div>
                            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(country.percentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Mentions */}
                          <div className="text-right min-w-[120px]">
                            <p className="text-2xl font-bold text-white">
                              {country.mentions.toLocaleString()}
                            </p>
                            <p className="text-sm text-white/70">Menciones</p>
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

export default RankingPaises;
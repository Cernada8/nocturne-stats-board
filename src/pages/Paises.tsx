import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Sidebar from '@/components/Sidebar';
import { 
  Loader2, 
  Calendar as CalendarDays, 
  BookOpen, 
  MapPin,
  ArrowLeft,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import SoftMathBackground from '@/components/SoftMathBackground';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';

interface Alert {
  id: string;
  name: string;
}

interface CountryData {
  country_code: string;
  country_name?: string;
  total_mentions: number;
  total_reach?: number;
}

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

const Paises = () => {
  const { userEmail, companyId, setCompanyId } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2025, 0, 1),
    to: new Date()
  });

  const [countriesData, setCountriesData] = useState<CountryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<CountryData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const [limit, setLimit] = useState(50);

  const limitOptions = [10, 20, 50, 100, 200];

  // Función para navegar a lista de menciones con filtro de país
  const handleCountryClick = (countryCode: string) => {
    const params = new URLSearchParams();
    params.set('country', countryCode);
    
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
      fetchCountriesData();
    }
  }, [companyId, dateRange, selectedAlertId, limit]);

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

  const fetchCountriesData = async () => {
    if (!companyId || !dateRange.from || !dateRange.to) return;
    
    setIsLoading(true);
    try {
      const fromStr = format(dateRange.from, 'yyyy-MM-dd');
      const toStr = format(dateRange.to, 'yyyy-MM-dd');
      
      let endpoint = `/api/stats/geo/countries?company_id=${companyId}&from=${fromStr}&to=${toStr}&limit=${limit}&order_by=mentions`;
      if (selectedAlertId) endpoint += `&alert_id=${selectedAlertId}`;
      
      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error('Error al obtener datos de países');
      
      const result = await response.json();
      const countries = result.data.countries || [];
      
      console.log('Datos de países recibidos:', countries);
      
      setCountriesData(countries);
    } catch (error) {
      toast.error('Error al cargar datos de países');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const iso3ToIso2: { [key: string]: string } = {
    '724': 'ES', '840': 'US', '600': 'PY', '826': 'GB', '804': 'UA',
    '170': 'CO', '276': 'DE', '484': 'MX', '792': 'TR', '380': 'IT',
    '250': 'FR', '076': 'BR', '124': 'CA', '392': 'JP', '156': 'CN',
    '356': 'IN', '036': 'AU', '528': 'NL', '056': 'BE', '756': 'CH',
    '040': 'AT', '752': 'SE', '578': 'NO', '208': 'DK', '246': 'FI',
    '616': 'PL', '643': 'RU', '300': 'GR', '620': 'PT', '032': 'AR',
    '152': 'CL', '604': 'PE'
  };

  const getCountryColor = (geoId: string) => {
    if (!geoId) return '#1e293b';
    
    const isoA2 = iso3ToIso2[geoId];
    if (!isoA2) return '#1e293b';
    
    const country = countriesData.find(c => 
      c.country_code?.toUpperCase() === isoA2.toUpperCase()
    );
    
    if (!country) return '#1e293b';

    const maxValue = Math.max(...countriesData.map(c => c.total_mentions || 0));
    const value = country.total_mentions || 0;
    
    if (maxValue === 0) return '#1e293b';
    
    const intensity = value / maxValue;

    if (intensity > 0.8) return '#06b6d4';
    if (intensity > 0.6) return '#0891b2';
    if (intensity > 0.4) return '#0e7490';
    if (intensity > 0.2) return '#155e75';
    if (intensity > 0) return '#164e63';
    return '#1e293b';
  };

  const handleMouseEnter = (geo: any, event: any) => {
    const geoId = geo.id;
    const isoA2 = iso3ToIso2[geoId];
    
    if (!isoA2) return;
    
    const country = countriesData.find(c => 
      c.country_code?.toUpperCase() === isoA2.toUpperCase()
    );
    
    if (country) {
      setHoveredCountry(country);
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseLeave = () => {
    setHoveredCountry(null);
  };

  const handleMouseMove = (event: any) => {
    if (hoveredCountry) {
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMapCountryClick = (geo: any) => {
    const geoId = geo.id;
    const isoA2 = iso3ToIso2[geoId];
    
    if (!isoA2) return;
    
    const country = countriesData.find(c => 
      c.country_code?.toUpperCase() === isoA2.toUpperCase()
    );
    
    if (country && country.total_mentions > 0) {
      handleCountryClick(country.country_code);
    }
  };

  const topCountries = countriesData.slice(0, 10);

  return (
    <div className="min-h-screen max-h-screen overflow-hidden flex flex-col lg:flex-row">
      <SoftMathBackground />
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-slate-900/50 hover:scrollbar-thumb-slate-600/70">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          <Header />

          {/* Header */}
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
                Análisis Geográfico
              </h1>
              <p className="text-sm sm:text-base text-white/70">
                Mapa de calor de menciones por país
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center flex-wrap">
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

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-effect border-white/10 hover:bg-white/10 text-white w-full sm:w-auto text-xs sm:text-sm"
                >
                  Límite: {limit}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[120px] p-2 glass-card border-white/10">
                <div className="space-y-1">
                  {limitOptions.map((lim) => (
                    <Button
                      key={lim}
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-start text-white hover:bg-white/10 text-xs sm:text-sm ${
                        limit === lim ? 'bg-white/10' : ''
                      }`}
                      onClick={() => setLimit(lim)}
                    >
                      {lim}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Map Section */}
          <div className="relative py-4 sm:py-6 lg:py-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 sm:mb-8 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 sm:p-4 glass-effect rounded-xl shrink-0">
                  <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    Mapa de Calor Global
                  </h2>
                  <p className="text-sm sm:text-base lg:text-lg text-white/70">
                    Distribución mundial de menciones
                  </p>
                </div>
              </div>

              {/* Legend */}
              <div className="glass-effect px-4 sm:px-6 py-3 sm:py-4 rounded-xl w-full sm:w-auto">
                <p className="text-white/70 text-xs sm:text-sm mb-2">Intensidad</p>
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-xs">Baja</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-3 sm:w-6 sm:h-4 rounded" style={{ backgroundColor: '#164e63' }}></div>
                    <div className="w-4 h-3 sm:w-6 sm:h-4 rounded" style={{ backgroundColor: '#155e75' }}></div>
                    <div className="w-4 h-3 sm:w-6 sm:h-4 rounded" style={{ backgroundColor: '#0e7490' }}></div>
                    <div className="w-4 h-3 sm:w-6 sm:h-4 rounded" style={{ backgroundColor: '#0891b2' }}></div>
                    <div className="w-4 h-3 sm:w-6 sm:h-4 rounded" style={{ backgroundColor: '#06b6d4' }}></div>
                  </div>
                  <span className="text-white/50 text-xs">Alta</span>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-[350px] sm:h-[500px] lg:h-[700px]">
                <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-spin text-cyan-400" />
              </div>
            ) : (
              <div 
                className="relative rounded-xl lg:rounded-2xl overflow-hidden"
                style={{ 
                  filter: 'drop-shadow(0 0 30px rgba(6, 182, 212, 0.2))',
                  height: 'auto',
                  minHeight: '350px'
                }}
                onMouseMove={handleMouseMove}
              >
                <div className="h-[350px] sm:h-[500px] lg:h-[700px]">
                  <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                      scale: 147
                    }}
                    style={{
                      width: '100%',
                      height: '100%'
                    }}
                  >
                    <ZoomableGroup zoom={1}>
                      <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                          geographies.map((geo) => {
                            const geoId = geo.id;
                            const fillColor = getCountryColor(geoId);
                            const isoA2 = iso3ToIso2[geoId];
                            const hasData = isoA2 && countriesData.some(c => 
                              c.country_code?.toUpperCase() === isoA2.toUpperCase()
                            );
                            
                            return (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill={fillColor}
                                stroke="#0f172a"
                                strokeWidth={0.5}
                                style={{
                                  default: {
                                    outline: 'none',
                                    transition: 'all 0.3s ease'
                                  },
                                  hover: {
                                    fill: hasData ? '#22d3ee' : fillColor,
                                    outline: 'none',
                                    filter: hasData ? 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.8))' : 'none',
                                    cursor: hasData ? 'pointer' : 'default'
                                  },
                                  pressed: {
                                    outline: 'none'
                                  }
                                }}
                                onMouseEnter={(e) => handleMouseEnter(geo, e)}
                                onMouseLeave={handleMouseLeave}
                                onClick={() => handleMapCountryClick(geo)}
                              />
                            );
                          })
                        }
                      </Geographies>
                    </ZoomableGroup>
                  </ComposableMap>
                </div>

                {hoveredCountry && (
                  <div
                    className="fixed glass-card p-3 sm:p-4 border border-cyan-300/30 shadow-xl shadow-cyan-400/20 pointer-events-none z-50"
                    style={{
                      left: tooltipPosition.x + 10,
                      top: tooltipPosition.y + 10
                    }}
                  >
                    <p className="text-cyan-300 font-bold mb-1 sm:mb-2 flex items-center gap-2 text-xs sm:text-sm">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                      {hoveredCountry.country_name || hoveredCountry.country_code}
                    </p>
                    <p className="text-white text-xs sm:text-sm">
                      Menciones: <span className="font-bold text-cyan-400">
                        {hoveredCountry.total_mentions?.toLocaleString() ?? '0'}
                      </span>
                    </p>
                    <p className="text-cyan-400/70 text-xs mt-2 italic">
                      Click para ver menciones
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Top 10 Countries Table */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 blur-3xl rounded-2xl"></div>
            
            <div className="relative p-4 sm:p-6 lg:p-8 glass-effect rounded-xl lg:rounded-2xl border-2 border-white/20">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="p-2 sm:p-3 glass-effect rounded-xl shrink-0">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    Top 10 Países
                  </h2>
                  <p className="text-xs sm:text-sm text-white/70">Ranking por menciones</p>
                </div>
              </div>

              <div className="glass-effect rounded-xl lg:rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-white">
                          Pos
                        </th>
                        <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-white">
                          País
                        </th>
                        <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-cyan-400">
                          Menciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {topCountries.map((country, index) => (
                        <tr 
                          key={country.country_code} 
                          className="hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() => handleCountryClick(country.country_code)}
                        >
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                            <div 
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg"
                              style={{ 
                                backgroundColor: index < 3 ? '#06b6d4' + '30' : '#0891b2' + '20',
                                color: '#06b6d4'
                              }}
                            >
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <span className="text-xl sm:text-2xl">{getFlagEmoji(country.country_code)}</span>
                              <span className="text-white font-medium text-xs sm:text-sm lg:text-base truncate">
                                {country.country_name || country.country_code}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
                            <div className="text-cyan-400 font-bold text-sm sm:text-base lg:text-lg">
                              {country.total_mentions?.toLocaleString() ?? '0'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getFlagEmoji = (countryCode: string): string => {
  if (!countryCode) return '🌍';
  
  const flags: { [key: string]: string } = {
    'ES': '🇪🇸', 'US': '🇺🇸', 'IT': '🇮🇹', 'FR': '🇫🇷', 'GB': '🇬🇧',
    'MX': '🇲🇽', 'DE': '🇩🇪', 'PT': '🇵🇹', 'AR': '🇦🇷', 'CO': '🇨🇴',
    'CL': '🇨🇱', 'PE': '🇵🇪', 'BR': '🇧🇷', 'CA': '🇨🇦', 'JP': '🇯🇵',
    'CN': '🇨🇳', 'IN': '🇮🇳', 'AU': '🇦🇺', 'NL': '🇳🇱', 'BE': '🇧🇪',
    'CH': '🇨🇭', 'AT': '🇦🇹', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰',
    'FI': '🇫🇮', 'PL': '🇵🇱', 'RU': '🇷🇺', 'TR': '🇹🇷', 'GR': '🇬🇷',
    'PY': '🇵🇾', 'UA': '🇺🇦'
  };
  
  return flags[countryCode.toUpperCase()] || '🌍';
};

export default Paises;
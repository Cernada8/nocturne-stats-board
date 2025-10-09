import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Sidebar from '@/components/Sidebar';
import { LogOut, Loader2, CalendarDays, ArrowLeft, Youtube, Globe, MessageSquare, Video, Newspaper, Twitter, Facebook, Instagram, Linkedin, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import SoftMathBackground from '@/components/SoftMathBackground';
import Header from '@/components/Header';

interface SourceRanking {
  source: string;
  total_mentions: number;
  total_reach: number;
}

const RankingFuentes = () => {
  const { userEmail, companyId, setCompanyId, logout } = useAuth();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [rankings, setRankings] = useState<SourceRanking[]>([]);
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

  // Mapeo de fuentes a íconos y colores
  const sourceConfig: Record<string, { icon: any; color: string; label: string }> = {
    'youtube': { icon: Youtube, color: 'text-red-500', label: 'YouTube' },
    'twitter': { icon: Twitter, color: 'text-blue-400', label: 'Twitter/X' },
    'facebook': { icon: Facebook, color: 'text-blue-600', label: 'Facebook' },
    'instagram': { icon: Instagram, color: 'text-pink-500', label: 'Instagram' },
    'linkedin': { icon: Linkedin, color: 'text-blue-700', label: 'LinkedIn' },
    'reddit': { icon: MessageSquare, color: 'text-orange-500', label: 'Reddit' },
    'vimeo': { icon: Video, color: 'text-cyan-500', label: 'Vimeo' },
    'tiktok': { icon: Video, color: 'text-gray-900', label: 'TikTok' },
    'news-blogs': { icon: Newspaper, color: 'text-gray-400', label: 'Noticias y Blogs' },
    'web': { icon: Globe, color: 'text-green-500', label: 'Web' },
    'forums': { icon: MessageSquare, color: 'text-purple-500', label: 'Foros' },
    'pinterest': { icon: TrendingUp, color: 'text-red-600', label: 'Pinterest' },
  };

  const getSourceConfig = (source: string) => {
    const config = sourceConfig[source.toLowerCase()];
    if (config) return config;
    
    return {
      icon: Globe,
      color: 'text-gray-400',
      label: source.charAt(0).toUpperCase() + source.slice(1).replace(/-/g, ' ')
    };
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
      
      const endpoint = `/api/stats/source/top_sources?company_id=${companyId}&from=${fromStr}&to=${toStr}&limit=${limit}&order_by=${orderBy}`;
      
      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error('Error al obtener ranking de fuentes');
      
      const result = await response.json();
      setRankings(result.data.sources || []);
    } catch (error) {
      toast.error('Error al cargar ranking de fuentes');
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

          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/rankings')}
              variant="outline"
              className="glass-effect border-white/10 hover:bg-white/10 text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Ranking de Fuentes</h1>
              <p className="text-white/70">Top de fuentes ordenadas por menciones o alcance</p>
            </div>
          </div>

          <div className="flex gap-4 items-center flex-wrap">
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

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-cyan-500/10 blur-3xl"></div>
            
            <div className="relative p-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-96">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : rankings.length > 0 ? (
                <div className="space-y-3">
                  {rankings.map((source, index) => {
                    const config = getSourceConfig(source.source);
                    const IconComponent = config.icon;
                    
                    return (
                      <div
                        key={index}
                        className="glass-card p-6 border border-white/10 hover:bg-white/10 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-4xl font-bold text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
                              #{index + 1}
                            </div>
                            
                            <div className={`p-4 bg-white/10 rounded-xl ${config.color}`}>
                              <IconComponent className="w-10 h-10" />
                            </div>

                            <div>
                              <h3 className="text-xl font-bold text-white">{config.label}</h3>
                              <p className="text-sm text-white/70">{source.source}</p>
                            </div>
                          </div>

                          <div className="flex gap-8 text-right">
                            <div>
                              <p className="text-2xl font-bold text-white">
                                {source.total_mentions.toLocaleString()}
                              </p>
                              <p className="text-sm text-white/70">Menciones</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-white">
                                {source.total_reach.toLocaleString()}
                              </p>
                              <p className="text-sm text-white/70">Alcance</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

export default RankingFuentes;
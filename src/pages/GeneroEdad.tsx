import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Sidebar from '@/components/Sidebar';
import { 
  Loader2, 
  BookOpen, 
  Users,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import SoftMathBackground from '@/components/SoftMathBackground';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';

interface Alert {
  id: string;
  name: string;
}

interface AgeData {
  age_range: string;
  mentions: number;
  percentage: number;
}

interface GenderData {
  male: number;
  female: number;
  male_pct: number;
  female_pct: number;
}

interface PyramidData {
  age_range: string;
  male_mentions: number;
  female_mentions: number;
  male_pct: number;
  female_pct: number;
}

const GeneroEdad = () => {
  const { userEmail, companyId, setCompanyId } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  const [ageData, setAgeData] = useState<AgeData[]>([]);
  const [genderData, setGenderData] = useState<GenderData | null>(null);
  const [totalMentions, setTotalMentions] = useState(0);
  
  const [isLoadingAge, setIsLoadingAge] = useState(false);
  const [isLoadingGender, setIsLoadingGender] = useState(false);

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
    if (companyId) {
      fetchAgeData();
      fetchGenderData();
    }
  }, [companyId, selectedAlertId]);

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

  const fetchAgeData = async () => {
    if (!companyId) return;
    
    setIsLoadingAge(true);
    try {
      let endpoint = `/api/stats/demographics/age?company_id=${companyId}`;
      if (selectedAlertId) endpoint += `&alert_id=${selectedAlertId}`;
      
      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error('Error al obtener datos de edad');
      
      const result = await response.json();
      setAgeData(result.data.ages || []);
      setTotalMentions(result.data.total_mentions || 0);
    } catch (error) {
      toast.error('Error al cargar datos de edad');
      console.error(error);
    } finally {
      setIsLoadingAge(false);
    }
  };

  const fetchGenderData = async () => {
    if (!companyId) return;
    
    setIsLoadingGender(true);
    try {
      let endpoint = `/api/stats/demographics/gender?company_id=${companyId}`;
      if (selectedAlertId) endpoint += `&alert_id=${selectedAlertId}`;
      
      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error('Error al obtener datos de género');
      
      const result = await response.json();
      setGenderData(result.data.gender || null);
    } catch (error) {
      toast.error('Error al cargar datos de género');
      console.error(error);
    } finally {
      setIsLoadingGender(false);
    }
  };

  const getPyramidData = (): PyramidData[] => {
    if (!genderData || ageData.length === 0) return [];

    return ageData.map(age => {
      const maleMentions = Math.round((age.mentions * genderData.male_pct) / 100);
      const femaleMentions = Math.round((age.mentions * genderData.female_pct) / 100);
      
      return {
        age_range: age.age_range,
        male_mentions: maleMentions,
        female_mentions: femaleMentions,
        male_pct: (maleMentions / totalMentions) * 100,
        female_pct: (femaleMentions / totalMentions) * 100
      };
    }).reverse();
  };

  const pyramidData = getPyramidData();
  const maxValue = Math.max(
    ...pyramidData.map(d => Math.max(d.male_pct, d.female_pct))
  );

  const isLoading = isLoadingAge || isLoadingGender;

  return (
    <div className="min-h-screen max-h-screen overflow-hidden flex flex-col lg:flex-row">
      <SoftMathBackground />
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-slate-900/50 hover:scrollbar-thumb-slate-600/70">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          <Header />

          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <Button
              onClick={() => navigate('/estadisticas')}
              variant="outline"
              className="glass-effect border-white/10 hover:bg-white/10 text-white shrink-0"
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">
                Análisis Demográfico
              </h1>
              <p className="text-sm sm:text-base text-white/70">Distribución por género y edad</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 sm:gap-4 items-center flex-wrap">
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
          </div>

          {/* Gender Summary Cards */}
          {genderData && !isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 blur-3xl rounded-2xl"></div>
                <div className="relative p-4 sm:p-6 lg:p-8 glass-effect rounded-2xl border-2 border-blue-400/30">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/70 text-sm sm:text-base lg:text-lg mb-1 sm:mb-2">Masculino</p>
                      <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-400 truncate">
                        {genderData.male_pct.toFixed(1)}%
                      </p>
                      <p className="text-xs sm:text-sm text-white/60 mt-1 sm:mt-2">
                        {genderData.male.toLocaleString()} perfiles
                      </p>
                    </div>
                    <div className="p-3 sm:p-4 lg:p-6 glass-effect rounded-xl lg:rounded-2xl shrink-0">
                      <Users className="h-8 w-8 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-blue-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-pink-600/20 blur-3xl rounded-2xl"></div>
                <div className="relative p-4 sm:p-6 lg:p-8 glass-effect rounded-2xl border-2 border-pink-400/30">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/70 text-sm sm:text-base lg:text-lg mb-1 sm:mb-2">Femenino</p>
                      <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-pink-400 truncate">
                        {genderData.female_pct.toFixed(1)}%
                      </p>
                      <p className="text-xs sm:text-sm text-white/60 mt-1 sm:mt-2">
                        {genderData.female.toLocaleString()} perfiles
                      </p>
                    </div>
                    <div className="p-3 sm:p-4 lg:p-6 glass-effect rounded-xl lg:rounded-2xl shrink-0">
                      <Users className="h-8 w-8 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-pink-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Population Pyramid */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl rounded-3xl"></div>
            
            <div className="relative p-4 sm:p-6 lg:p-8 glass-effect rounded-2xl lg:rounded-3xl border-2 border-white/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 sm:mb-8">
                <div className="p-3 sm:p-4 glass-effect rounded-xl shrink-0">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
                    Pirámide Demográfica
                  </h2>
                  <p className="text-sm sm:text-base lg:text-lg text-white/70">
                    Distribución por género y rango de edad
                  </p>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-[300px] sm:h-[400px] lg:h-[600px]">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-spin text-purple-400" />
                </div>
              ) : pyramidData.length > 0 ? (
                <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-3 sm:w-8 sm:h-4 bg-blue-500 rounded"></div>
                      <span className="text-white font-medium text-sm sm:text-base">Masculino</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-3 sm:w-8 sm:h-4 bg-pink-500 rounded"></div>
                      <span className="text-white font-medium text-sm sm:text-base">Femenino</span>
                    </div>
                  </div>

                  {/* Pyramid Chart - Desktop/Tablet Version */}
                  <div className="hidden sm:block space-y-2 lg:space-y-3">
                    {pyramidData.map((data, index) => (
                      <div key={index} className="flex items-center gap-2 lg:gap-4">
                        {/* Male side (left) */}
                        <div className="flex-1 flex justify-end items-center gap-2 lg:gap-3">
                          <span className="text-white/70 text-xs lg:text-sm font-medium min-w-[45px] lg:min-w-[60px] text-right">
                            {data.male_pct.toFixed(1)}%
                          </span>
                          <div className="relative h-8 lg:h-10 flex-1 max-w-[200px] lg:max-w-[400px]">
                            <div 
                              className="absolute right-0 h-full bg-gradient-to-l from-blue-500 to-blue-600 rounded-l-lg transition-all duration-500 hover:from-blue-400 hover:to-blue-500 group"
                              style={{ width: `${(data.male_pct / maxValue) * 100}%` }}
                            >
                              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-lg"></div>
                            </div>
                          </div>
                          <span className="text-blue-400 text-xs font-bold min-w-[30px] lg:min-w-[40px] text-right">
                            {data.male_mentions}
                          </span>
                        </div>

                        {/* Age label (center) */}
                        <div className="min-w-[60px] lg:min-w-[80px] text-center shrink-0">
                          <div className="glass-effect px-2 py-1 lg:px-4 lg:py-2 rounded-lg lg:rounded-xl">
                            <span className="text-white font-bold text-xs lg:text-sm">{data.age_range}</span>
                          </div>
                        </div>

                        {/* Female side (right) */}
                        <div className="flex-1 flex items-center gap-2 lg:gap-3">
                          <span className="text-pink-400 text-xs font-bold min-w-[30px] lg:min-w-[40px]">
                            {data.female_mentions}
                          </span>
                          <div className="relative h-8 lg:h-10 flex-1 max-w-[200px] lg:max-w-[400px]">
                            <div 
                              className="absolute left-0 h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-r-lg transition-all duration-500 hover:from-pink-400 hover:to-pink-500 group"
                              style={{ width: `${(data.female_pct / maxValue) * 100}%` }}
                            >
                              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-r-lg"></div>
                            </div>
                          </div>
                          <span className="text-white/70 text-xs lg:text-sm font-medium min-w-[45px] lg:min-w-[60px]">
                            {data.female_pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pyramid Chart - Mobile Version (Vertical Bars) */}
                  <div className="sm:hidden space-y-3">
                    {pyramidData.map((data, index) => (
                      <div key={index} className="glass-effect rounded-xl p-3">
                        <div className="text-center mb-3">
                          <span className="text-white font-bold text-sm">{data.age_range}</span>
                        </div>
                        
                        <div className="space-y-2">
                          {/* Male bar */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-blue-400 text-xs font-medium">Masculino</span>
                              <span className="text-blue-400 text-xs font-bold">
                                {data.male_mentions} ({data.male_pct.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="relative h-6 w-full bg-white/5 rounded-lg overflow-hidden">
                              <div 
                                className="absolute left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                                style={{ width: `${(data.male_pct / maxValue) * 100}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Female bar */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-pink-400 text-xs font-medium">Femenino</span>
                              <span className="text-pink-400 text-xs font-bold">
                                {data.female_mentions} ({data.female_pct.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="relative h-6 w-full bg-white/5 rounded-lg overflow-hidden">
                              <div 
                                className="absolute left-0 h-full bg-gradient-to-r from-pink-500 to-pink-600 transition-all duration-500"
                                style={{ width: `${(data.female_pct / maxValue) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total mentions */}
                  <div className="text-center pt-4 sm:pt-6 border-t border-white/10">
                    <p className="text-sm sm:text-base text-white/70">Total de menciones analizadas</p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-cyan-400 mt-1 sm:mt-2">
                      {totalMentions.toLocaleString()}
                    </p>
                  </div>

                  {/* Detailed Table */}
                  <div className="mt-6 sm:mt-8 glass-effect rounded-xl lg:rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px]">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-white">
                              Rango de Edad
                            </th>
                            <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-blue-400">
                              Masculino
                            </th>
                            <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-pink-400">
                              Femenino
                            </th>
                            <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-cyan-400">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {pyramidData.slice().reverse().map((data, index) => {
                            const total = data.male_mentions + data.female_mentions;
                            return (
                              <tr key={index} className="hover:bg-white/5 transition-colors">
                                <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                                  <span className="text-white font-medium text-xs sm:text-sm">
                                    {data.age_range}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
                                  <div className="text-blue-400 font-bold text-xs sm:text-sm">
                                    {data.male_mentions}
                                  </div>
                                  <div className="text-xs text-blue-400/70">
                                    {data.male_pct.toFixed(1)}%
                                  </div>
                                </td>
                                <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
                                  <div className="text-pink-400 font-bold text-xs sm:text-sm">
                                    {data.female_mentions}
                                  </div>
                                  <div className="text-xs text-pink-400/70">
                                    {data.female_pct.toFixed(1)}%
                                  </div>
                                </td>
                                <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
                                  <div className="text-cyan-400 font-bold text-sm sm:text-base lg:text-lg">
                                    {total}
                                  </div>
                                  <div className="text-xs text-cyan-400/70">
                                    {((total / totalMentions) * 100).toFixed(1)}%
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center h-[300px] sm:h-[400px] lg:h-[600px] text-sm sm:text-base text-white/70">
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

export default GeneroEdad;
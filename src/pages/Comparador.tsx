import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import Header from '@/components/Header';
import SoftMathBackground from '@/components/SoftMathBackground';

interface Alert {
  id: string;
  name: string;
}

const Comparador = () => {
  const navigate = useNavigate();
  const { userEmail, companyId, setCompanyId } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [blueTeam, setBlueTeam] = useState<Alert | null>(null);
  const [redTeam, setRedTeam] = useState<Alert | null>(null);
  const [draggedAlert, setDraggedAlert] = useState<Alert | null>(null);
  const [dragOverZone, setDragOverZone] = useState<'blue' | 'red' | null>(null);

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
    
    setIsLoadingAlerts(true);
    try {
      const response = await apiFetch(`/api/info/getAlerts?company_id=${companyId}`);
      if (!response.ok) throw new Error('Error al obtener alertas');
      
      const result = await response.json();
      setAlerts(result.data.alerts || []);
    } catch (error) {
      toast.error('Error al cargar alertas');
      console.error(error);
      setAlerts([]);
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  const handleAlertSelect = (alert: Alert, team: 'blue' | 'red') => {
    if (team === 'blue') {
      if (blueTeam?.id === alert.id) {
        setBlueTeam(null);
      } else if (redTeam?.id === alert.id) {
        toast.error('Esta alerta ya está seleccionada en el equipo rojo');
      } else {
        setBlueTeam(alert);
      }
    } else {
      if (redTeam?.id === alert.id) {
        setRedTeam(null);
      } else if (blueTeam?.id === alert.id) {
        toast.error('Esta alerta ya está seleccionada en el equipo azul');
      } else {
        setRedTeam(alert);
      }
    }
  };

  const getAvailableAlerts = () => {
    return alerts.filter(alert => 
      alert.id !== blueTeam?.id && alert.id !== redTeam?.id
    );
  };

  const handleCompare = () => {
    if (blueTeam && redTeam) {
      navigate(`/comparandoTopicos?blue=${blueTeam.id}&red=${redTeam.id}`);
    }
  };

  const handleDragStart = (alert: Alert) => {
    setDraggedAlert(alert);
  };

  const handleDragEnd = () => {
    setDraggedAlert(null);
    setDragOverZone(null);
  };

  const handleDragOver = (e: React.DragEvent, zone: 'blue' | 'red') => {
    e.preventDefault();
    setDragOverZone(zone);
  };

  const handleDragLeave = () => {
    setDragOverZone(null);
  };

  const handleDrop = (e: React.DragEvent, team: 'blue' | 'red') => {
    e.preventDefault();
    setDragOverZone(null);
    
    if (!draggedAlert) return;

    if (team === 'blue') {
      if (redTeam?.id === draggedAlert.id) {
        toast.error('Esta alerta ya está seleccionada en el equipo rojo');
      } else {
        setBlueTeam(draggedAlert);
      }
    } else {
      if (blueTeam?.id === draggedAlert.id) {
        toast.error('Esta alerta ya está seleccionada en el equipo azul');
      } else {
        setRedTeam(draggedAlert);
      }
    }
    
    setDraggedAlert(null);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-x-hidden">
      <SoftMathBackground />
      <Sidebar />
      
      <div className="flex-1 w-full px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-8 relative z-10">
        <div className="max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
          <Header />

          {/* VS Arena - Street Fighter Style */}
          <div className="space-y-8">
            {/* Selection Arena */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
              {/* Blue Team */}
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-center text-blue-400">
                  TÓPICO AZUL
                </h2>
                <div 
                  className={`relative aspect-square rounded-2xl border-4 ${
                    dragOverZone === 'blue' 
                      ? 'border-blue-300 shadow-[0_0_40px_rgba(59,130,246,0.7)] scale-105' 
                      : 'border-blue-500'
                  } bg-gradient-to-br from-blue-500/20 to-blue-900/30 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:border-blue-400 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]`}
                  onClick={() => {
                    if (blueTeam) {
                      setBlueTeam(null);
                    }
                  }}
                  onDragOver={(e) => handleDragOver(e, 'blue')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'blue')}
                >
                  {blueTeam ? (
                    <div className="text-center space-y-4 p-6">
                      <div className="text-6xl sm:text-7xl md:text-8xl"></div>
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-100 break-words px-2">
                        {blueTeam.name}
                      </div>
                      <div className="text-xs sm:text-sm text-blue-300">
                        Click para quitar
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4 p-6">
                      <div className="text-5xl sm:text-6xl opacity-30">
                        {dragOverZone === 'blue' ? '⬇️' : '❓'}
                      </div>
                      <div className="text-sm sm:text-base text-blue-300">
                        {dragOverZone === 'blue' ? 'Suelta aquí' : 'Selecciona o arrastra un tópico'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* VS Center */}
              <div className="flex items-center justify-center lg:pt-12">
                <div className="relative">
                  <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 animate-pulse">
                    VS
                  </div>
                  <div className="absolute inset-0 text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white/10 blur-xl">
                    VS
                  </div>
                </div>
              </div>

              {/* Red Team */}
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-center text-red-400">
                  TÓPICO ROJO
                </h2>
                <div 
                  className={`relative aspect-square rounded-2xl border-4 ${
                    dragOverZone === 'red' 
                      ? 'border-red-300 shadow-[0_0_40px_rgba(239,68,68,0.7)] scale-105' 
                      : 'border-red-500'
                  } bg-gradient-to-br from-red-500/20 to-red-900/30 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:border-red-400 transition-all duration-300 hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]`}
                  onClick={() => {
                    if (redTeam) {
                      setRedTeam(null);
                    }
                  }}
                  onDragOver={(e) => handleDragOver(e, 'red')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'red')}
                >
                  {redTeam ? (
                    <div className="text-center space-y-4 p-6">
                      <div className="text-6xl sm:text-7xl md:text-8xl"></div>
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-100 break-words px-2">
                        {redTeam.name}
                      </div>
                      <div className="text-xs sm:text-sm text-red-300">
                        Click para quitar
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4 p-6">
                      <div className="text-5xl sm:text-6xl opacity-30">
                        {dragOverZone === 'red' ? '⬇️' : '❓'}
                      </div>
                      <div className="text-sm sm:text-base text-red-300">
                        {dragOverZone === 'red' ? 'Suelta aquí' : 'Selecciona o arrastra un tópico'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Alert Selection Grid */}
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold text-center text-foreground/80">
                Selecciona los tópicos para comparar
              </h3>
              
              {isLoadingAlerts ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {getAvailableAlerts().map((alert) => (
                    <div
                      key={alert.id}
                      className="group relative"
                      draggable={true}
                      onDragStart={() => handleDragStart(alert)}
                      onDragEnd={handleDragEnd}
                    >
                      {/* Botón Azul */}
                      <button
                        onClick={() => handleAlertSelect(alert, 'blue')}
                        className="absolute -top-2 -left-2 z-10 w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 border-2 border-blue-300"
                        title="Añadir al tópcio azul"
                      >
                        A
                      </button>
                      
                      {/* Botón Rojo */}
                      <button
                        onClick={() => handleAlertSelect(alert, 'red')}
                        className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-red-500 hover:bg-red-400 text-white font-bold text-xs flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 border-2 border-red-300"
                        title="Añadir al tópcio rojo"
                      >
                        R
                      </button>
                      
                      {/* Alert Card */}
                      <div className={`relative rounded-xl border-2 ${
                        draggedAlert?.id === alert.id 
                          ? 'border-purple-400 opacity-50 scale-95' 
                          : 'border-foreground/20'
                      } bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm p-4 text-center transition-all duration-300 hover:border-foreground/40 hover:shadow-lg min-h-[100px] flex items-center justify-center cursor-move hover:cursor-grab active:cursor-grabbing`}>
                        <p className="text-xs sm:text-sm font-semibold text-foreground break-words">
                          {alert.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ready Indicator */}
            {blueTeam && redTeam && (
              <div className="flex justify-center animate-fade-in">
                <button
                  onClick={handleCompare}
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 text-white font-bold text-lg sm:text-xl shadow-2xl hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  ¡COMPARAR!
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comparador;
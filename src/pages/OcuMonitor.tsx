// src/pages/OcuMonitor.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Eye, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

interface OcuOpinion {
  id: number;
  idExterno: string;
  autor: string;
  titulo: string;
  contenido: string;
  estado: string;
  valoracion: number;
  fechaOpinion: string;
  fechaScraping: string;
  nivelAlerta: 'ninguno' | 'advertencia' | 'peligro';
  palabrasClave: string[];
  nueva: boolean;
}

interface Estadisticas {
  total: number;
  peligro: number;
  advertencia: number;
  nuevas: number;
  en_curso: number;
  resuelto: number;
  cerrado: number;
}

const OcuMonitor = () => {
  const [opiniones, setOpiniones] = useState<OcuOpinion[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>('todas');
  const [scraping, setScraping] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [filtro]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas
      const statsResponse = await apiFetch('/api/ocu-monitor/estadisticas');
      const statsData = await statsResponse.json();
      setEstadisticas(statsData.data);

      // Cargar opiniones con filtro
      const opinionesUrl = filtro === 'todas' 
        ? '/api/ocu-monitor/opiniones'
        : `/api/ocu-monitor/opiniones?filtro=${filtro}`;
      
      const opinionesResponse = await apiFetch(opinionesUrl);
      const opinionesData = await opinionesResponse.json();
      setOpiniones(opinionesData.data.opiniones);
      
    } catch (error) {
      toast.error('Error al cargar datos de OCU');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleScrapear = async () => {
    setScraping(true);
    try {
      const response = await apiFetch('/api/ocu-monitor/scrapear', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        cargarDatos();
      } else {
        toast.error('Error al hacer scraping');
      }
    } catch (error) {
      toast.error('Error al actualizar datos');
      console.error(error);
    } finally {
      setScraping(false);
    }
  };

  const handleMarcarVistas = async () => {
    try {
      await apiFetch('/api/ocu-monitor/marcar-vistas', {
        method: 'POST'
      });
      toast.success('Opiniones marcadas como vistas');
      cargarDatos();
    } catch (error) {
      toast.error('Error al marcar como vistas');
    }
  };

  const getAlertClass = (nivel: string) => {
    switch(nivel) {
      case 'peligro': return 'border-red-500/50 bg-red-500/10';
      case 'advertencia': return 'border-yellow-500/50 bg-yellow-500/10';
      default: return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  const getAlertIcon = (nivel: string) => {
    switch(nivel) {
      case 'peligro': return <AlertTriangle className="h-5 w-5 text-red-400" />;
      case 'advertencia': return <TrendingUp className="h-5 w-5 text-yellow-400" />;
      default: return <CheckCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  if (loading && !estadisticas) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="p-4 glass-effect rounded-xl border border-white/10">
            <div className="text-3xl font-bold text-white">{estadisticas.total}</div>
            <div className="text-sm text-white/70">Total Opiniones</div>
          </div>
          
          <div className="p-4 glass-effect rounded-xl border border-red-500/30 bg-red-500/5">
            <div className="text-3xl font-bold text-red-400">{estadisticas.peligro}</div>
            <div className="text-sm text-white/70">Peligro</div>
          </div>
          
          <div className="p-4 glass-effect rounded-xl border border-yellow-500/30 bg-yellow-500/5">
            <div className="text-3xl font-bold text-yellow-400">{estadisticas.advertencia}</div>
            <div className="text-sm text-white/70">Advertencia</div>
          </div>
          
          <div className="p-4 glass-effect rounded-xl border border-green-500/30 bg-green-500/5">
            <div className="text-3xl font-bold text-green-400">
              {estadisticas.total - estadisticas.peligro - estadisticas.advertencia}
            </div>
            <div className="text-sm text-white/70">Sin Alerta</div>
          </div>
          
          <div className="p-4 glass-effect rounded-xl border border-blue-500/30 bg-blue-500/5">
            <div className="text-3xl font-bold text-blue-400">{estadisticas.nuevas}</div>
            <div className="text-sm text-white/70">Nuevas</div>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-4">
        <Button
          onClick={handleScrapear}
          disabled={scraping}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
        >
          {scraping ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Actualizar Ahora
        </Button>
        
        <Button
          onClick={handleMarcarVistas}
          variant="outline"
          className="glass-effect border-white/10 hover:bg-white/10 text-white"
        >
          <Eye className="h-4 w-4 mr-2" />
          Marcar como Vistas
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700/50">
        {['todas', 'nuevas', 'peligro', 'advertencia'].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`
              px-4 py-2 rounded-lg whitespace-nowrap transition-all
              ${filtro === f 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' 
                : 'glass-effect text-white/70 hover:text-white'
              }
            `}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Lista de opiniones */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
          </div>
        ) : opiniones.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/70">No hay opiniones para mostrar</p>
          </div>
        ) : (
          opiniones.map((opinion) => (
            <div
              key={opinion.id}
              className={`p-4 glass-effect rounded-xl border-l-4 ${getAlertClass(opinion.nivelAlerta)}`}
            >
              <div className="flex items-start gap-3 mb-2">
                {getAlertIcon(opinion.nivelAlerta)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{opinion.autor}</span>
                    {opinion.nueva && (
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                        NUEVA
                      </span>
                    )}
                    <span className="text-xs text-white/50">
                      {'⭐'.repeat(opinion.valoracion)}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-2">
                    {opinion.titulo}
                  </h3>
                  
                  <p className="text-white/70 text-sm mb-3">
                    {opinion.contenido}
                  </p>
                  
                  {opinion.palabrasClave && opinion.palabrasClave.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-2">
                      {opinion.palabrasClave.map((palabra, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded"
                        >
                          {palabra}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-4 text-xs text-white/50">
                    <span>📅 {opinion.fechaOpinion}</span>
                    <span>🔍 Scrapeado: {opinion.fechaScraping}</span>
                    <span className="px-2 py-1 glass-effect rounded">{opinion.estado}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OcuMonitor;
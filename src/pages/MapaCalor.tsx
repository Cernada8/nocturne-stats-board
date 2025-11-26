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
  MapPin,
  ArrowLeft,
  Flame,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker
} from 'react-simple-maps';
import SoftMathBackground from '@/components/SoftMathBackground';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';

interface Alert {
  id: string;
  name: string;
}

interface GeoPoint {
  lat: number;
  lng: number;
  country: string;
  mentions: number;
}

interface MapData {
  total_mentions: number;
  points: GeoPoint[];
}

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

const MapaCalor = () => {
  const { userEmail, companyId, setCompanyId } = useAuth();
  const navigate = useNavigate();
  const hadCompleteRange = useRef(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2025, 0, 1),
    to: new Date()
  });

  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<GeoPoint | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 20],
    zoom: 1
  });

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
      fetchMapData();
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
      const alertsList = (result.data.alerts || []).filter((alert: Alert) => alert.name !== 'Leads');
      setAlerts(alertsList);
    } catch (error) {
      toast.error('Error al cargar alertas');
      console.error(error);
    }
  };

  const fetchMapData = async () => {
    if (!companyId || !dateRange.from || !dateRange.to) return;

    setIsLoading(true);
    try {
      const fromStr = format(dateRange.from, 'yyyy-MM-dd');
      const toStr = format(dateRange.to, 'yyyy-MM-dd');

      let endpoint = `/api/stats/geo/map?company_id=${companyId}&from=${fromStr}&to=${toStr}`;
      if (selectedAlertId) endpoint += `&alert_id=${selectedAlertId}`;

      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error('Error al obtener datos del mapa');

      const result = await response.json();
      setMapData(result.data);

      console.log('Datos del mapa recibidos:', result.data);
    } catch (error) {
      toast.error('Error al cargar datos del mapa');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPointSize = (mentions: number) => {
    if (!mapData) return 4;
    const maxMentions = Math.max(...mapData.points.map(p => p.mentions));
    const minSize = 4;
    const maxSize = 20;
    const ratio = mentions / maxMentions;
    return minSize + (maxSize - minSize) * ratio;
  };

  const getPointColor = (mentions: number) => {
    if (!mapData) return '#06b6d4';
    const maxMentions = Math.max(...mapData.points.map(p => p.mentions));
    const intensity = mentions / maxMentions;

    if (intensity > 0.8) return '#22d3ee';
    if (intensity > 0.6) return '#06b6d4';
    if (intensity > 0.4) return '#0891b2';
    if (intensity > 0.2) return '#0e7490';
    return '#155e75';
  };

  const getPointOpacity = (mentions: number) => {
    if (!mapData) return 0.6;
    const maxMentions = Math.max(...mapData.points.map(p => p.mentions));
    const intensity = mentions / maxMentions;
    return 0.4 + (intensity * 0.6);
  };

  const handlePointClick = (point: GeoPoint) => {
    setPosition({
      coordinates: [point.lng, point.lat],
      zoom: 5
    });
  };

  const handleZoomIn = () => {
    if (position.zoom < 8) {
      setPosition({
        ...position,
        zoom: position.zoom * 1.5
      });
    }
  };

  const handleZoomOut = () => {
    if (position.zoom > 1) {
      setPosition({
        ...position,
        zoom: position.zoom / 1.5
      });
    }
  };

  const handleResetZoom = () => {
    setPosition({
      coordinates: [0, 20],
      zoom: 1
    });
  };

  const handleMouseEnter = (point: GeoPoint, event: any) => {
    setHoveredPoint(point);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const handleMouseMove = (event: any) => {
    if (hoveredPoint) {
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
  };

  // Calcular posición inteligente del tooltip
  // Calcular posición inteligente del tooltip
  // Calcular posición del tooltip anclado al punto
  // Calcular posición del tooltip anclado al punto
  // Calcular posición del tooltip anclado al punto
  const getTooltipPosition = () => {
    if (typeof window === 'undefined') return { left: 0, top: 0, isBelow: false };

    const isMobile = window.innerWidth < 640;
    const tooltipWidth = isMobile ? 180 : 220;
    const tooltipHeight = 160;
    const verticalOffset = 200; // Desplazamiento hacia arriba (más grande = más arriba)
    const horizontalOffset = 300; // Desplazamiento hacia la izquierda
    const edgeMargin = 10;

    // Desplazar hacia la izquierda del punto
    let left = tooltipPosition.x - horizontalOffset;
    // Colocar arriba del punto con más separación
    let top = tooltipPosition.y - tooltipHeight - verticalOffset;
    let isBelow = false;

    // Ajustar si se sale por la izquierda
    if (left < edgeMargin) {
      left = edgeMargin;
    }

    // Ajustar si se sale por la derecha
    if (left + tooltipWidth > window.innerWidth - edgeMargin) {
      left = window.innerWidth - tooltipWidth - edgeMargin;
    }

    // Si se sale por arriba, colocarlo abajo del punto
    if (top < edgeMargin) {
      top = tooltipPosition.y + verticalOffset;
      isBelow = true;
    }

    // Si aún se sale por abajo después de moverlo, ajustar
    if (top + tooltipHeight > window.innerHeight - edgeMargin) {
      top = window.innerHeight - tooltipHeight - edgeMargin;
    }

    return { left, top, isBelow };
  };

  return (
    <div className="min-h-screen max-h-screen overflow-hidden flex">
      <SoftMathBackground />
      <Sidebar />

      <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-slate-900/50 hover:scrollbar-thumb-slate-600/70">
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          <Header />

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
                Mapa de Calor
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-white/70">
                Visualización de menciones por coordenadas geográficas
              </p>
            </div>
          </div>

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
                    className={`w-full justify-start text-white hover:bg-white/10 text-sm ${!selectedAlertId ? 'bg-white/10' : ''
                      }`}
                    onClick={() => setSelectedAlertId(null)}
                  >
                    Todos los temas
                  </Button>
                  {alerts.map((alert) => (
                    <Button
                      key={alert.id}
                      variant="ghost"
                      className={`w-full justify-start text-white hover:bg-white/10 text-sm ${selectedAlertId === alert.id ? 'bg-white/10' : ''
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
                      <span className="hidden sm:inline">
                        {format(dateRange.from, 'dd MMM yyyy', { locale: es })} - {format(dateRange.to, 'dd MMM yyyy', { locale: es })}
                      </span>
                    ) : (
                      'Seleccionar fechas'
                    )}
                    {dateRange.from && dateRange.to && (
                      <span className="sm:hidden">
                        {format(dateRange.from, 'dd/MM/yy')} - {format(dateRange.to, 'dd/MM/yy')}
                      </span>
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

            {mapData && (
              <div className="glass-effect px-3 sm:px-4 py-2 rounded-lg">
                <span className="text-white/70 text-xs sm:text-sm">Total menciones: </span>
                <span className="text-cyan-400 font-bold text-xs sm:text-sm">
                  {mapData.total_mentions.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="relative py-4 sm:py-6 lg:py-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 sm:mb-6 lg:mb-8 gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 lg:p-4 glass-effect rounded-xl">
                  <Flame className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    Mapa de Calor Interactivo
                  </h2>
                  <p className="text-white/70 text-xs sm:text-sm lg:text-lg">
                    Puntos de concentración de menciones
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
                <div className="glass-effect px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 rounded-xl flex-1 lg:flex-initial">
                  <p className="text-white/70 text-xs sm:text-sm mb-1 sm:mb-2">Intensidad</p>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-white/50 text-[10px] sm:text-xs">Baja</span>
                    <div className="flex gap-0.5 sm:gap-1">
                      <div className="w-4 sm:w-5 lg:w-6 h-3 sm:h-3.5 lg:h-4 rounded" style={{ backgroundColor: '#155e75' }}></div>
                      <div className="w-4 sm:w-5 lg:w-6 h-3 sm:h-3.5 lg:h-4 rounded" style={{ backgroundColor: '#0e7490' }}></div>
                      <div className="w-4 sm:w-5 lg:w-6 h-3 sm:h-3.5 lg:h-4 rounded" style={{ backgroundColor: '#0891b2' }}></div>
                      <div className="w-4 sm:w-5 lg:w-6 h-3 sm:h-3.5 lg:h-4 rounded" style={{ backgroundColor: '#06b6d4' }}></div>
                      <div className="w-4 sm:w-5 lg:w-6 h-3 sm:h-3.5 lg:h-4 rounded" style={{ backgroundColor: '#22d3ee' }}></div>
                    </div>
                    <span className="text-white/50 text-[10px] sm:text-xs">Alta</span>
                  </div>
                </div>

                <div className="glass-effect p-1.5 sm:p-2 rounded-xl flex lg:flex-col gap-1.5 sm:gap-2">
                  <Button
                    onClick={handleZoomIn}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 h-7 w-7 sm:h-8 sm:w-8"
                    disabled={position.zoom >= 8}
                  >
                    <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    onClick={handleZoomOut}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 h-7 w-7 sm:h-8 sm:w-8"
                    disabled={position.zoom <= 1}
                  >
                    <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    onClick={handleResetZoom}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 h-7 w-7 sm:h-8 sm:w-8"
                  >
                    <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-[400px] sm:h-[500px] lg:h-[700px]">
                <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-spin text-cyan-400" />
              </div>
            ) : (
              <div
                className="relative rounded-xl sm:rounded-2xl overflow-hidden"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.15))',
                  height: 'clamp(400px, 60vh, 700px)'
                }}
                onMouseMove={handleMouseMove}
              >
                <style>
                  {`
                    .rsm-zoomable-group {
                      transition: transform 1200ms cubic-bezier(0.4, 0, 0.2, 1) !important;
                    }
                  `}
                </style>
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{
                    scale: 147,
                    center: [0, 20]
                  }}
                  style={{
                    width: '100%',
                    height: '100%'
                  }}
                >
                  <ZoomableGroup
                    zoom={position.zoom}
                    center={position.coordinates}
                  >
                    <Geographies geography={geoUrl}>
                      {({ geographies }) =>
                        geographies.map((geo) => (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill="#1e293b"
                            stroke="#0f172a"
                            strokeWidth={0.5}
                            style={{
                              default: { outline: 'none' },
                              hover: { outline: 'none', fill: '#334155' },
                              pressed: { outline: 'none' }
                            }}
                          />
                        ))
                      }
                    </Geographies>

                    {mapData?.points.map((point, index) => {
                      const size = getPointSize(point.mentions);
                      const color = getPointColor(point.mentions);
                      const opacity = getPointOpacity(point.mentions);

        

                      return (
                        <Marker
                          key={`${point.lat}-${point.lng}-${index}`}
                          coordinates={[point.lng, point.lat]}
                        >
                          <g
                            onMouseEnter={(e) => handleMouseEnter(point, e)}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => handlePointClick(point)}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle
                              r={size * 2}
                              fill={color}
                              opacity={opacity * 0.2}
                              style={{
                                filter: `blur(${size * 0.5}px)`
                              }}
                            />
                            <circle
                              r={size}
                              fill={color}
                              opacity={opacity}
                              stroke="#fff"
                              strokeWidth={0.5}
                              style={{
                                transition: 'all 0.2s ease'
                              }}
                            />
                            {point.mentions > (mapData?.total_mentions || 0) * 0.05 && (
                              <circle
                                r={size}
                                fill="none"
                                stroke={color}
                                strokeWidth={2}
                                opacity={0.6}
                              >
                                <animate
                                  attributeName="r"
                                  from={size}
                                  to={size * 2}
                                  dur="2s"
                                  repeatCount="indefinite"
                                />
                                <animate
                                  attributeName="opacity"
                                  from="0.6"
                                  to="0"
                                  dur="2s"
                                  repeatCount="indefinite"
                                />
                              </circle>
                            )}
                          </g>
                        </Marker>
                      );
                    })}
                  </ZoomableGroup>
                </ComposableMap>

                {hoveredPoint && (
                  <div
                    className="fixed glass-card p-3 sm:p-4 border border-cyan-300/30 shadow-xl shadow-cyan-400/20 pointer-events-none z-50 max-w-[200px] sm:max-w-[220px]"
                    style={{
                      left: `${getTooltipPosition().left}px`,
                      top: `${getTooltipPosition().top}px`
                    }}
                  >
                    {/* País destacado */}
                    <div className="mb-3 pb-2 border-b border-cyan-400/30">
                      <p className="text-cyan-300 text-[10px] sm:text-xs font-medium mb-1">PAÍS</p>
                      <p className="text-white text-lg sm:text-xl font-bold tracking-wider">
                        {hoveredPoint.country}
                      </p>
                    </div>

                    {/* Menciones destacadas */}
                    <div className="mb-3">
                      <p className="text-cyan-300 text-[10px] sm:text-xs font-medium mb-1">MENCIONES</p>
                      <p className="text-white text-base sm:text-lg font-bold text-cyan-400">
                        {hoveredPoint.mentions.toLocaleString()}
                      </p>
                    </div>

                    {/* Coordenadas en letra pequeña */}
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-white/50 text-[10px] mb-0.5 flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" />
                        <span>Lat: {hoveredPoint.lat.toFixed(3)}</span>
                      </p>
                      <p className="text-white/50 text-[10px] mb-1">
                        <span className="ml-4">Lng: {hoveredPoint.lng.toFixed(3)}</span>
                      </p>
                    </div>

                    <p className="text-white/50 text-[10px] mt-2 italic hidden sm:block">
                      Click para hacer zoom
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapaCalor;
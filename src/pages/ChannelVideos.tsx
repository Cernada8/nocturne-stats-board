import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, Search, Eye, ThumbsUp, MessageSquare, Calendar, ExternalLink, Youtube, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import SoftMathBackground from '@/components/SoftMathBackground';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import VideoComments from './VideoComments';

interface Video {
  id: number;
  video_id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  video_url: string;
  published_at: string;
  view_count: string;
  like_count: number;
  comment_count: number;
  duration: number;
  last_sync_at: string | null;
}

interface ChannelVideosProps {
  channelId: number;
  channelName: string;
  channelThumbnail: string | null;
  onBack: () => void;
}

const ChannelVideos = ({ 
  channelId, 
  channelName, 
  channelThumbnail,
  onBack 
}: ChannelVideosProps) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalVideos, setTotalVideos] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [orderBy, setOrderBy] = useState('published_at');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const videosPerPage = 25;

  useEffect(() => {
    fetchVideos();
  }, [currentPage, orderBy, order]);

  // Si hay un video seleccionado, mostrar la pantalla de comentarios
  if (selectedVideo) {
    return (
      <VideoComments
        videoId={selectedVideo.id}
        videoTitle={selectedVideo.title}
        videoThumbnail={selectedVideo.thumbnail}
        onBack={() => setSelectedVideo(null)}
      />
    );
  }

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const offset = (currentPage - 1) * videosPerPage;
      const params = new URLSearchParams({
        limit: videosPerPage.toString(),
        offset: offset.toString(),
        order_by: orderBy,
        order: order
      });

      const response = await apiFetch(`/api/social/channel/${channelId}/videos?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar videos');
      }
      
      const result = await response.json();
      
      setVideos(result.data.videos);
      setTotalVideos(result.data.total_videos);
      
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar videos del canal');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const syncVideos = async (syncAll = false) => {
    setIsSyncing(true);
    try {
      const params = new URLSearchParams();
      if (syncAll) {
        params.append('sync_all', 'true');
      }

      const response = await apiFetch(
  `/api/social/channel/${channelId}/sync-videos?sync_all=true&${params.toString()}`,
        { method: 'POST' }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al sincronizar videos');
      }
      
      const result = await response.json();
      
      toast.success(
        `Sincronización completada: ${result.data.videos_added} nuevos, ${result.data.videos_updated} actualizados`
      );
      
      setCurrentPage(1);
      fetchVideos();
    } catch (error: any) {
      toast.error(error.message || 'Error al sincronizar videos');
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: string | number) => {
    if (!num) return '0';
    const numValue = typeof num === 'string' ? parseInt(num) : num;
    if (numValue >= 1000000) return `${(numValue / 1000000).toFixed(1)}M`;
    if (numValue >= 1000) return `${(numValue / 1000).toFixed(1)}K`;
    return numValue.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalVideos / videosPerPage);

  return (
    <div className="min-h-screen max-h-screen overflow-hidden flex">
      <SoftMathBackground />
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-slate-900/50 hover:scrollbar-thumb-slate-600/70">
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          <Header />

          {/* Encabezado del canal */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-pink-500/10 blur-3xl rounded-2xl"></div>
            
            <div className="relative p-4 sm:p-6 glass-effect rounded-xl sm:rounded-2xl">
              <Button
                onClick={onBack}
                variant="outline"
                className="mb-4 glass-effect border-white/10 hover:bg-white/10 text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a canales
              </Button>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  {channelThumbnail && (
                    <img
                      src={channelThumbnail}
                      alt={channelName}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-red-400/30"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Youtube className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                        {channelName}
                      </h1>
                    </div>
                    <p className="text-white/70 text-sm">
                      {totalVideos > 0 ? `${formatNumber(totalVideos)} videos en la base de datos` : 'Videos del canal'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => syncVideos(false)}
                    disabled={isSyncing}
                    className="flex-1 sm:flex-initial bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                  >
                    {isSyncing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Sincronizar últimos
                  </Button>
                  
                  <Button
                    onClick={fetchVideos}
                    disabled={isLoading}
                    variant="outline"
                    className="glass-effect border-white/10 hover:bg-white/10 text-white"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de búsqueda y filtros */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-blue-500/10 blur-3xl rounded-2xl"></div>
            
            <div className="relative p-4 glass-effect rounded-xl space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar videos por título o descripción..."
                  className="pl-10 glass-effect border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <span className="text-white/70 text-sm">Ordenar por:</span>
                <select
                  value={orderBy}
                  onChange={(e) => {
                    setOrderBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 rounded-lg glass-effect border-white/10 text-white text-sm bg-transparent"
                >
                  <option value="published_at" className="bg-slate-900">Fecha de publicación</option>
                  <option value="view_count" className="bg-slate-900">Visualizaciones</option>
                  <option value="like_count" className="bg-slate-900">Me gusta</option>
                  <option value="comment_count" className="bg-slate-900">Comentarios</option>
                </select>

                <Button
                  onClick={() => {
                    setOrder(order === 'DESC' ? 'ASC' : 'DESC');
                    setCurrentPage(1);
                  }}
                  variant="outline"
                  size="sm"
                  className="glass-effect border-white/10 hover:bg-white/10 text-white"
                >
                  {order === 'DESC' ? '↓ Descendente' : '↑ Ascendente'}
                </Button>
              </div>

              {searchTerm && (
                <p className="text-white/70 text-sm">
                  Mostrando {filteredVideos.length} de {videos.length} videos en esta página
                </p>
              )}
            </div>
          </div>

          {/* Lista de videos */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-indigo-500/10 blur-3xl rounded-2xl"></div>
            
            <div className="relative p-4 sm:p-6 glass-effect rounded-xl sm:rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Videos del Canal
                </h2>
                {totalVideos === 0 && (
                  <p className="text-white/50 text-sm">
                    No hay videos sincronizados aún
                  </p>
                )}
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-10 w-10 animate-spin text-red-400" />
                </div>
              ) : filteredVideos.length === 0 ? (
                <div className="text-center py-12">
                  <Youtube className="h-16 w-16 text-white/30 mx-auto mb-4" />
                  <p className="text-white/70 text-lg mb-2">
                    {searchTerm ? 'No se encontraron videos con ese término' : 'No hay videos disponibles'}
                  </p>
                  {totalVideos === 0 && (
                    <p className="text-white/50 text-sm">
                      Haz clic en "Sincronizar últimos" para obtener los videos del canal
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredVideos.map((video) => (
                      <div
                        key={video.id}
                        className="group p-4 glass-effect rounded-xl border border-white/10 hover:border-red-400/30 transition-all duration-300 hover:scale-[1.02]"
                      >
                        {/* Thumbnail */}
                        <div className="relative mb-3 rounded-lg overflow-hidden">
                          {video.thumbnail ? (
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full aspect-video object-cover"
                            />
                          ) : (
                            <div className="w-full aspect-video bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center">
                              <Youtube className="h-12 w-12 text-white/30" />
                            </div>
                          )}
                          {video.duration && (
                            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded">
                              {formatDuration(video.duration)}
                            </div>
                          )}
                        </div>

                        {/* Título */}
                        <h3 className="text-base font-bold text-white mb-2 line-clamp-2 group-hover:text-red-400 transition-colors">
                          {video.title}
                        </h3>

                        {/* Descripción */}
                        {video.description && (
                          <p className="text-white/60 text-xs mb-3 line-clamp-2">
                            {video.description}
                          </p>
                        )}

                        {/* Estadísticas */}
                        <div className="flex items-center gap-3 text-xs text-white/70 mb-3">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{formatNumber(video.view_count)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            <span>{formatNumber(video.like_count)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{formatNumber(video.comment_count)}</span>
                          </div>
                        </div>

                        {/* Fecha */}
                        <div className="flex items-center gap-2 text-white/50 text-xs mb-3">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(video.published_at)}</span>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setSelectedVideo(video)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-300 text-sm font-medium"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Ver comentarios
                          </Button>
                          
                          <a
                            href={video.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg transition-all duration-300 text-sm font-medium"
                          >
                            <Youtube className="h-4 w-4" />
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Paginación */}
                  {!searchTerm && totalPages > 1 && (
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                      <Button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || isLoading}
                        variant="outline"
                        size="sm"
                        className="glass-effect border-white/10 hover:bg-white/10 text-white"
                      >
                        ← Anterior
                      </Button>

                      <div className="flex items-center gap-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              disabled={isLoading}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className={
                                currentPage === pageNum
                                  ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                                  : "glass-effect border-white/10 hover:bg-white/10 text-white"
                              }
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || isLoading}
                        variant="outline"
                        size="sm"
                        className="glass-effect border-white/10 hover:bg-white/10 text-white"
                      >
                        Siguiente →
                      </Button>

                      <span className="text-white/50 text-sm ml-2">
                        Página {currentPage} de {totalPages}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelVideos;
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, Search, ThumbsUp, Calendar, RefreshCw, Download, MessageSquare, User, Youtube, Filter, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import SoftMathBackground from '@/components/SoftMathBackground';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

interface Comment {
  id: number;
  comment_id: string;
  parent_comment_id: string | null;
  author_name: string;
  author_channel_url: string;
  author_thumbnail: string | null;
  text: string;
  like_count: number;
  published_at: string;
  is_reply: boolean;
  sentiment_score: string | null;
  is_flagged: boolean;
  flagged_reason: string | null;
}

interface VideoCommentsProps {
  videoId: number;
  videoTitle: string;
  videoThumbnail: string | null;
  onBack: () => void;
}

const VideoComments = ({ 
  videoId, 
  videoTitle,
  videoThumbnail,
  onBack 
}: VideoCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalComments, setTotalComments] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [includeReplies, setIncludeReplies] = useState(true);
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [sentiment, setSentiment] = useState<string>('');
  const commentsPerPage = 50;

  useEffect(() => {
    fetchComments();
  }, [currentPage, includeReplies, onlyFlagged, sentiment]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const offset = (currentPage - 1) * commentsPerPage;
      const params = new URLSearchParams({
        limit: commentsPerPage.toString(),
        offset: offset.toString(),
        include_replies: includeReplies.toString(),
        only_flagged: onlyFlagged.toString(),
      });

      if (sentiment) {
        params.append('sentiment', sentiment);
      }

      const response = await apiFetch(`/api/social/video/${videoId}/comments?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar comentarios');
      }
      
      const result = await response.json();
      
      setComments(result.data.comments);
      setTotalComments(result.data.total_comments);
      
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar comentarios del video');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const syncComments = async () => {
    setIsSyncing(true);
    try {
      const response = await apiFetch(
        `/api/social/video/${videoId}/sync-comments`,
        { method: 'POST' }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al sincronizar comentarios');
      }
      
      const result = await response.json();
      
      toast.success(
        `Sincronización completada: ${result.data.comments_added} nuevos, ${result.data.comments_updated} actualizados`
      );
      
      setCurrentPage(1);
      fetchComments();
    } catch (error: any) {
      toast.error(error.message || 'Error al sincronizar comentarios');
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSentimentColor = (score: string | null) => {
    if (!score) return 'text-white/50';
    const numScore = parseFloat(score);
    if (numScore < -0.3) return 'text-red-400';
    if (numScore > 0.3) return 'text-green-400';
    return 'text-yellow-400';
  };

  const getSentimentLabel = (score: string | null) => {
    if (!score) return 'Sin analizar';
    const numScore = parseFloat(score);
    if (numScore < -0.3) return 'Negativo';
    if (numScore > 0.3) return 'Positivo';
    return 'Neutral';
  };

  const filteredComments = comments.filter(comment =>
    comment.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.author_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalComments / commentsPerPage);

  return (
    <div className="min-h-screen max-h-screen overflow-hidden flex">
      <SoftMathBackground />
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-slate-900/50 hover:scrollbar-thumb-slate-600/70">
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          <Header />

          {/* Encabezado del video */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10 blur-3xl rounded-2xl"></div>
            
            <div className="relative p-4 sm:p-6 glass-effect rounded-xl sm:rounded-2xl">
              <Button
                onClick={onBack}
                variant="outline"
                className="mb-4 glass-effect border-white/10 hover:bg-white/10 text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a videos
              </Button>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  {videoThumbnail && (
                    <img
                      src={videoThumbnail}
                      alt={videoTitle}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover border-2 border-purple-400/30"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                        Comentarios
                      </h1>
                    </div>
                    <p className="text-white/70 text-sm mb-1 line-clamp-2">
                      {videoTitle}
                    </p>
                    <p className="text-white/50 text-xs">
                      {totalComments > 0 ? `${totalComments} comentarios en total` : 'Sin comentarios'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    onClick={syncComments}
                    disabled={isSyncing}
                    className="flex-1 sm:flex-initial bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    {isSyncing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Sincronizar
                  </Button>
                  
                  <Button
                    onClick={fetchComments}
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

          {/* Filtros */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-blue-500/10 blur-3xl rounded-2xl"></div>
            
            <div className="relative p-4 glass-effect rounded-xl space-y-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por texto o autor..."
                  className="pl-10 glass-effect border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              {/* Filtros adicionales */}
              <div className="flex flex-wrap gap-3 items-center">
                <Filter className="h-4 w-4 text-white/70" />
                
                <select
                  value={sentiment}
                  onChange={(e) => {
                    setSentiment(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 rounded-lg glass-effect border-white/10 text-white text-sm bg-transparent"
                >
                  <option value="" className="bg-slate-900">Todos los sentimientos</option>
                  <option value="positive" className="bg-slate-900">😊 Positivos</option>
                  <option value="neutral" className="bg-slate-900">😐 Neutrales</option>
                  <option value="negative" className="bg-slate-900">😞 Negativos</option>
                </select>

                <Button
                  onClick={() => {
                    setIncludeReplies(!includeReplies);
                    setCurrentPage(1);
                  }}
                  variant="outline"
                  size="sm"
                  className={`glass-effect border-white/10 hover:bg-white/10 text-white ${includeReplies ? 'bg-white/10' : ''}`}
                >
                  {includeReplies ? '✓ ' : ''}Incluir respuestas
                </Button>

                <Button
                  onClick={() => {
                    setOnlyFlagged(!onlyFlagged);
                    setCurrentPage(1);
                  }}
                  variant="outline"
                  size="sm"
                  className={`glass-effect border-white/10 hover:bg-white/10 text-white ${onlyFlagged ? 'bg-red-500/20 border-red-400/30' : ''}`}
                >
                  {onlyFlagged ? '✓ ' : ''}<AlertCircle className="h-3 w-3 mr-1" />Solo marcados
                </Button>
              </div>

              {searchTerm && (
                <p className="text-white/70 text-sm">
                  Mostrando {filteredComments.length} de {comments.length} comentarios en esta página
                </p>
              )}
            </div>
          </div>

          {/* Lista de comentarios */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-purple-500/10 blur-3xl rounded-2xl"></div>
            
            <div className="relative p-4 sm:p-6 glass-effect rounded-xl sm:rounded-2xl">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
                </div>
              ) : filteredComments.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-white/30 mx-auto mb-4" />
                  <p className="text-white/70 text-lg mb-2">
                    {searchTerm ? 'No se encontraron comentarios con ese término' : 'No hay comentarios disponibles'}
                  </p>
                  {totalComments === 0 && (
                    <p className="text-white/50 text-sm">
                      Haz clic en "Sincronizar" para obtener los comentarios del video
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {filteredComments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-4 glass-effect rounded-xl border transition-all duration-300 hover:scale-[1.01] ${
                          comment.is_flagged 
                            ? 'border-red-400/30 bg-red-500/5' 
                            : 'border-white/10'
                        } ${
                          comment.is_reply ? 'ml-8 border-l-4 border-l-blue-400/30' : ''
                        }`}
                      >
                        {/* Cabecera del comentario */}
                        <div className="flex items-start gap-3 mb-3">
                          {comment.author_thumbnail ? (
                            <img
                              src={comment.author_thumbnail}
                              alt={comment.author_name}
                              className="w-10 h-10 rounded-full object-cover border border-white/20"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                              <User className="h-5 w-5 text-white/50" />
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <a
                                href={comment.author_channel_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-white hover:text-purple-400 transition-colors"
                              >
                                {comment.author_name}
                              </a>
                              {comment.is_reply && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                                  Respuesta
                                </span>
                              )}
                              {comment.is_flagged && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-400/30 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Marcado
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3 text-xs text-white/50">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(comment.published_at)}
                              </div>
                              
                              {comment.sentiment_score && (
                                <div className={`flex items-center gap-1 ${getSentimentColor(comment.sentiment_score)}`}>
                                  <span>•</span>
                                  <span>{getSentimentLabel(comment.sentiment_score)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Texto del comentario */}
                        <p className="text-white/90 mb-3 whitespace-pre-wrap leading-relaxed">
                          {comment.text}
                        </p>

                        {/* Footer del comentario */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-white/60 text-sm">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{comment.like_count}</span>
                          </div>

                          {comment.is_flagged && comment.flagged_reason && (
                            <div className="text-xs text-red-400/70 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {comment.flagged_reason}
                            </div>
                          )}
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
                                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
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

export default VideoComments;
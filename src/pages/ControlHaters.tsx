import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Plus, Youtube, Facebook, Instagram, Twitter, AlertCircle, Check, Trash2, ExternalLink, Video } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import SoftMathBackground from '@/components/SoftMathBackground';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';

// Importar el componente de videos
import ChannelVideos from '@/pages/ChannelVideos';

// Iconos personalizados para redes sociales
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface SocialNetwork {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  placeholder: string;
  description: string;
  urlPattern: RegExp;
}

interface MonitoredChannel {
  id: number;
  platform: string;
  platform_name: string;
  channel_id: string;
  channel_name: string;
  channel_url: string;
  thumbnail: string | null;
  subscriber_count: string | null;
  video_count: number | null;
  view_count: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  added_at: string;
}

const socialNetworks: SocialNetwork[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    icon: <Youtube className="h-8 w-8" />,
    color: 'from-red-500 to-red-600',
    placeholder: 'https://www.youtube.com/@nombrecanal o https://www.youtube.com/channel/UC...',
    description: 'Monitoriza canales de YouTube',
    urlPattern: /^https?:\/\/(www\.)?youtube\.com/
  },
  /*{
    id: 'tiktok',
    name: 'TikTok',
    icon: <TikTokIcon />,
    color: 'from-black to-gray-900',
    placeholder: 'https://www.tiktok.com/@nombreusuario',
    description: 'Monitoriza cuentas de TikTok',
    urlPattern: /^https?:\/\/(www\.)?tiktok\.com\/@/
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <Facebook className="h-8 w-8" />,
    color: 'from-blue-600 to-blue-700',
    placeholder: 'https://www.facebook.com/groups/nombregrupo',
    description: 'Monitoriza grupos de Facebook',
    urlPattern: /^https?:\/\/(www\.)?facebook\.com\/(groups|profile\.php|)/
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: <Instagram className="h-8 w-8" />,
    color: 'from-pink-500 via-purple-500 to-orange-500',
    placeholder: 'https://www.instagram.com/nombreusuario',
    description: 'Monitoriza perfiles de Instagram',
    urlPattern: /^https?:\/\/(www\.)?instagram\.com\//
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: <Twitter className="h-8 w-8" />,
    color: 'from-sky-400 to-sky-600',
    placeholder: 'https://twitter.com/nombreusuario o https://x.com/nombreusuario',
    description: 'Monitoriza cuentas de Twitter/X',
    urlPattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\//
  }*/
];

const ControlHaters = () => {
  const { userEmail, companyId, setCompanyId } = useAuth();
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [searchUrl, setSearchUrl] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [monitoredChannels, setMonitoredChannels] = useState<MonitoredChannel[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // Estado para la navegación a videos
  const [selectedChannel, setSelectedChannel] = useState<MonitoredChannel | null>(null);

  useEffect(() => {
    if (userEmail && !companyId) {
      fetchCompanyId();
    }
  }, [userEmail, companyId]);

  useEffect(() => {
    if (companyId) {
      fetchMonitoredChannels();
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

  const fetchMonitoredChannels = async () => {
    if (!companyId) return;
    
    setIsLoadingChannels(true);
    try {
      const response = await apiFetch(`/api/social/monitored?company_id=${companyId}`);
      if (!response.ok) throw new Error('Error al obtener canales monitorizados');
      
      const result = await response.json();
      setMonitoredChannels(result.data.channels || []);
    } catch (error) {
      toast.error('Error al cargar canales monitorizados');
      console.error(error);
    } finally {
      setIsLoadingChannels(false);
    }
  };

  const extractChannelId = (url: string, platform: string): string | null => {
    try {
      if (platform === 'youtube') {
        const patterns = [
          /youtube\.com\/channel\/([\w-]+)/,
          /youtube\.com\/@([\w-]+)/,
          /youtube\.com\/c\/([\w-]+)/,
          /youtube\.com\/user\/([\w-]+)/
        ];
        
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) return match[1];
        }
      } else if (platform === 'tiktok') {
        const match = url.match(/tiktok\.com\/@([\w.-]+)/);
        return match ? match[1] : null;
      } else if (platform === 'facebook') {
        const match = url.match(/facebook\.com\/(groups|profile\.php\?id=|)([\w.-]+)/);
        return match ? match[2] : null;
      } else if (platform === 'instagram') {
        const match = url.match(/instagram\.com\/([\w.-]+)/);
        return match ? match[1] : null;
      } else if (platform === 'twitter') {
        const match = url.match(/(?:twitter\.com|x\.com)\/([\w]+)/);
        return match ? match[1] : null;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const handleSearch = async () => {
    if (!selectedNetwork || !searchUrl.trim()) {
      toast.error('Por favor, introduce una URL válida');
      return;
    }

    const network = socialNetworks.find(n => n.id === selectedNetwork);
    if (!network || !network.urlPattern.test(searchUrl)) {
      toast.error('La URL no es válida para esta red social');
      return;
    }

    const channelId = extractChannelId(searchUrl, selectedNetwork);
    if (!channelId) {
      toast.error('No se pudo extraer el ID del canal/cuenta');
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiFetch(
        `/api/social/search?platform=${selectedNetwork}&channel_id=${channelId}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al buscar el canal');
      }
      
      const result = await response.json();
      
      setSearchResult({
        platform: selectedNetwork,
        channelId: result.data.channel_id,
        channelHandle: channelId,
        channelName: result.data.channel_name,
        channelUrl: result.data.channel_url,
        thumbnail: result.data.thumbnail,
        subscriberCount: result.data.subscriber_count,
        videoCount: result.data.video_count,
        viewCount: result.data.view_count,
        description: result.data.description,
        uploadsPlaylistId: result.data.uploads_playlist_id
      });
      
      toast.success('Canal encontrado correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al buscar el canal. Verifica la URL e intenta nuevamente.');
      console.error(error);
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMonitoring = async () => {
    if (!searchResult || !companyId) return;

    setIsAdding(true);
    try {
      const response = await apiFetch('/api/social/monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: parseInt(companyId),
          platform: searchResult.platform,
          channel_id: searchResult.channelId,
          channel_handle: searchResult.channelHandle,
          channel_name: searchResult.channelName,
          channel_url: searchResult.channelUrl,
          thumbnail: searchResult.thumbnail,
          subscriber_count: searchResult.subscriberCount?.toString(),
          video_count: searchResult.videoCount,
          view_count: searchResult.viewCount?.toString(),
          description: searchResult.description,
          uploads_playlist_id: searchResult.uploadsPlaylistId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al añadir monitorización');
      }

      toast.success('Monitorización añadida correctamente');
      setSearchResult(null);
      setSearchUrl('');
      setSelectedNetwork(null);
      fetchMonitoredChannels();
    } catch (error: any) {
      toast.error(error.message || 'Error al añadir monitorización');
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMonitoring = async (channelId: number) => {
    if (!companyId) return;

    try {
      const response = await apiFetch(`/api/social/monitor/${channelId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar monitorización');
      }

      toast.success('Monitorización eliminada correctamente');
      fetchMonitoredChannels();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar monitorización');
      console.error(error);
    }
  };

  const handleViewVideos = (channel: MonitoredChannel) => {
    console.log('Canal seleccionado:', channel);
    console.log('Thumbnail URL:', channel.thumbnail);
    setSelectedChannel(channel);
  };

  const handleBackToChannels = () => {
    setSelectedChannel(null);
  };

  const formatNumber = (num: number | string | null | undefined) => {
    if (!num) return '0';
    const numValue = typeof num === 'string' ? parseInt(num) : num;
    if (numValue >= 1000000) return `${(numValue / 1000000).toFixed(1)}M`;
    if (numValue >= 1000) return `${(numValue / 1000).toFixed(1)}K`;
    return numValue.toString();
  };

  // Si hay un canal seleccionado, mostrar la vista de videos
  if (selectedChannel) {
    return (
      <ChannelVideos
        channelId={selectedChannel.id}
        channelName={selectedChannel.channel_name}
        channelThumbnail={selectedChannel.thumbnail}
        onBack={handleBackToChannels}
      />
    );
  }

  // Vista principal de monitorización de canales
  return (
    <div className="min-h-screen max-h-screen overflow-hidden flex">
      <SoftMathBackground />
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-slate-900/50 hover:scrollbar-thumb-slate-600/70">
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          <Header />

          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">
              Monitorización de Redes Sociales
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-white/70">
              Añade y gestiona canales y perfiles para monitorizar
            </p>
          </div>

          {!selectedNetwork && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {socialNetworks.map((network) => (
                <div
                  key={network.id}
                  onClick={() => setSelectedNetwork(network.id)}
                  className="relative group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r opacity-20 group-hover:opacity-30 blur-xl rounded-2xl transition-all duration-300"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${network.color.split(' ')[0].replace('from-', '')}, ${network.color.split(' ')[1].replace('to-', '')})`
                    }}
                  ></div>
                  
                  <div className="relative p-6 glass-effect rounded-xl sm:rounded-2xl hover:scale-105 transition-all duration-300 border border-white/10 group-hover:border-white/20">
                    <div className={`flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${network.color} p-3 shadow-lg`}>
                      {network.icon}
                    </div>
                    <h3 className="text-lg font-bold text-white text-center mb-2">
                      {network.name}
                    </h3>
                    <p className="text-xs text-white/60 text-center">
                      {network.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedNetwork && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-blue-500/10 blur-3xl rounded-2xl"></div>
              
              <div className="relative p-4 sm:p-6 glass-effect rounded-xl sm:rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${socialNetworks.find(n => n.id === selectedNetwork)?.color} shadow-lg`}>
                      {socialNetworks.find(n => n.id === selectedNetwork)?.icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {socialNetworks.find(n => n.id === selectedNetwork)?.name}
                      </h2>
                      <p className="text-sm text-white/70">
                        Introduce la URL del canal o perfil
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedNetwork(null);
                      setSearchUrl('');
                      setSearchResult(null);
                    }}
                    variant="outline"
                    className="glass-effect border-white/10 hover:bg-white/10 text-white"
                  >
                    Cambiar red social
                  </Button>
                </div>

                <div className="flex gap-3 mb-4">
                  <Input
                    type="text"
                    value={searchUrl}
                    onChange={(e) => setSearchUrl(e.target.value)}
                    placeholder={socialNetworks.find(n => n.id === selectedNetwork)?.placeholder}
                    className="glass-effect border-white/10 text-white placeholder:text-white/40"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching || !searchUrl.trim()}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 shadow-lg shadow-cyan-500/30"
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {searchResult && (
                  <div className="mt-6 p-4 glass-effect rounded-xl border border-green-400/30">
                    <div className="flex items-center gap-4 mb-4">
                      <Check className="h-8 w-8 text-green-400 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-bold text-white">Canal encontrado</h3>
                        <p className="text-sm text-white/70">Verifica los datos antes de añadir la monitorización</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 glass-effect rounded-lg mb-4">
                      {searchResult.thumbnail && (
                        <img
                          src={searchResult.thumbnail}
                          alt={searchResult.channelName}
                          className="w-20 h-20 rounded-full object-cover border-2 border-white/20"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-white mb-2">
                          {searchResult.channelName}
                        </h4>
                        {searchResult.subscriberCount && (
                          <p className="text-white/70 mb-2">
                            {formatNumber(searchResult.subscriberCount)} suscriptores
                          </p>
                        )}
                        <a
                          href={searchResult.channelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1"
                        >
                          Ver perfil <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    <Button
                      onClick={handleAddMonitoring}
                      disabled={isAdding}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg shadow-green-500/30"
                    >
                      {isAdding ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Añadiendo...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Añadir monitorización
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {!searchResult && !isSearching && searchUrl && (
                  <div className="mt-6 p-4 glass-effect rounded-xl border border-orange-400/30">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-6 w-6 text-orange-400 flex-shrink-0" />
                      <p className="text-white/70">
                        Introduce una URL y haz clic en buscar para encontrar el canal
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10 blur-3xl rounded-2xl"></div>
            
            <div className="relative p-4 sm:p-6 glass-effect rounded-xl sm:rounded-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">
                Canales Monitorizados
              </h2>

              {isLoadingChannels ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
                </div>
              ) : monitoredChannels.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-16 w-16 text-white/30 mx-auto mb-4" />
                  <p className="text-white/70 text-lg">
                    No tienes canales monitorizados aún
                  </p>
                  <p className="text-white/50 text-sm mt-2">
                    Añade tu primer canal usando el buscador de arriba
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {monitoredChannels.map((channel) => {
                    const network = socialNetworks.find(n => n.id === channel.platform);
                    return (
                      <div
                        key={channel.id}
                        className="p-4 glass-effect rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${network?.color} shadow-lg flex-shrink-0`}>
                            {network?.icon}
                          </div>
                          {channel.thumbnail && (
                            <img
                              src={channel.thumbnail}
                              alt={channel.channel_name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                            />
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2 truncate">
                          {channel.channel_name}
                        </h3>

                        {channel.subscriber_count && (
                          <p className="text-white/70 text-sm mb-3">
                            {formatNumber(channel.subscriber_count)} suscriptores
                          </p>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <a
                              href={channel.channel_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1 flex-1"
                            >
                              Ver perfil <ExternalLink className="h-3 w-3" />
                            </a>
                            <Button
                              onClick={() => handleRemoveMonitoring(channel.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {channel.platform === 'youtube' && (
                            <Button
                              onClick={() => handleViewVideos(channel)}
                              variant="outline"
                              size="sm"
                              className="w-full glass-effect border-cyan-400/30 hover:bg-cyan-400/10 text-cyan-400 hover:text-cyan-300"
                            >
                              <Video className="h-4 w-4 mr-2" />
                              Ver videos del canal
                            </Button>
                          )}
                        </div>

                        <p className="text-white/40 text-xs mt-3">
                          Añadido: {new Date(channel.added_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlHaters;
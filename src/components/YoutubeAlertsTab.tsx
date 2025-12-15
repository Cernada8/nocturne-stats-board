import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, Youtube, MessageSquare, AlertCircle, Check, X, Save, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

interface MonitoringAlert {
  id: number;
  name: string;
  alert_type: 'video_title_mention' | 'video_description_mention' | 'comment_mention' | 'comment_threshold';
  keywords: string[];
  threshold?: number;
  channels: number[];
  channel_names?: string[];
  is_active: boolean;
  notification_emails: string;
  created_at: string;
  last_triggered?: string;
  trigger_count: number;
}

interface Channel {
  id: number;
  channel_name: string;
  thumbnail: string | null;
  platform_slug: string;
}

const YouTubeAlertsTab = () => {
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    alert_type: 'video_title_mention' as MonitoringAlert['alert_type'],
    keywords: '',
    threshold: 5,
    channels: [] as number[],
    notification_emails: '',
    is_active: true
  });

  useEffect(() => {
    fetchAlerts();
    fetchChannels();
  }, []);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/api/social/monitoring-alerts');
      if (!response.ok) throw new Error('Error al cargar alertas');
      
      const result = await response.json();
      setAlerts(result.data);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar alertas');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChannels = async () => {
    try {
      const response = await apiFetch('/api/social/channels');
      if (!response.ok) throw new Error('Error al cargar canales');
      
      const result = await response.json();
      setChannels(result.data.channels.filter((ch: Channel) => ch.platform_slug === 'youtube'));
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar canales');
    }
  };

  const handleCreateAlert = async () => {
    try {
      const keywordsArray = formData.keywords.split(',').map(k => k.trim()).filter(Boolean);
      
      if (!formData.name || keywordsArray.length === 0) {
        toast.error('Completa el nombre y al menos una palabra clave');
        return;
      }

      if (formData.channels.length === 0) {
        toast.error('Selecciona al menos un canal');
        return;
      }

      if (!formData.notification_emails) {
        toast.error('Ingresa al menos un email de notificación');
        return;
      }

      const payload = {
        name: formData.name,
        alert_type: formData.alert_type,
        keywords: keywordsArray,
        threshold: formData.alert_type === 'comment_threshold' ? formData.threshold : null,
        channels: formData.channels,
        notification_emails: formData.notification_emails,
        is_active: formData.is_active
      };

      const response = await apiFetch('/api/social/monitoring-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear alerta');
      }

      toast.success('Alerta creada correctamente');
      setShowCreateForm(false);
      resetForm();
      fetchAlerts();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear alerta');
    }
  };

  const handleUpdateAlert = async (alertId: number) => {
    try {
      const alert = alerts.find(a => a.id === alertId);
      if (!alert) return;

      const response = await apiFetch(`/api/social/monitoring-alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !alert.is_active })
      });

      if (!response.ok) throw new Error('Error al actualizar alerta');

      toast.success('Alerta actualizada');
      fetchAlerts();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar alerta');
    }
  };

  const handleDeleteAlert = async (alertId: number) => {
    if (!confirm('¿Estás seguro de eliminar esta alerta?')) return;

    try {
      const response = await apiFetch(`/api/social/monitoring-alerts/${alertId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Error al eliminar alerta');

      toast.success('Alerta eliminada');
      fetchAlerts();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar alerta');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      alert_type: 'video_title_mention',
      keywords: '',
      threshold: 5,
      channels: [],
      notification_emails: '',
      is_active: true
    });
  };

  const toggleChannelSelection = (channelId: number) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channelId)
        ? prev.channels.filter(id => id !== channelId)
        : [...prev.channels, channelId]
    }));
  };

  const getAlertTypeLabel = (type: MonitoringAlert['alert_type']) => {
    const labels = {
      video_title_mention: 'Mención en título de video',
      video_description_mention: 'Mención en descripción de video',
      comment_mention: 'Mención en comentarios',
      comment_threshold: 'Umbral de comentarios con mención'
    };
    return labels[type];
  };

  const getAlertTypeIcon = (type: MonitoringAlert['alert_type']) => {
    if (type.includes('video')) return <Youtube className="h-4 w-4" />;
    return <MessageSquare className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Header con botón */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/70 text-sm">
            Configura alertas para recibir notificaciones cuando se mencione a tu cliente en YouTube
          </p>
        </div>
        
        <Button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            resetForm();
          }}
          className="glass-effect border border-white/10 hover:bg-white/10 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Alerta YouTube
        </Button>
      </div>

      {/* Formulario de creación */}
      {showCreateForm && (
        <div className="glass-card p-4 sm:p-6 border border-white/10 rounded-xl space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">Crear Nueva Alerta de YouTube</h3>

          {/* Nombre */}
          <div>
            <label className="block text-white/70 text-sm mb-2">Nombre de la alerta</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Menciones de mi cliente en videos"
              className="glass-card border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          {/* Tipo de alerta */}
          <div>
            <label className="block text-white/70 text-sm mb-2">Tipo de alerta</label>
            <select
              value={formData.alert_type}
              onChange={(e) => setFormData({ ...formData, alert_type: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg glass-card border border-white/10 text-white bg-slate-800/50"
            >
              <option value="video_title_mention" className="bg-slate-900">
                📹 Mención en título de video
              </option>
              <option value="video_description_mention" className="bg-slate-900">
                📝 Mención en descripción de video
              </option>
              <option value="comment_mention" className="bg-slate-900">
                💬 Mención en comentarios (cualquier cantidad)
              </option>
              <option value="comment_threshold" className="bg-slate-900">
                🔢 Umbral de comentarios con mención
              </option>
            </select>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-white/70 text-sm mb-2">
              Palabras clave (separadas por comas)
            </label>
            <Input
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="Ej: mi cliente, nombre empresa, @usuario"
              className="glass-card border-white/10 text-white placeholder:text-white/40"
            />
            <p className="text-white/50 text-xs mt-1">
              La alerta se activará si se encuentra alguna de estas palabras
            </p>
          </div>

          {/* Threshold */}
          {formData.alert_type === 'comment_threshold' && (
            <div>
              <label className="block text-white/70 text-sm mb-2">
                Umbral de comentarios
              </label>
              <Input
                type="number"
                min="1"
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) })}
                className="glass-card border-white/10 text-white"
              />
              <p className="text-white/50 text-xs mt-1">
                Alertar cuando un video tenga {formData.threshold} o más comentarios con las palabras clave
              </p>
            </div>
          )}

          {/* Emails */}
          <div>
            <label className="block text-white/70 text-sm mb-2">
              Emails de notificación (separados por comas)
            </label>
            <Input
              value={formData.notification_emails}
              onChange={(e) => setFormData({ ...formData, notification_emails: e.target.value })}
              placeholder="admin@empresa.com, marketing@empresa.com"
              className="glass-card border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          {/* Canales */}
          <div>
            <label className="block text-white/70 text-sm mb-2">
              Canales a monitorizar
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {channels.length === 0 ? (
                <p className="text-white/50 text-sm">
                  No hay canales de YouTube monitorizados
                </p>
              ) : (
                channels.map(channel => (
                  <div
                    key={channel.id}
                    onClick={() => toggleChannelSelection(channel.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      formData.channels.includes(channel.id)
                        ? 'bg-orange-500/20 border-2 border-orange-400/50'
                        : 'glass-card border border-white/10 hover:bg-white/5'
                    }`}
                  >
                    {channel.thumbnail && (
                      <img
                        src={channel.thumbnail}
                        alt={channel.channel_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <span className="text-white flex-1">{channel.channel_name}</span>
                    {formData.channels.includes(channel.id) && (
                      <Check className="h-5 w-5 text-orange-400" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleCreateAlert}
              className="flex-1 glass-effect bg-orange-500/20 border border-orange-500/30 text-white hover:bg-orange-500/30"
            >
              <Save className="h-4 w-4 mr-2" />
              Crear Alerta
            </Button>
            <Button
              onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}
              variant="outline"
              className="glass-effect border-white/10 hover:bg-white/10 text-white"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Lista de alertas */}
      <div className="glass-card p-4 sm:p-6 border border-white/10 rounded-xl">
        <h3 className="text-lg font-bold text-white mb-4">Alertas de YouTube Configuradas</h3>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-10 w-10 animate-spin text-orange-400" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12">
            <Youtube className="h-16 w-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/70 text-lg mb-2">
              No hay alertas de YouTube configuradas
            </p>
            <p className="text-white/50 text-sm">
              Crea tu primera alerta para empezar a monitorizar menciones en YouTube
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all ${
                  alert.is_active
                    ? 'glass-card border-orange-400/30 bg-orange-500/5'
                    : 'glass-card border-white/10 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getAlertTypeIcon(alert.alert_type)}
                      <h4 className="text-base font-bold text-white">
                        {alert.name}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        alert.is_active
                          ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                          : 'bg-gray-500/20 text-gray-300 border border-gray-400/30'
                      }`}>
                        {alert.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    
                    <p className="text-white/70 text-sm mb-2">
                      {getAlertTypeLabel(alert.alert_type)}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-2">
                      {alert.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>

                    {alert.threshold && (
                      <p className="text-white/60 text-sm mb-2">
                        Umbral: {alert.threshold} comentarios
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                      <Mail className="h-3 w-3" />
                      <span>{alert.notification_emails}</span>
                    </div>

                    {alert.channel_names && (
                      <div className="flex flex-wrap gap-1 text-xs text-white/50">
                        <span>Canales:</span>
                        {alert.channel_names.map((name, idx) => (
                          <span key={idx}>
                            {name}{idx < alert.channel_names!.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>
                    )}

                    {alert.trigger_count > 0 && (
                      <div className="mt-2 text-xs text-orange-400">
                        ⚡ Activada {alert.trigger_count} veces
                        {alert.last_triggered && ` · Última: ${new Date(alert.last_triggered).toLocaleString('es-ES')}`}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdateAlert(alert.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 glass-effect border-white/10 hover:bg-white/10 text-white"
                      title={alert.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {alert.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      onClick={() => handleDeleteAlert(alert.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 glass-effect border-red-400/30 hover:bg-red-500/20 text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeAlertsTab;
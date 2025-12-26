import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext'; 
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Youtube, MessageSquare, AlertCircle, Check, X, Save, Mail, Power, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

interface MonitoringAlert {
  id: number;
  company_id: number;
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
  platform: string;
}

const YouTubeAlertsTab = () => {
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<MonitoringAlert | null>(null);
  const { companyId } = useAuth();
  
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
    if (companyId) {
      fetchAlerts();
      fetchChannels();
    }
  }, [companyId]);

  const fetchAlerts = async () => {
    if (!companyId) {
      console.warn('No companyId available');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await apiFetch(`/api/social/monitoring-alerts?company_id=${companyId}`);
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
    if (!companyId) return;
    try {
      const response = await apiFetch('/api/social/monitored?company_id=' + companyId);
      if (!response.ok) throw new Error('Error al cargar canales');
      
      const result = await response.json();
      setChannels(result.data.channels.filter((ch: Channel) => ch.platform === 'youtube'));
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar canales');
    }
  };

  const handleCreateOrUpdateAlert = async () => {
    if (!companyId) {
      toast.error('No se ha identificado la compañía');
      return;
    }

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
        company_id: parseInt(companyId),
        name: formData.name,
        alert_type: formData.alert_type,
        keywords: keywordsArray,
        threshold: formData.alert_type === 'comment_threshold' ? formData.threshold : null,
        channels: formData.channels,
        notification_emails: formData.notification_emails,
        is_active: formData.is_active
      };

      const url = editingAlert 
        ? `/api/social/monitoring-alerts/${editingAlert.id}?company_id=${companyId}`
        : `/api/social/monitoring-alerts?company_id=${companyId}`;
      
      const method = editingAlert ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar alerta');
      }

      toast.success(editingAlert ? 'Alerta actualizada' : 'Alerta creada correctamente');
      setIsDialogOpen(false);
      resetForm();
      fetchAlerts();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar alerta');
    }
  };

  const handleEdit = (alert: MonitoringAlert) => {
    setEditingAlert(alert);
    setFormData({
      name: alert.name,
      alert_type: alert.alert_type,
      keywords: alert.keywords.join(', '),
      threshold: alert.threshold || 5,
      channels: alert.channels,
      notification_emails: alert.notification_emails,
      is_active: alert.is_active
    });
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (alert: MonitoringAlert) => {
    if (!companyId) {
      toast.error('No se ha identificado la compañía');
      return;
    }

    try {
      const response = await apiFetch(`/api/social/monitoring-alerts/${alert.id}?company_id=${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !alert.is_active })
      });

      if (!response.ok) throw new Error('Error al actualizar alerta');

      toast.success(alert.is_active ? 'Alerta desactivada' : 'Alerta activada');
      fetchAlerts();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar alerta');
    }
  };

  const handleDeleteAlert = async (alertId: number) => {
    if (!companyId) {
      toast.error('No se ha identificado la compañía');
      return;
    }

    if (!confirm('¿Estás seguro de eliminar esta alerta?')) return;

    try {
      const response = await apiFetch(`/api/social/monitoring-alerts/${alertId}?company_id=${companyId}`, {
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
    setEditingAlert(null);
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
    if (type.includes('video')) return Youtube;
    return MessageSquare;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/70 text-sm">
            Configura alertas para recibir notificaciones cuando se mencione a tu cliente en YouTube
          </p>
        </div>
        
        <Button
          onClick={() => {
            setIsDialogOpen(true);
            resetForm();
          }}
          className="glass-effect border border-white/10 hover:bg-white/10 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Alerta YouTube
        </Button>
      </div>

      {/* Dialog para crear/editar */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="glass-card border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              {editingAlert ? 'Editar Alerta de YouTube' : 'Nueva Alerta de YouTube'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label className="text-white">Nombre de la alerta</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Menciones de mi cliente en videos"
                className="glass-card border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            {/* Tipo de alerta */}
            <div className="space-y-2">
              <Label className="text-white">Tipo de alerta</Label>
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
            <div className="space-y-2">
              <Label className="text-white">
                Palabras clave (separadas por comas)
              </Label>
              <Input
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="Ej: mi cliente, nombre empresa, @usuario"
                className="glass-card border-white/10 text-white placeholder:text-white/40"
              />
              <p className="text-white/50 text-xs">
                La alerta se activará si se encuentra alguna de estas palabras
              </p>
            </div>

            {/* Threshold */}
            {formData.alert_type === 'comment_threshold' && (
              <div className="space-y-2">
                <Label className="text-white">Umbral de comentarios</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.threshold}
                  onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) })}
                  className="glass-card border-white/10 text-white"
                />
                <p className="text-white/50 text-xs">
                  Alertar cuando un video tenga {formData.threshold} o más comentarios con las palabras clave
                </p>
              </div>
            )}

            {/* Emails */}
            <div className="space-y-2">
              <Label className="text-white">
                Emails de notificación (separados por comas)
              </Label>
              <Input
                value={formData.notification_emails}
                onChange={(e) => setFormData({ ...formData, notification_emails: e.target.value })}
                placeholder="admin@empresa.com, marketing@empresa.com"
                className="glass-card border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            {/* Canales */}
            <div className="space-y-2">
              <Label className="text-white">Canales a monitorizar</Label>
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
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 glass-effect border-white/10 text-white"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCreateOrUpdateAlert}
                className="flex-1 glass-effect bg-orange-500/20 border border-orange-500/30 text-white hover:bg-orange-500/30"
              >
                {editingAlert ? 'Actualizar' : 'Crear Alerta'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contador de alertas activas */}
      <div className="flex justify-end">
        <div className="glass-card px-3 py-1 border border-white/10">
          <p className="text-xs text-white/70">
            <span className="font-bold text-white">{alerts.filter(a => a.is_active).length}</span> activas de <span className="font-bold text-white">{alerts.length}</span>
          </p>
        </div>
      </div>

      {/* Lista de alertas */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-purple-500/10 blur-3xl rounded-3xl"></div>

        <div className="relative space-y-3">
          {isLoading ? (
            <div className="flex justify-center items-center h-[400px]">
              <div className="text-center space-y-4">
                <Loader2 className="h-16 w-16 animate-spin text-orange-400 mx-auto" />
                <p className="text-white/70 text-sm">Cargando alertas de YouTube...</p>
              </div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-[400px] text-white/70 space-y-4 px-4">
              <Youtube className="h-16 w-16 text-white/30" />
              <div className="text-center">
                <p className="text-lg font-medium mb-1">
                  No hay alertas de YouTube configuradas
                </p>
                <p className="text-sm text-white/50">
                  Crea tu primera alerta para empezar a monitorizar menciones en YouTube
                </p>
              </div>
            </div>
          ) : (
            alerts.map(alert => {
              const AlertIcon = getAlertTypeIcon(alert.alert_type);
              
              return (
                <div
                  key={alert.id}
                  className={`glass-card p-5 border transition-all duration-300 rounded-xl group ${
                    alert.is_active ? 'border-white/10 hover:bg-white/5' : 'border-white/5 bg-white/[0.02] opacity-60'
                  }`}
                >
                  <div className="flex flex-col gap-4">
                    {/* Header con nombre y acciones */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-3 glass-effect rounded-lg border ${alert.is_active ? 'border-white/20' : 'border-white/10'}`}>
                          <AlertIcon className="h-5 w-5 text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-white truncate">
                            {alert.name}
                          </h3>
                          <p className="text-sm text-white/70 mt-0.5">
                            {getAlertTypeLabel(alert.alert_type)}
                          </p>
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(alert)}
                          className={`h-8 w-8 p-0 ${
                            alert.is_active 
                              ? 'text-green-400 hover:bg-green-500/20' 
                              : 'text-white/50 hover:bg-white/10'
                          }`}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(alert)}
                          className="h-8 w-8 p-0 text-blue-400 hover:bg-blue-500/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Información de la alerta */}
                    <div className="glass-effect rounded-lg p-4 border border-white/10">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Palabras clave</p>
                          <div className="flex flex-wrap gap-1">
                            {alert.keywords.map((keyword, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>

                        {alert.threshold && (
                          <div>
                            <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Umbral</p>
                            <p className="text-sm text-white font-medium">
                              {alert.threshold} comentarios
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Última activación</p>
                          <p className="text-sm text-white font-medium">
                            {alert.last_triggered 
                              ? new Date(alert.last_triggered).toLocaleDateString('es-ES')
                              : 'Nunca'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Veces activada</p>
                          <p className="text-sm font-bold text-cyan-400">
                            {alert.trigger_count}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Emails y canales */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-white/50 shrink-0" />
                        <p className="text-xs text-white/70">
                          {alert.notification_emails}
                        </p>
                      </div>

                      {alert.channel_names && alert.channel_names.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Youtube className="h-4 w-4 text-white/50 shrink-0 mt-0.5" />
                          <p className="text-xs text-white/70">
                            <span className="text-white/50">Canales: </span>
                            {alert.channel_names.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default YouTubeAlertsTab;
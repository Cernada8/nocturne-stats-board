import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Sidebar from '@/components/Sidebar';
import {
    Loader2,
    Bell,
    Plus,
    Edit,
    Trash2,
    Power,
    TrendingUp,
    Frown,
    Smile,
    Mail,
    Clock,
    Filter,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import SoftMathBackground from '@/components/SoftMathBackground';
import Header from '@/components/Header';

interface Alert {
    id: string;
    name: string;
}

interface AlertRule {
    id: number;
    name: string;
    is_active: boolean;
    metric_type: string;
    condition: string;
    threshold: number;
    threshold_secondary: number | null;
    filters: Record<string, any>;
    time_period: string;
    notification_emails: string;
    last_triggered: string | null;
    trigger_count: number;
    created_at: string;
    updated_at: string;
}

const Alertas = () => {
    const { userEmail, companyId, setCompanyId } = useAuth();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
    const [filterMetric, setFilterMetric] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        metric_type: 'mention_count',
        condition: 'greater_than',
        threshold: 10,
        threshold_secondary: null as number | null,
        time_period: 'day',
        notification_emails: '',
        filters: {} as Record<string, any>,
        is_active: true
    });

    const metricTypes = [
        { value: 'mention_count', label: 'Total de menciones', icon: Bell, color: 'text-blue-400' },
        { value: 'negative_mentions', label: 'Menciones negativas', icon: Frown, color: 'text-red-400' },
        { value: 'positive_mentions', label: 'Menciones positivas', icon: Smile, color: 'text-green-400' },
        { value: 'total_reach', label: 'Alcance total', icon: TrendingUp, color: 'text-purple-400' },
    ];

    const conditions = [
        { value: 'greater_than', label: 'Mayor que' },
        { value: 'greater_or_equal', label: 'Mayor o igual que' },
        { value: 'less_than', label: 'Menor que' },
        { value: 'less_or_equal', label: 'Menor o igual que' },
        { value: 'equals', label: 'Igual a' },
        { value: 'between', label: 'Entre' }
    ];

    const timePeriods = [
        { value: 'hour', label: 'Última hora', icon: Clock },
        { value: 'day', label: 'Último día', icon: Clock },
        { value: 'week', label: 'Última semana', icon: Clock },
        { value: 'month', label: 'Último mes', icon: Clock }
    ];

    useEffect(() => {
        if (userEmail && !companyId) {
            fetchCompanyId();
        }
    }, [userEmail, companyId]);

    useEffect(() => {
        if (companyId) {
            fetchAlerts();
            fetchAlertRules();
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

    const fetchAlertRules = async () => {
        if (!companyId) return;

        setIsLoading(true);
        try {
            const response = await apiFetch(`/api/alert-rules?company_id=${companyId}`);
            if (!response.ok) throw new Error('Error al obtener reglas de alerta');

            const result = await response.json();
            setAlertRules(result.data || []);
        } catch (error) {
            toast.error('Error al cargar reglas de alerta');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        if (!formData.notification_emails.trim()) {
            toast.error('Debes especificar al menos un email');
            return;
        }

        try {
            const payload = {
                ...formData,
                company_id: parseInt(companyId || '0')
            };

            const url = editingRule 
                ? `/api/alert-rules/${editingRule.id}`
                : '/api/alert-rules';
            
            const method = editingRule ? 'PUT' : 'POST';

            const response = await apiFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Error al guardar la regla');

            toast.success(editingRule ? 'Regla actualizada' : 'Regla creada correctamente');
            setIsDialogOpen(false);
            resetForm();
            fetchAlertRules();
        } catch (error) {
            toast.error('Error al guardar la regla');
            console.error(error);
        }
    };

    const handleEdit = (rule: AlertRule) => {
        setEditingRule(rule);
        setFormData({
            name: rule.name,
            metric_type: rule.metric_type,
            condition: rule.condition,
            threshold: rule.threshold,
            threshold_secondary: rule.threshold_secondary,
            time_period: rule.time_period,
            notification_emails: rule.notification_emails,
            filters: rule.filters || {},
            is_active: rule.is_active
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta regla?')) return;

        try {
            const response = await apiFetch(`/api/alert-rules/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Error al eliminar');

            toast.success('Regla eliminada');
            fetchAlertRules();
        } catch (error) {
            toast.error('Error al eliminar la regla');
            console.error(error);
        }
    };

    const handleToggleActive = async (rule: AlertRule) => {
        try {
            const response = await apiFetch(`/api/alert-rules/${rule.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !rule.is_active })
            });

            if (!response.ok) throw new Error('Error al actualizar');

            toast.success(rule.is_active ? 'Regla desactivada' : 'Regla activada');
            fetchAlertRules();
        } catch (error) {
            toast.error('Error al actualizar la regla');
            console.error(error);
        }
    };

    const resetForm = () => {
        setEditingRule(null);
        setFormData({
            name: '',
            metric_type: 'mention_count',
            condition: 'greater_than',
            threshold: 10,
            threshold_secondary: null,
            time_period: 'day',
            notification_emails: '',
            filters: {},
            is_active: true
        });
    };

    const getMetricInfo = (type: string) => {
        return metricTypes.find(m => m.value === type) || metricTypes[0];
    };

    const filteredRules = filterMetric 
        ? alertRules.filter(r => r.metric_type === filterMetric)
        : alertRules;

    return (
        <div className="min-h-screen max-h-screen overflow-hidden flex flex-col lg:flex-row">
            <SoftMathBackground />
            <Sidebar />

            <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-slate-900/50 hover:scrollbar-thumb-slate-600/70">
                <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
                    <Header />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1">
                                Alertas Personalizadas
                            </h1>
                            <p className="text-xs sm:text-sm md:text-base text-white/70">
                                Configura alertas automáticas y recibe notificaciones
                            </p>
                        </div>
                        
                        <Dialog open={isDialogOpen} onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (!open) resetForm();
                        }}>
                            <DialogTrigger asChild>
                                <Button className="glass-effect border border-white/10 hover:bg-white/10 text-white">
                                    <Plus className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Nueva Alerta</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="glass-card border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-white text-xl">
                                        {editingRule ? 'Editar Alerta' : 'Nueva Alerta'}
                                    </DialogTitle>
                                </DialogHeader>

                                <div className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <Label className="text-white">Nombre de la alerta</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            placeholder="Ej: Muchas menciones negativas"
                                            className="glass-card border-white/10 text-white"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-white">Métrica a monitorear</Label>
                                        <select
                                            value={formData.metric_type}
                                            onChange={(e) => setFormData({...formData, metric_type: e.target.value})}
                                            className="w-full glass-card border border-white/10 text-white p-2 rounded-lg bg-slate-800/50"
                                        >
                                            {metricTypes.map(metric => (
                                                <option key={metric.value} value={metric.value}>
                                                    {metric.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-white">Condición</Label>
                                            <select
                                                value={formData.condition}
                                                onChange={(e) => setFormData({...formData, condition: e.target.value})}
                                                className="w-full glass-card border border-white/10 text-white p-2 rounded-lg bg-slate-800/50"
                                            >
                                                {conditions.map(cond => (
                                                    <option key={cond.value} value={cond.value}>
                                                        {cond.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-white">Valor umbral</Label>
                                            <Input
                                                type="number"
                                                value={formData.threshold}
                                                onChange={(e) => setFormData({...formData, threshold: parseInt(e.target.value) || 0})}
                                                className="glass-card border-white/10 text-white"
                                            />
                                        </div>
                                    </div>

                                    {formData.condition === 'between' && (
                                        <div className="space-y-2">
                                            <Label className="text-white">Valor máximo</Label>
                                            <Input
                                                type="number"
                                                value={formData.threshold_secondary || ''}
                                                onChange={(e) => setFormData({...formData, threshold_secondary: parseInt(e.target.value) || null})}
                                                className="glass-card border-white/10 text-white"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label className="text-white">Período de evaluación</Label>
                                        <select
                                            value={formData.time_period}
                                            onChange={(e) => setFormData({...formData, time_period: e.target.value})}
                                            className="w-full glass-card border border-white/10 text-white p-2 rounded-lg bg-slate-800/50"
                                        >
                                            {timePeriods.map(period => (
                                                <option key={period.value} value={period.value}>
                                                    {period.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-white">Emails de notificación (separados por coma)</Label>
                                        <Input
                                            value={formData.notification_emails}
                                            onChange={(e) => setFormData({...formData, notification_emails: e.target.value})}
                                            placeholder="admin@empresa.com, marketing@empresa.com"
                                            className="glass-card border-white/10 text-white"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-white">Filtrar por alerta específica (opcional)</Label>
                                        <select
                                            value={formData.filters.alert_id || ''}
                                            onChange={(e) => setFormData({
                                                ...formData, 
                                                filters: e.target.value ? {...formData.filters, alert_id: e.target.value} : {}
                                            })}
                                            className="w-full glass-card border border-white/10 text-white p-2 rounded-lg bg-slate-800/50"
                                        >
                                            <option value="">Todas las alertas</option>
                                            {alerts.map(alert => (
                                                <option key={alert.id} value={alert.id}>
                                                    {alert.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

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
                                            onClick={handleSubmit}
                                            className="flex-1 glass-effect bg-purple-500/20 border border-purple-500/30 text-white hover:bg-purple-500/30"
                                        >
                                            {editingRule ? 'Actualizar' : 'Crear Alerta'}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="glass-effect border-white/10 hover:bg-white/10 text-white text-xs h-7 sm:h-8 px-2 sm:px-3"
                                >
                                    <Filter className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                    {filterMetric ? getMetricInfo(filterMetric).label : 'Todas las métricas'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[240px] p-2 glass-card border-white/10">
                                <div className="space-y-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`w-full justify-start text-white hover:bg-white/10 text-xs ${!filterMetric ? 'bg-white/10' : ''}`}
                                        onClick={() => setFilterMetric(null)}
                                    >
                                        Todas las métricas
                                    </Button>
                                    {metricTypes.map((metric) => (
                                        <Button
                                            key={metric.value}
                                            variant="ghost"
                                            size="sm"
                                            className={`w-full justify-start text-white hover:bg-white/10 text-xs ${filterMetric === metric.value ? 'bg-white/10' : ''}`}
                                            onClick={() => setFilterMetric(metric.value)}
                                        >
                                            <metric.icon className={`mr-2 h-3 w-3 ${metric.color}`} />
                                            {metric.label}
                                        </Button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        <div className="ml-auto glass-card px-2 sm:px-3 py-1 border border-white/10">
                            <p className="text-xs text-white/70">
                                <span className="font-bold text-white">{alertRules.filter(r => r.is_active).length}</span> activas de <span className="font-bold text-white">{alertRules.length}</span>
                            </p>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 blur-3xl rounded-3xl"></div>

                        <div className="relative space-y-2 sm:space-y-3 md:space-y-4">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-[300px] sm:h-[400px]">
                                    <div className="text-center space-y-3 sm:space-y-4">
                                        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 animate-spin text-purple-400 mx-auto" />
                                        <p className="text-white/70 text-xs sm:text-sm">Cargando alertas...</p>
                                    </div>
                                </div>
                            ) : filteredRules.length > 0 ? (
                                <>
                                    {filteredRules.map((rule) => {
                                        const metricInfo = getMetricInfo(rule.metric_type);
                                        const MetricIcon = metricInfo.icon;

                                        return (
                                            <div
                                                key={rule.id}
                                                className={`glass-card p-3 sm:p-4 md:p-5 lg:p-6 border transition-all duration-300 rounded-lg sm:rounded-xl group ${
                                                    rule.is_active ? 'border-white/10 hover:bg-white/5' : 'border-white/5 bg-white/[0.02] opacity-60'
                                                }`}
                                            >
                                                <div className="flex flex-col gap-3 sm:gap-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                                                            <div className={`p-2 sm:p-3 glass-effect rounded-lg border ${rule.is_active ? 'border-white/20' : 'border-white/10'}`}>
                                                                <MetricIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${metricInfo.color}`} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="text-sm sm:text-base md:text-lg font-bold text-white truncate">
                                                                    {rule.name}
                                                                </h3>
                                                                <p className="text-xs sm:text-sm text-white/70 mt-0.5">
                                                                    {metricInfo.label}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-1 sm:gap-2 shrink-0">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleToggleActive(rule)}
                                                                className={`h-7 w-7 sm:h-8 sm:w-8 p-0 ${
                                                                    rule.is_active 
                                                                        ? 'text-green-400 hover:bg-green-500/20' 
                                                                        : 'text-white/50 hover:bg-white/10'
                                                                }`}
                                                            >
                                                                <Power className="h-3 w-3 sm:h-4 sm:w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleEdit(rule)}
                                                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-blue-400 hover:bg-blue-500/20"
                                                            >
                                                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDelete(rule.id)}
                                                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-400 hover:bg-red-500/20"
                                                            >
                                                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="glass-effect rounded-lg p-3 sm:p-4 border border-white/10">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                                                            <div>
                                                                <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wide mb-1">Condición</p>
                                                                <p className="text-xs sm:text-sm text-white font-medium">
                                                                    {conditions.find(c => c.value === rule.condition)?.label} {rule.threshold}
                                                                    {rule.condition === 'between' && rule.threshold_secondary && ` - ${rule.threshold_secondary}`}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wide mb-1">Período</p>
                                                                <p className="text-xs sm:text-sm text-white font-medium">
                                                                    {timePeriods.find(p => p.value === rule.time_period)?.label}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wide mb-1">Última activación</p>
                                                                <p className="text-xs sm:text-sm text-white font-medium">
                                                                    {rule.last_triggered 
                                                                        ? new Date(rule.last_triggered).toLocaleDateString('es-ES')
                                                                        : 'Nunca'}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wide mb-1">Veces activada</p>
                                                                <p className="text-xs sm:text-sm font-bold text-cyan-400">
                                                                    {rule.trigger_count}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-white/50 shrink-0" />
                                                        <p className="text-[10px] sm:text-xs text-white/70">
                                                            {rule.notification_emails.split(',').map(email => email.trim()).join(', ')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            ) : (
                                <div className="flex flex-col justify-center items-center h-[300px] sm:h-[400px] text-white/70 space-y-3 sm:space-y-4 px-4">
                                    <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-white/30" />
                                    <div className="text-center">
                                        <p className="text-sm sm:text-base md:text-lg font-medium mb-1">
                                            No hay alertas configuradas
                                        </p>
                                        <p className="text-xs sm:text-sm text-white/50">
                                            Crea tu primera alerta para recibir notificaciones automáticas
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Alertas;
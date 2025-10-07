import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import AuroraBackground from '@/components/AuroraBackground';
import StatsCard from '@/components/StatsCard';
import AlertCard from '@/components/AlertCard';
import { MessageSquare, Users, Eye, Database, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StatsData {
  total_mentions: number;
  total_reach: number;
  unique_authors: number;
  total_sources: number;
}

interface Alert {
  id: string;
  name: string;
}

const Dashboard = () => {
  const { userEmail, companyId, setCompanyId, logout } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);

  useEffect(() => {
    if (userEmail && !companyId) {
      fetchCompanyId();
    }
  }, [userEmail, companyId]);

  useEffect(() => {
    if (companyId) {
      fetchStats();
      fetchAlerts();
    }
  }, [companyId]);

  const fetchCompanyId = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/info/getIdEmpresa?email=${userEmail}`);
      if (!response.ok) throw new Error('Error al obtener ID de empresa');
      
      const data = await response.json();
      setCompanyId(data.company_id);
    } catch (error) {
      toast.error('Error al cargar información de empresa');
      console.error(error);
    }
  };

  const fetchStats = async (alertId?: string) => {
    if (!companyId) return;
    
    setIsLoadingStats(true);
    try {
      const url = alertId 
        ? `http://localhost:8000/api/stats/general/overview?company_id=${companyId}&alert_id=${alertId}`
        : `http://localhost:8000/api/stats/general/overview?company_id=${companyId}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al obtener estadísticas');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      toast.error('Error al cargar estadísticas');
      console.error(error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchAlerts = async () => {
    if (!companyId) return;
    
    setIsLoadingAlerts(true);
    try {
      const response = await fetch(`http://localhost:8000/api/info/getAlerts?company_id=${companyId}`);
      if (!response.ok) throw new Error('Error al obtener alertas');
      
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      toast.error('Error al cargar alertas');
      console.error(error);
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  const handleAlertClick = (alertId: string) => {
    if (selectedAlertId === alertId) {
      setSelectedAlertId(null);
      fetchStats();
    } else {
      setSelectedAlertId(alertId);
      fetchStats(alertId);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <AuroraBackground />
      
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Panel de Control</h1>
            <p className="text-muted-foreground">Bienvenido, {userEmail}</p>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="glass-effect border-white/10 hover:bg-white/10 text-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>

        {/* Stats Cards */}
        {isLoadingStats ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            <StatsCard
              title="Menciones totales"
              value={stats.total_mentions.toLocaleString()}
              icon={MessageSquare}
            />
            <StatsCard
              title="Alcance total"
              value={stats.total_reach.toLocaleString()}
              icon={Eye}
            />
            <StatsCard
              title="Autores únicos"
              value={stats.unique_authors.toLocaleString()}
              icon={Users}
            />
            <StatsCard
              title="Fuentes analizadas"
              value={stats.total_sources.toLocaleString()}
              icon={Database}
            />
          </div>
        ) : null}

        {/* Alerts Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Alertas</h2>
          {isLoadingAlerts ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
              {alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  id={alert.id}
                  name={alert.name}
                  onClick={handleAlertClick}
                  isActive={selectedAlertId === alert.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

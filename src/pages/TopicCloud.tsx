import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Sidebar from '@/components/Sidebar';
import {
    Loader2,
    BookOpen,
    ArrowLeft,
    Cloud,
    Sparkles,
    Hash,
    Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import SoftMathBackground from '@/components/SoftMathBackground';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';

interface Alert {
    id: string;
    name: string;
}

interface Topic {
    text: string;
    count: number;
}

interface TopicWithStyle extends Topic {
    fontSize: number;
    color: string;
    gradient: { from: string; to: string };
    x: number;
    y: number;
    rotation: number;
}

const TopicCloud = () => {
    const { userEmail, companyId, setCompanyId } = useAuth();
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
    const [topics, setTopics] = useState<TopicWithStyle[]>([]);
    const [totalTopics, setTotalTopics] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const [limit, setLimit] = useState(50);
    const [minCount, setMinCount] = useState(2);

    const limitOptions = [25, 50, 75, 100, 150, 200];
    const minCountOptions = [1, 2, 3, 5, 10];

    const colorGradients = [
        { from: '#a855f7', to: '#ec4899' }, // purple to pink
        { from: '#06b6d4', to: '#3b82f6' }, // cyan to blue
        { from: '#10b981', to: '#84cc16' }, // green to lime
        { from: '#f59e0b', to: '#ef4444' }, // amber to red
        { from: '#8b5cf6', to: '#6366f1' }, // violet to indigo
        { from: '#14b8a6', to: '#06b6d4' }, // teal to cyan
        { from: '#f97316', to: '#fb923c' }, // orange to orange-light
        { from: '#ec4899', to: '#c084fc' }, // pink to purple-light
        { from: '#22d3ee', to: '#38bdf8' }, // cyan-light to sky
        { from: '#fbbf24', to: '#f59e0b' }, // yellow to amber
    ];

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
        if (companyId && alerts.length > 0) {
            fetchTopics();
        }
    }, [companyId, selectedAlertId, limit, minCount, alerts]);

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

    const fetchTopics = async () => {
        if (!companyId) return;

        setIsLoading(true);
        try {
            let allTopics: Topic[] = [];

            if (selectedAlertId) {
                // Fetch for single alert
                const endpoint = `/api/stats/topics/cloud?company_id=${companyId}&alert_id=${selectedAlertId}&limit=${limit}&min_count=${minCount}`;
                const response = await apiFetch(endpoint);
                if (!response.ok) throw new Error('Error al obtener nube de temas');

                const result = await response.json();
                allTopics = result.data.topics || [];
            } else {
                // Fetch for all alerts and combine
                const promises = alerts.map(alert =>
                    apiFetch(`/api/stats/topics/cloud?company_id=${companyId}&alert_id=${alert.id}&limit=${limit}&min_count=${minCount}`)
                        .then(res => res.json())
                        .then(data => data.data.topics || [])
                        .catch(() => [])
                );

                const results = await Promise.all(promises);
                const topicsMap = new Map<string, number>();

                // Combine topics from all alerts
                results.flat().forEach((topic: Topic) => {
                    const current = topicsMap.get(topic.text) || 0;
                    topicsMap.set(topic.text, current + topic.count);
                });

                allTopics = Array.from(topicsMap.entries())
                    .map(([text, count]) => ({ text, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, limit);
            }

            const styledTopics = styleTopics(allTopics);
            setTopics(styledTopics);
            setTotalTopics(allTopics.length);
        } catch (error) {
            toast.error('Error al cargar nube de temas');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const styleTopics = (rawTopics: Topic[]): TopicWithStyle[] => {
        if (rawTopics.length === 0) return [];

        const maxCount = Math.max(...rawTopics.map(t => t.count));
        const minCountVal = Math.min(...rawTopics.map(t => t.count));
        const countRange = maxCount - minCountVal || 1;

        return rawTopics.map((topic, index) => {
            const normalizedCount = (topic.count - minCountVal) / countRange;
            const fontSize = 14 + normalizedCount * 52; // 14px to 66px
            const gradient = colorGradients[index % colorGradients.length];
            const color = gradient.from; // For fallback

            // Improved spiral distribution with Fibonacci-like pattern
            const angle = index * 137.508 * (Math.PI / 180); // Golden angle in radians
            const radius = Math.sqrt(index + 1) * 10;

            // Add some randomness for more organic feel
            const randomOffset = (Math.random() - 0.5) * 5;
            const x = 50 + (radius + randomOffset) * Math.cos(angle);
            const y = 50 + (radius + randomOffset) * Math.sin(angle);

            const rotation = (Math.random() - 0.5) * 20; // -10 to 10 degrees

            return {
                ...topic,
                fontSize,
                color,
                gradient,
                x: Math.max(8, Math.min(92, x)),
                y: Math.max(8, Math.min(92, y)),
                rotation
            };
        });
    };

    const handleTopicClick = (topicText: string) => {
        navigate(`/lista-menciones?text=${encodeURIComponent(topicText)}`);
    };

    return (
        <div className="min-h-screen max-h-screen overflow-hidden flex flex-col lg:flex-row">
            <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
            <SoftMathBackground />
            <Sidebar />

            <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-slate-900/50 hover:scrollbar-thumb-slate-600/70">
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
                    <Header />

                    {/* Title with Back Button */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">

                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">
                                Nube de Temas
                            </h1>
                            <p className="text-sm sm:text-base text-white/70">
                                Visualización de los temas más relevantes
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center flex-wrap">
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
                                    <BookOpen className="ml-2 h-4 w-4 shrink-0" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[240px] p-2 glass-card border-white/10" align="start">
                                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                                    <Button
                                        variant="ghost"
                                        className={`w-full justify-start text-white hover:bg-white/10 text-sm ${!selectedAlertId ? 'bg-white/10' : ''}`}
                                        onClick={() => setSelectedAlertId(null)}
                                    >
                                        Todos los temas
                                    </Button>
                                    {alerts.map((alert) => (
                                        <Button
                                            key={alert.id}
                                            variant="ghost"
                                            className={`w-full justify-start text-white hover:bg-white/10 text-sm ${selectedAlertId === alert.id ? 'bg-white/10' : ''}`}
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
                                    size="sm"
                                    className="glass-effect border-white/10 hover:bg-white/10 text-white flex-1 sm:flex-none text-xs sm:text-sm"
                                >
                                    <Hash className="mr-2 h-4 w-4" />
                                    Límite: {limit}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[160px] p-2 glass-card border-white/10">
                                <div className="space-y-1">
                                    {limitOptions.map((option) => (
                                        <Button
                                            key={option}
                                            variant="ghost"
                                            size="sm"
                                            className={`w-full justify-start text-white hover:bg-white/10 text-xs sm:text-sm ${limit === option ? 'bg-white/10' : ''}`}
                                            onClick={() => setLimit(option)}
                                        >
                                            {option} temas
                                        </Button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="glass-effect border-white/10 hover:bg-white/10 text-white flex-1 sm:flex-none text-xs sm:text-sm"
                                >
                                    <Filter className="mr-2 h-4 w-4" />
                                    Mínimo: {minCount}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[160px] p-2 glass-card border-white/10">
                                <div className="space-y-1">
                                    {minCountOptions.map((option) => (
                                        <Button
                                            key={option}
                                            variant="ghost"
                                            size="sm"
                                            className={`w-full justify-start text-white hover:bg-white/10 text-xs sm:text-sm ${minCount === option ? 'bg-white/10' : ''}`}
                                            onClick={() => setMinCount(option)}
                                        >
                                            Mínimo {option}
                                        </Button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Topic Cloud Visualization */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 blur-3xl rounded-3xl"></div>

                        <div className="relative p-6 sm:p-8 lg:p-12 glass-effect rounded-2xl lg:rounded-3xl border-2 border-white/20 shadow-2xl overflow-hidden">
                            {/* Animated border glow */}
                            <div className="absolute inset-0 rounded-2xl lg:rounded-3xl opacity-50">
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
                                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
                                <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-pink-500 to-transparent"></div>
                                <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent"></div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 relative z-10">
                                <div className="p-3 sm:p-4 glass-effect rounded-xl shrink-0 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <Cloud className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                                        Nube de Palabras
                                    </h2>
                                    <p className="text-sm sm:text-base lg:text-lg text-white/70">
                                        Visualización interactiva de temas frecuentes
                                    </p>
                                </div>
                                <div className="text-left sm:text-right w-full sm:w-auto">
                                    <p className="text-white/70 text-xs sm:text-sm">Total de temas</p>
                                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-cyan-400">
                                        {totalTopics}
                                    </p>
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="flex justify-center items-center h-[400px] sm:h-[500px] lg:h-[600px] relative z-10">
                                    <div className="text-center space-y-4">
                                        <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-purple-400 mx-auto" />
                                        <p className="text-white/70 text-sm sm:text-base">Generando nube de temas...</p>
                                    </div>
                                </div>
                            ) : topics.length > 0 ? (
                                <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden rounded-xl glass-card border border-white/10">
                                    {/* Enhanced Decorative Background */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50">
                                        {/* Animated gradient orbs */}
                                        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse"></div>
                                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                                        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

                                        {/* Grid pattern overlay */}
                                        <div className="absolute inset-0 opacity-[0.02]"
                                            style={{
                                                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                                                backgroundSize: '40px 40px'
                                            }}
                                        ></div>
                                    </div>

                                    {/* Topic Cloud */}
                                    <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 lg:p-8">
                                        <div className="relative w-full h-full">
                                            {topics.map((topic, index) => (
                                                <div
                                                    key={index}
                                                    className="absolute transition-all duration-700 hover:scale-125 cursor-pointer group animate-fadeIn"
                                                    style={{
                                                        left: `${topic.x}%`,
                                                        top: `${topic.y}%`,
                                                        transform: `translate(-50%, -50%) rotate(${topic.rotation}deg)`,
                                                        fontSize: `${Math.max(10, topic.fontSize * 0.7)}px`,
                                                        animationDelay: `${index * 50}ms`,
                                                        animationFillMode: 'backwards'
                                                    }}
                                                    onClick={() => handleTopicClick(topic.text)}
                                                >
                                                    <div className="relative">
                                                        {/* Glow effect on hover */}
                                                        <div
                                                            className="absolute -inset-4 blur-2xl opacity-0 group-hover:opacity-80 transition-all duration-500 rounded-xl"
                                                            style={{
                                                                background: `radial-gradient(circle, ${topic.gradient.from}60 0%, ${topic.gradient.to}40 50%, transparent 70%)`
                                                            }}
                                                        ></div>

                                                        {/* Animated ring on hover */}
                                                        <div
                                                            className="absolute -inset-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-500 animate-ping"
                                                            style={{
                                                                background: `linear-gradient(135deg, ${topic.gradient.from}30, ${topic.gradient.to}30)`,
                                                                animationIterationCount: '1'
                                                            }}
                                                        ></div>

                                                        {/* The word with gradient */}
                                                        <span
                                                            className="relative font-extrabold drop-shadow-2xl whitespace-nowrap transition-all duration-500 group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.5)] select-none"
                                                            style={{
                                                                background: `linear-gradient(135deg, ${topic.gradient.from}, ${topic.gradient.to})`,
                                                                WebkitBackgroundClip: 'text',
                                                                WebkitTextFillColor: 'transparent',
                                                                backgroundClip: 'text',
                                                                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
                                                                textShadow: 'none'
                                                            }}
                                                        >
                                                            {topic.text}
                                                        </span>

                                                        {/* Enhanced tooltip */}
                                                        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 scale-90 group-hover:scale-100">
                                                            <div className="relative">
                                                                {/* Tooltip glow */}
                                                                <div
                                                                    className="absolute inset-0 blur-lg rounded-xl"
                                                                    style={{
                                                                        background: `linear-gradient(135deg, ${topic.gradient.from}40, ${topic.gradient.to}40)`
                                                                    }}
                                                                ></div>

                                                                {/* Tooltip content */}
                                                                <div className="relative glass-card px-4 py-2 border border-white/30 rounded-xl whitespace-nowrap backdrop-blur-xl">
                                                                    <div className="flex items-center gap-2">
                                                                        <div
                                                                            className="w-2 h-2 rounded-full animate-pulse"
                                                                            style={{
                                                                                background: `linear-gradient(135deg, ${topic.gradient.from}, ${topic.gradient.to})`
                                                                            }}
                                                                        ></div>
                                                                        <span
                                                                            className="text-xs sm:text-sm font-bold"
                                                                            style={{
                                                                                background: `linear-gradient(135deg, ${topic.gradient.from}, ${topic.gradient.to})`,
                                                                                WebkitBackgroundClip: 'text',
                                                                                WebkitTextFillColor: 'transparent'
                                                                            }}
                                                                        >
                                                                            {topic.count.toLocaleString()} menciones
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col justify-center items-center h-[400px] sm:h-[500px] lg:h-[600px] text-white/70 space-y-4 relative z-10">
                                    <Cloud className="h-16 w-16 sm:h-20 sm:w-20 text-white/30" />
                                    <p className="text-sm sm:text-base text-center">
                                        No hay temas disponibles con los filtros actuales
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Topics Table */}
                    {!isLoading && topics.length > 0 && (
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 blur-3xl rounded-3xl"></div>

                            <div className="relative p-6 sm:p-8 glass-effect rounded-2xl lg:rounded-3xl border-2 border-white/20">
                                <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                                    <div className="p-3 sm:p-4 glass-effect rounded-xl shrink-0 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                                            Top 10 Temas
                                        </h2>
                                        <p className="text-sm sm:text-base lg:text-lg text-white/70">
                                            Los temas más mencionados
                                        </p>
                                    </div>
                                </div>

                                <div className="glass-effect rounded-xl lg:rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-sm">
                                                <tr>
                                                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-white/90 uppercase tracking-wider">
                                                        #
                                                    </th>
                                                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-white/90 uppercase tracking-wider">
                                                        Tema
                                                    </th>
                                                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-cyan-400 uppercase tracking-wider">
                                                        Menciones
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {topics.slice(0, 10).map((topic, index) => (
                                                    <tr 
                                                        key={index} 
                                                        className="hover:bg-white/5 transition-all duration-300 group cursor-pointer"
                                                        onClick={() => handleTopicClick(topic.text)}
                                                    >
                                                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                            <div
                                                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg relative overflow-hidden group-hover:scale-110 transition-transform duration-300"
                                                                style={{
                                                                    background: `linear-gradient(135deg, ${topic.gradient.from}40, ${topic.gradient.to}40)`,
                                                                    boxShadow: `0 0 20px ${topic.gradient.from}30`
                                                                }}
                                                            >
                                                                <span
                                                                    className="relative z-10 font-extrabold"
                                                                    style={{
                                                                        background: `linear-gradient(135deg, ${topic.gradient.from}, ${topic.gradient.to})`,
                                                                        WebkitBackgroundClip: 'text',
                                                                        WebkitTextFillColor: 'transparent'
                                                                    }}
                                                                >
                                                                    {index + 1}
                                                                </span>
                                                                <div
                                                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                                    style={{
                                                                        background: `linear-gradient(135deg, ${topic.gradient.from}20, ${topic.gradient.to}20)`
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="w-1 h-6 rounded-full"
                                                                    style={{
                                                                        background: `linear-gradient(180deg, ${topic.gradient.from}, ${topic.gradient.to})`
                                                                    }}
                                                                ></div>
                                                                <span
                                                                    className="font-extrabold text-sm sm:text-base group-hover:scale-105 transition-transform duration-300 inline-block"
                                                                    style={{
                                                                        background: `linear-gradient(135deg, ${topic.gradient.from}, ${topic.gradient.to})`,
                                                                        WebkitBackgroundClip: 'text',
                                                                        WebkitTextFillColor: 'transparent'
                                                                    }}
                                                                >
                                                                    {topic.text}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg glass-effect border border-cyan-500/20">
                                                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                                                                <div className="text-cyan-400 font-bold text-base sm:text-lg">
                                                                    {topic.count.toLocaleString()}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TopicCloud;
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Sidebar from '@/components/Sidebar';
import {
    Loader2,
    CalendarDays,
    Search,
    Filter,
    BookOpen,
    ExternalLink,
    Star,
    CheckCircle,
    TrendingUp,
    Globe,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    Smile,
    Frown,
    Meh,
    X
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SoftMathBackground from '@/components/SoftMathBackground';
import Header from '@/components/Header';

interface Alert {
    id: string;
    name: string;
}

interface Mention {
    id: number;
    date: string;
    title: string;
    snippet: string;
    url: string;
    source: string;
    sentiment: string;
    reach: number;
    language: string;
    starred: boolean;
    done: boolean;
}

interface PaginationInfo {
    current_page: number;
    per_page: number;
    total_pages: number;
    total_mentions: number;
    has_next_page: boolean;
    has_previous_page: boolean;
}

const ListaMenciones = () => {
    const { userEmail, companyId, setCompanyId } = useAuth();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
    const [mentions, setMentions] = useState<Mention[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [selectedSentiment, setSelectedSentiment] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<string>('mas_nuevo');
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: new Date(1969, 0, 1),
        to: new Date()
    });
    const [currentPage, setCurrentPage] = useState(1);

    const sourceOptions = [
        { value: 'facebook', label: 'Facebook', icon: MessageSquare },
        { value: 'instagram', label: 'Instagram', icon: MessageSquare },
        { value: 'twitter', label: 'Twitter', icon: MessageSquare },
        { value: 'youtube', label: 'YouTube', icon: MessageSquare },
        { value: 'reddit', label: 'Reddit', icon: MessageSquare },
        { value: 'news-blogs', label: 'Noticias y Blogs', icon: MessageSquare },
        { value: 'web', label: 'Web', icon: Globe },
    ];

    const sentimentOptions = [
        { value: 'positive', label: 'Positivo', icon: Smile, color: 'text-green-400' },
        { value: 'negative', label: 'Negativo', icon: Frown, color: 'text-red-400' },
        { value: 'neutral', label: 'Neutral', icon: Meh, color: 'text-gray-400' }
    ];

    const orderOptions = [
        { value: 'alcance', label: 'Mayor Alcance', shortLabel: 'Alcance' },
        { value: 'mas_nuevo', label: 'Más Nuevo', shortLabel: 'Nuevo' },
        { value: 'mas_viejo', label: 'Más Viejo', shortLabel: 'Viejo' }
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
        if (companyId) {
            fetchMentions();
        }
    }, [companyId, selectedAlertId, selectedSource, selectedSentiment, selectedOrder, dateRange, searchTerm, currentPage]);

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

    const fetchMentions = async () => {
        if (!companyId) return;

        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                company_id: companyId,
                page: currentPage.toString(),
                order: selectedOrder
            });

            if (selectedAlertId) params.append('alert_id', selectedAlertId);
            if (selectedSource) params.append('source', selectedSource);
            if (selectedSentiment) params.append('sentiment', selectedSentiment);
            if (searchTerm) params.append('search', searchTerm);
            if (dateRange.from) params.append('date_from', format(dateRange.from, 'yyyy-MM-dd'));
            if (dateRange.to) params.append('date_to', format(dateRange.to, 'yyyy-MM-dd'));

            const response = await apiFetch(`/api/info/getMentionList?${params.toString()}`);
            if (!response.ok) throw new Error('Error al obtener menciones');

            const result = await response.json();
            setMentions(result.data.mentions || []);
            setPagination(result.data.pagination);
        } catch (error) {
            toast.error('Error al cargar menciones');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        setSearchTerm(searchInput);
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setSelectedAlertId(null);
        setSelectedSource(null);
        setSelectedSentiment(null);
        setSearchInput('');
        setSearchTerm('');
        setSelectedOrder('mas_nuevo');
        setDateRange({
            from: new Date(1969, 0, 1),
            to: new Date()
        });
        setCurrentPage(1);
    };

    const getSentimentInfo = (sentiment: string) => {
        const option = sentimentOptions.find(o => o.value === sentiment);
        return option || { value: '', label: 'Sin sentimiento', icon: Meh, color: 'text-gray-400' };
    };

    const formatReach = (reach: number) => {
        if (reach >= 1000000) return `${(reach / 1000000).toFixed(1)}M`;
        if (reach >= 1000) return `${(reach / 1000).toFixed(1)}K`;
        return reach.toString();
    };

    const hasActiveFilters = selectedAlertId || selectedSource || selectedSentiment || searchTerm || 
        (dateRange.from && dateRange.from.getTime() !== new Date(1969, 0, 1).getTime()) ||
        (dateRange.to && dateRange.to.getTime() !== new Date().setHours(0,0,0,0));

    return (
        <div className="min-h-screen max-h-screen overflow-hidden flex flex-col lg:flex-row">
            <SoftMathBackground />
            <Sidebar />

            <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-slate-900/50 hover:scrollbar-thumb-slate-600/70">
                <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
                    <Header />

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1">
                            Lista de Menciones
                        </h1>
                        <p className="text-xs sm:text-sm md:text-base text-white/70">
                            Explora y filtra todas las menciones
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 blur-2xl rounded-2xl"></div>
                        <div className="relative glass-effect rounded-lg sm:rounded-xl border border-white/10 p-2 sm:p-3 md:p-4">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-white/50" />
                                    <Input
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Buscar..."
                                        className="pl-8 sm:pl-10 glass-card border-white/10 text-white placeholder:text-white/50 h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
                                    />
                                </div>
                                <Button
                                    onClick={handleSearch}
                                    size="sm"
                                    className="glass-effect border border-white/10 hover:bg-white/10 text-white h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4"
                                >
                                    <Search className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1 md:mr-2" />
                                    <span className="hidden sm:inline text-xs md:text-sm">Buscar</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="space-y-2 sm:space-y-3">
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3 items-center">
                            {/* Alert Filter */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="glass-effect border-white/10 hover:bg-white/10 text-white text-xs h-7 sm:h-8 px-2 sm:px-3"
                                    >
                                        <BookOpen className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                        <span className="hidden sm:inline truncate max-w-[100px] md:max-w-[150px]">
                                            {selectedAlertId
                                                ? alerts.find(a => a.id === selectedAlertId)?.name || 'Alerta'
                                                : 'Todas'}
                                        </span>
                                        <span className="sm:hidden">Alerta</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[280px] p-2 glass-card border-white/10" align="start">
                                    <div className="space-y-1 max-h-[300px] overflow-y-auto">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`w-full justify-start text-white hover:bg-white/10 text-xs ${!selectedAlertId ? 'bg-white/10' : ''}`}
                                            onClick={() => { setSelectedAlertId(null); setCurrentPage(1); }}
                                        >
                                            Todos los tópicos
                                        </Button>
                                        {alerts.map((alert) => (
                                            <Button
                                                key={alert.id}
                                                variant="ghost"
                                                size="sm"
                                                className={`w-full justify-start text-white hover:bg-white/10 text-xs ${selectedAlertId === alert.id ? 'bg-white/10' : ''}`}
                                                onClick={() => { setSelectedAlertId(alert.id); setCurrentPage(1); }}
                                            >
                                                <span className="truncate">{alert.name}</span>
                                            </Button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Source Filter */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="glass-effect border-white/10 hover:bg-white/10 text-white text-xs h-7 sm:h-8 px-2 sm:px-3"
                                    >
                                        <Globe className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                        <span className="hidden sm:inline">
                                            {selectedSource
                                                ? sourceOptions.find(s => s.value === selectedSource)?.label || 'Fuente'
                                                : 'Fuentes'}
                                        </span>
                                        <span className="sm:hidden">Fuente</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[160px] sm:w-[200px] p-2 glass-card border-white/10" align="start">
                                    <div className="space-y-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`w-full justify-start text-white hover:bg-white/10 text-xs ${!selectedSource ? 'bg-white/10' : ''}`}
                                            onClick={() => { setSelectedSource(null); setCurrentPage(1); }}
                                        >
                                            Todas
                                        </Button>
                                        {sourceOptions.map((source) => (
                                            <Button
                                                key={source.value}
                                                variant="ghost"
                                                size="sm"
                                                className={`w-full justify-start text-white hover:bg-white/10 text-xs ${selectedSource === source.value ? 'bg-white/10' : ''}`}
                                                onClick={() => { setSelectedSource(source.value); setCurrentPage(1); }}
                                            >
                                                <source.icon className="mr-2 h-3 w-3" />
                                                {source.label}
                                            </Button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Sentiment Filter */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="glass-effect border-white/10 hover:bg-white/10 text-white text-xs h-7 sm:h-8 px-2 sm:px-3"
                                    >
                                        {selectedSentiment ? (
                                            <>
                                                {(() => {
                                                    const Icon = getSentimentInfo(selectedSentiment).icon;
                                                    return <Icon className={`mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 ${getSentimentInfo(selectedSentiment).color}`} />;
                                                })()}
                                                <span className="hidden sm:inline">{getSentimentInfo(selectedSentiment).label}</span>
                                                <span className="sm:hidden">Sent.</span>
                                            </>
                                        ) : (
                                            <>
                                                <Filter className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                                <span className="hidden sm:inline">Sentimiento</span>
                                                <span className="sm:hidden">Sent.</span>
                                            </>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[150px] sm:w-[200px] p-2 glass-card border-white/10" align="start">
                                    <div className="space-y-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`w-full justify-start text-white hover:bg-white/10 text-xs ${!selectedSentiment ? 'bg-white/10' : ''}`}
                                            onClick={() => { setSelectedSentiment(null); setCurrentPage(1); }}
                                        >
                                            Todos
                                        </Button>
                                        {sentimentOptions.map((sentiment) => (
                                            <Button
                                                key={sentiment.value}
                                                variant="ghost"
                                                size="sm"
                                                className={`w-full justify-start text-white hover:bg-white/10 text-xs ${selectedSentiment === sentiment.value ? 'bg-white/10' : ''}`}
                                                onClick={() => { setSelectedSentiment(sentiment.value); setCurrentPage(1); }}
                                            >
                                                <sentiment.icon className={`mr-2 h-3 w-3 ${sentiment.color}`} />
                                                {sentiment.label}
                                            </Button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Order Filter */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="glass-effect border-white/10 hover:bg-white/10 text-white text-xs h-7 sm:h-8 px-2 sm:px-3"
                                    >
                                        <TrendingUp className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                        <span className="hidden sm:inline">
                                            {orderOptions.find(o => o.value === selectedOrder)?.label}
                                        </span>
                                        <span className="sm:hidden">
                                            {orderOptions.find(o => o.value === selectedOrder)?.shortLabel}
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[140px] sm:w-[180px] p-2 glass-card border-white/10" align="start">
                                    <div className="space-y-1">
                                        {orderOptions.map((order) => (
                                            <Button
                                                key={order.value}
                                                variant="ghost"
                                                size="sm"
                                                className={`w-full justify-start text-white hover:bg-white/10 text-xs ${selectedOrder === order.value ? 'bg-white/10' : ''}`}
                                                onClick={() => { setSelectedOrder(order.value); setCurrentPage(1); }}
                                            >
                                                {order.label}
                                            </Button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Date Range */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="glass-effect border-white/10 hover:bg-white/10 text-white text-xs h-7 sm:h-8 px-2 sm:px-3"
                                    >
                                        <CalendarDays className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                        <span className="hidden lg:inline truncate max-w-[180px]">
                                            {dateRange.from && dateRange.to ? (
                                                `${format(dateRange.from, 'dd MMM yyyy', { locale: es })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: es })}`
                                            ) : 'Fechas'}
                                        </span>
                                        <span className="lg:hidden">
                                            {dateRange.from && dateRange.to ? (
                                                `${format(dateRange.from, 'dd/MM/yy')} - ${format(dateRange.to, 'dd/MM/yy')}`
                                            ) : 'Fechas'}
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 glass-card border-white/10" align="start">
                                    <Calendar
                                        mode="range"
                                        selected={{ from: dateRange.from, to: dateRange.to }}
                                        onSelect={(range) => { setDateRange({ from: range?.from, to: range?.to }); setCurrentPage(1); }}
                                        numberOfMonths={1}
                                        locale={es}
                                        fromYear={1960}
                                        toYear={2030}
                                        className="sm:hidden"
                                    />
                                    <Calendar
                                        mode="range"
                                        selected={{ from: dateRange.from, to: dateRange.to }}
                                        onSelect={(range) => { setDateRange({ from: range?.from, to: range?.to }); setCurrentPage(1); }}
                                        numberOfMonths={2}
                                        locale={es}
                                        fromYear={1960}
                                        toYear={2030}
                                        className="hidden sm:block"
                                    />
                                </PopoverContent>
                            </Popover>

                            {/* Clear Filters - Only show if filters are active */}
                            {hasActiveFilters && (
                                <Button
                                    onClick={handleClearFilters}
                                    variant="outline"
                                    size="sm"
                                    className="glass-effect border-white/10 hover:bg-red-500/20 text-white text-xs h-7 sm:h-8 px-2 sm:px-3"
                                >
                                    <X className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Limpiar</span>
                                </Button>
                            )}
                        </div>

                        {/* Total Count - Responsive */}
                        {pagination && (
                            <div className="flex justify-between sm:justify-end">
                                <div className="glass-card px-2 sm:px-3 py-1 sm:py-1.5 border border-white/10">
                                    <p className="text-xs text-white/70">
                                        <span className="font-bold text-white">{pagination.total_mentions.toLocaleString()}</span>
                                        <span className="hidden sm:inline"> menciones</span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mentions List */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 blur-3xl rounded-3xl"></div>

                        <div className="relative space-y-2 sm:space-y-3 md:space-y-4">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-[300px] sm:h-[400px]">
                                    <div className="text-center space-y-3 sm:space-y-4">
                                        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 animate-spin text-purple-400 mx-auto" />
                                        <p className="text-white/70 text-xs sm:text-sm">Cargando menciones...</p>
                                    </div>
                                </div>
                            ) : mentions.length > 0 ? (
                                <>
                                    {mentions.map((mention) => {
                                        const sentimentInfo = getSentimentInfo(mention.sentiment);
                                        const SentimentIcon = sentimentInfo.icon;

                                        return (
                                            <div
                                                key={mention.id}
                                                className="glass-card p-3 sm:p-4 md:p-5 lg:p-6 border border-white/10 hover:bg-white/5 transition-all duration-300 rounded-lg sm:rounded-xl group"
                                            >
                                                <div className="flex flex-col gap-3 sm:gap-4">
                                                    {/* Header */}
                                                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <a
                                                                href={mention.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm sm:text-base md:text-lg font-bold text-white hover:text-cyan-400 transition-colors line-clamp-2 flex items-start gap-2 group/link"
                                                            >
                                                                <span className="flex-1">{mention.title}</span>
                                                                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                                            </a>
                                                            <p className="text-xs sm:text-sm text-white/70 mt-1.5 sm:mt-2 line-clamp-2 sm:line-clamp-3">
                                                                {mention.snippet}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Stats and Meta */}
                                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3">
                                                        {/* Date */}
                                                        <div className="glass-effect px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded border sm:rounded-lg border-white/10">
                                                            <p className="text-[10px] sm:text-xs text-white/70">
                                                                {format(new Date(mention.date), 'dd MMM yy', { locale: es })}
                                                            </p>
                                                        </div>

                                                        {/* Source */}
                                                        <div className="glass-effect px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded border sm:rounded-lg border-white/10">
                                                            <p className="text-[10px] sm:text-xs text-white capitalize">
                                                                {mention.source}
                                                            </p>
                                                        </div>

                                                        {/* Sentiment */}
                                                        {mention.sentiment && (
                                                            <div className="glass-effect px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded border sm:rounded-lg border-white/10 flex items-center gap-1">
                                                                <SentimentIcon className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${sentimentInfo.color}`} />
                                                                <p className={`text-[10px] sm:text-xs ${sentimentInfo.color} hidden sm:inline`}>
                                                                    {sentimentInfo.label}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Reach */}
                                                        <div className="glass-effect px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded border sm:rounded-lg border-cyan-500/20 flex items-center gap-1">
                                                            <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-cyan-400" />
                                                            <p className="text-[10px] sm:text-xs text-cyan-400 font-bold">
                                                                {formatReach(mention.reach)}
                                                            </p>
                                                        </div>

                                                        {/* Language */}
                                                        <div className="glass-effect px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded border sm:rounded-lg border-white/10">
                                                            <p className="text-[10px] sm:text-xs text-white/70 uppercase">
                                                                {mention.language}
                                                            </p>
                                                        </div>

                                                        {/* Starred */}
                                                        {mention.starred && (
                                                            <div className="glass-effect px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded border sm:rounded-lg border-yellow-500/20">
                                                                <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-400 fill-yellow-400" />
                                                            </div>
                                                        )}

                                                        {/* Done */}
                                                        {mention.done && (
                                                            <div className="glass-effect px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded border sm:rounded-lg border-green-500/20">
                                                                <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Pagination */}
                                    {pagination && pagination.total_pages > 1 && (
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-3 sm:pt-4">
                                            <div className="text-xs sm:text-sm text-white/70 order-2 sm:order-1">
                                                Página <span className="font-bold text-white">{pagination.current_page}</span> de <span className="font-bold text-white">{pagination.total_pages}</span>
                                            </div>

                                            <div className="flex items-center gap-1.5 sm:gap-2 order-1 sm:order-2">
                                                <Button
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={!pagination.has_previous_page}
                                                    variant="outline"
                                                    size="sm"
                                                    className="glass-effect border-white/10 hover:bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed h-7 sm:h-8 px-2 sm:px-3 text-xs"
                                                >
                                                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    <span className="hidden md:inline ml-1">Anterior</span>
                                                </Button>

                                                {/* Page Numbers - Hide on mobile */}
                                                <div className="hidden sm:flex gap-1">
                                                    {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                                                        let pageNum;
                                                        if (pagination.total_pages <= 5) {
                                                            pageNum = i + 1;
                                                        } else if (pagination.current_page <= 3) {
                                                            pageNum = i + 1;
                                                        } else if (pagination.current_page >= pagination.total_pages - 2) {
                                                            pageNum = pagination.total_pages - 4 + i;
                                                        } else {
                                                            pageNum = pagination.current_page - 2 + i;
                                                        }

                                                        return (
                                                            <Button
                                                                key={pageNum}
                                                                onClick={() => setCurrentPage(pageNum)}
                                                                variant="outline"
                                                                size="sm"
                                                                className={`glass-effect border-white/10 hover:bg-white/10 text-white w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs ${
                                                                    pagination.current_page === pageNum ? 'bg-white/20 border-white/30' : ''
                                                                }`}
                                                            >
                                                                {pageNum}
                                                            </Button>
                                                        );
                                                    })}
                                                </div>

                                                <Button
                                                    onClick={() => setCurrentPage(p => Math.min(pagination.total_pages, p + 1))}
                                                    disabled={!pagination.has_next_page}
                                                    variant="outline"
                                                    size="sm"
                                                    className="glass-effect border-white/10 hover:bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed h-7 sm:h-8 px-2 sm:px-3 text-xs"
                                                >
                                                    <span className="hidden md:inline mr-1">Siguiente</span>
                                                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col justify-center items-center h-[300px] sm:h-[400px] text-white/70 space-y-3 sm:space-y-4 px-4">
                                    <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 text-white/30" />
                                    <p className="text-center text-xs sm:text-sm md:text-base">
                                        No se encontraron menciones con los filtros actuales
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListaMenciones;
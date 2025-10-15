import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Sidebar from '@/components/Sidebar';
import { LogOut, BookOpen, User, Database, Globe, Languages } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import SoftMathBackground from '@/components/SoftMathBackground';
import Header from '@/components/Header';

const Rankings = () => {
  const { userEmail, companyId, setCompanyId, logout } = useAuth();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const navigate = useNavigate();

  const rankingCards = [
    {
      id: 'alertas',
      title: 'Alertas',
      icon: BookOpen,
      description: 'Ranking de alertas más activas',
      gradient: 'from-purple-500/20 via-pink-500/20 to-purple-500/20',
      glow: 'shadow-purple-500/50'
    },
    {
      id: 'autores',
      title: 'Autores',
      icon: User,
      description: 'Principales autores',
      gradient: 'from-cyan-500/20 via-blue-500/20 to-cyan-500/20',
      glow: 'shadow-cyan-500/50'
    },
    {
      id: 'fuentes',
      title: 'Fuentes',
      icon: Database,
      description: 'Mayor alcance',
      gradient: 'from-emerald-500/20 via-teal-500/20 to-emerald-500/20',
      glow: 'shadow-emerald-500/50'
    },
    {
      id: 'paises',
      title: 'Países',
      icon: Globe,
      description: 'Distribución geográfica',
      gradient: 'from-orange-500/20 via-red-500/20 to-orange-500/20',
      glow: 'shadow-orange-500/50'
    },
    {
      id: 'lenguajes',
      title: 'Lenguajes',
      icon: Languages,
      description: 'Idiomas más usados',
      gradient: 'from-indigo-500/20 via-violet-500/20 to-indigo-500/20',
      glow: 'shadow-indigo-500/50'
    }
  ];

  useEffect(() => {
    if (userEmail && !companyId) {
      fetchCompanyId();
    } else if (userEmail && companyId && !companyLogo) {
      fetchCompanyId();
    }
  }, [userEmail, companyId, companyLogo]);

  const fetchCompanyId = async () => {
    try {
      const response = await apiFetch(`/api/info/getIdEmpresa?email=${userEmail}`);
      if (!response.ok) throw new Error('Error al obtener ID de empresa');
      
      const result = await response.json();
      const companyName = result.data.name;
      const logoFileName = `logo_${companyName.toLowerCase().replace(/\s+/g, '_')}.png`;
      const logoUrl = `/assets/${logoFileName}`;
      
      setCompanyId(result.data.company_id.toString());
      setCompanyLogo(logoUrl);
    } catch (error) {
      toast.error('Error al cargar información de empresa');
      console.error(error);
    }
  };

  const handleCardClick = (rankingId: string) => {
    navigate(`/rankings/${rankingId}`);
  };

  return (
    <div className="min-h-screen max-h-screen overflow-hidden flex">
      <SoftMathBackground />
      <Sidebar />
      
      <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-6 overflow-y-auto relative z-10">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <Header/>

          {/* Title */}
          <div className="px-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">
              Rankings
            </h1>
            <p className="text-sm sm:text-base text-white/70">
              Selecciona un tipo de ranking para visualizar
            </p>
          </div>

          {/* Mobile: Stack vertical */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {rankingCards.map((card) => (
              <Card
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className="min-h-[160px] glass-card cursor-pointer transition-all duration-500 hover:bg-white/5 border border-white/10 group relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                <div className={`absolute inset-0 blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 ${card.glow}`}></div>
                
                <div className="relative flex flex-col items-center justify-center text-center h-full space-y-3 p-4">
                  <div className="relative">
                    <div className="p-3 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl group-hover:scale-110 transition-all duration-500">
                      <card.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {card.title}
                    </h3>
                    <p className="text-xs text-white/70">
                      {card.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Tablet: 2 columns */}
          <div className="hidden sm:grid lg:hidden grid-cols-2 gap-4 auto-rows-fr">
            {rankingCards.map((card) => (
              <Card
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className="min-h-[200px] glass-card cursor-pointer transition-all duration-500 hover:bg-white/5 border border-white/10 group relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                <div className={`absolute inset-0 blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 ${card.glow}`}></div>
                
                <div className="relative flex flex-col items-center justify-center text-center h-full space-y-4 p-6">
                  <div className="relative">
                    <div className="p-4 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl group-hover:scale-110 transition-all duration-500">
                      <card.icon className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {card.title}
                    </h3>
                    <p className="text-sm text-white/70">
                      {card.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: Bento Grid original - EXACTO como antes */}
          <div className="hidden lg:grid grid-cols-4 grid-rows-2 gap-4 h-[calc(100vh-280px)]">
            {/* Alertas - Grande */}
            <Card
              onClick={() => handleCardClick('alertas')}
              className="col-span-2 row-span-2 glass-card p-8 cursor-pointer transition-all duration-500 hover:bg-white/5 border border-white/10 group relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${rankingCards[0].gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className={`absolute inset-0 blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 ${rankingCards[0].glow}`}></div>
              
              <div className="relative flex flex-col items-center justify-center text-center h-full space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl group-hover:border-purple-500/50 transition-all duration-500 group-hover:scale-110">
                    <BookOpen className="w-16 h-16 text-white drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors duration-300">Tópicos</h3>
                  <p className="text-base text-white/70">Ranking de tópicos más activos</p>
                </div>
              </div>
            </Card>

            {/* Autores */}
            <Card
              onClick={() => handleCardClick('autores')}
              className="col-span-1 row-span-1 glass-card p-6 cursor-pointer transition-all duration-500 hover:bg-white/5 border border-white/10 group relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${rankingCards[1].gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className={`absolute inset-0 blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 ${rankingCards[1].glow}`}></div>
              
              <div className="relative flex flex-col items-center justify-center text-center h-full space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl group-hover:border-cyan-500/50 transition-all duration-500 group-hover:scale-110">
                    <User className="w-10 h-10 text-white drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors duration-300">Autores</h3>
                  <p className="text-xs text-white/70">Principales autores</p>
                </div>
              </div>
            </Card>

            {/* Fuentes */}
            <Card
              onClick={() => handleCardClick('fuentes')}
              className="col-span-1 row-span-1 glass-card p-6 cursor-pointer transition-all duration-500 hover:bg-white/5 border border-white/10 group relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${rankingCards[2].gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className={`absolute inset-0 blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 ${rankingCards[2].glow}`}></div>
              
              <div className="relative flex flex-col items-center justify-center text-center h-full space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl group-hover:border-emerald-500/50 transition-all duration-500 group-hover:scale-110">
                    <Database className="w-10 h-10 text-white drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors duration-300">Fuentes</h3>
                  <p className="text-xs text-white/70">Mayor alcance</p>
                </div>
              </div>
            </Card>

            {/* Países */}
            <Card
              onClick={() => handleCardClick('paises')}
              className="col-span-1 row-span-1 glass-card p-6 cursor-pointer transition-all duration-500 hover:bg-white/5 border border-white/10 group relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${rankingCards[3].gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className={`absolute inset-0 blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 ${rankingCards[3].glow}`}></div>
              
              <div className="relative flex flex-col items-center justify-center text-center h-full space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl group-hover:border-orange-500/50 transition-all duration-500 group-hover:scale-110">
                    <Globe className="w-10 h-10 text-white drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-orange-300 transition-colors duration-300">Países</h3>
                  <p className="text-xs text-white/70">Distribución geográfica</p>
                </div>
              </div>
            </Card>

            {/* Lenguajes */}
            <Card
              onClick={() => handleCardClick('lenguajes')}
              className="col-span-1 row-span-1 glass-card p-6 cursor-pointer transition-all duration-500 hover:bg-white/5 border border-white/10 group relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${rankingCards[4].gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className={`absolute inset-0 blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 ${rankingCards[4].glow}`}></div>
              
              <div className="relative flex flex-col items-center justify-center text-center h-full space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative p-4 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-2xl group-hover:border-indigo-500/50 transition-all duration-500 group-hover:scale-110">
                    <Languages className="w-10 h-10 text-white drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors duration-300">Lenguajes</h3>
                  <p className="text-xs text-white/70">Idiomas más usados</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rankings;
import { useState } from 'react';
import { Home, TrendingUp, Trophy, Menu, X, MapIcon, Swords, CloudIcon, AlertCircle, Bell, Share2, Bot } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: Home,
      path: '/dashboard'
    },
    {
      id: 'estadisticas',
      name: 'Estadísticas',
      icon: TrendingUp,
      path: '/estadisticas'
    },
    {
      id: 'rankings',
      name: 'Rankings',
      icon: Trophy,
      path: '/rankings'
    },
     {
      id: 'mapa-calor',
      name: 'Mapa de calor',
      icon: MapIcon,
      path: '/mapa-calor'
    },
    {
      id: 'comparador',
      name: 'Comparar temas',
      icon: Swords,
      path: '/comparador'
    }, {
      id: 'topicCloud',
      name: 'Nube de palabras',
      icon: CloudIcon,
      path: '/topicCloud'
    },{
      id: 'lista-menciones',
      name: 'Lista de menciones',
      icon: AlertCircle,
      path: '/lista-menciones'
    },{
      id: 'alertas',
      name: 'Alertas',
      icon: Bell,
      path: '/alertas'
    },{
      id: 'conectarRedes',
      name: 'Conectar redes',
      icon: Share2,
      path: '/conectar-redes'
    },
  ];

  const argosAIItem = {
    id: 'ArgosAI',
    name: 'ArgosAI',
    icon: Bot,
    path: '/argos-ai'
  };

  const isArgosActive = location.pathname === argosAIItem.path;

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 p-3 glass-card rounded-xl hover:bg-white/10 transition-all duration-300 border border-white/10"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-foreground" />
        ) : (
          <Menu className="w-6 h-6 text-foreground" />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 glass-card border-r border-white/10 flex flex-col z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Menu Items */}
        <nav className="flex-1 p-4 pt-20 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary/15 border border-cyan-300/60 shadow-xl shadow-cyan-400/30 scale-105' 
                    : 'text-foreground/70 hover:bg-white/5 hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                <span className={`font-medium ${isActive ? 'text-foreground' : ''}`}>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* ArgosAI Button - Destacado en la parte inferior */}
        <div className="p-4">
          <button
            onClick={() => {
              navigate(argosAIItem.path);
              setIsOpen(false);
            }}
            className={`w-full relative overflow-hidden rounded-xl transition-all duration-300 group ${
              isArgosActive 
                ? 'bg-gradient-to-r from-purple-600 to-cyan-500 shadow-2xl shadow-purple-500/50 scale-105' 
                : 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 border border-purple-500/30'
            }`}
          >
            {/* Efecto de brillo animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            <div className="relative flex items-center gap-3 px-4 py-4">
              <Bot className={`w-6 h-6 ${isArgosActive ? 'text-white animate-pulse' : 'text-purple-400 group-hover:text-purple-300'}`} />
              <div className="flex flex-col items-start">
                <span className={`font-bold text-lg ${isArgosActive ? 'text-white' : 'text-foreground'}`}>
                  {argosAIItem.name}
                </span>
                <span className={`text-xs ${isArgosActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                  Asistente IA
                </span>
              </div>
              <div className="ml-auto">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-muted-foreground text-center">
            © 2025 ADGCO
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
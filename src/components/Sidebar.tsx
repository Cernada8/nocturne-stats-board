import { useState } from 'react';
import { Home, TrendingUp, Trophy, Menu, X } from 'lucide-react';
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
    }
  ];

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
        <nav className="flex-1 p-4 pt-20 space-y-2">
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

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-muted-foreground text-center">
            © 2024 ADGCO
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
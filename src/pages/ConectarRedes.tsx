import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Sidebar from '@/components/Sidebar';
import {
  Loader2,
  Link2,
  Twitter,
  Facebook,
  Instagram,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import SoftMathBackground from '@/components/SoftMathBackground';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';

type SocialNetwork = 'twitter' | 'facebook' | 'instagram';

interface SocialNetworkConfig {
  id: SocialNetwork;
  name: string;
  icon: typeof Twitter;
  color: string;
  gradient: string;
}

const ConectarRedes = () => {
  const { userEmail } = useAuth();
  const navigate = useNavigate();
  const [selectedNetwork, setSelectedNetwork] = useState<SocialNetwork | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const socialNetworks: SocialNetworkConfig[] = [
    {
      id: 'twitter',
      name: 'Twitter / X',
      icon: Twitter,
      color: '#1DA1F2',
      gradient: 'from-blue-500 to-cyan-400'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: '#1877F2',
      gradient: 'from-blue-600 to-blue-400'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: '#E4405F',
      gradient: 'from-pink-500 via-purple-500 to-orange-500'
    }
  ];

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Por favor, completa todos los campos');
      return;
    }

    if (!selectedNetwork) {
      toast.error('Selecciona una red social');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch('/api/social/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          type: selectedNetwork
        })
      });

      if (!response.ok) {
        throw new Error('Error al conectar la cuenta');
      }

      setEmail('');
      setPassword('');
      setSelectedNetwork(null);

      toast.success('¡Gracias! Tus canales estarán conectados en un plazo de 48h.', {
        duration: 5000,
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />
      });

    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al conectar la cuenta. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const getNetworkConfig = (network: SocialNetwork) => {
    return socialNetworks.find(n => n.id === network);
  };

  return (
    <div className="min-h-screen max-h-screen overflow-hidden flex">
      <SoftMathBackground />
      <Sidebar />

      <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-slate-900/50 hover:scrollbar-thumb-slate-600/70">
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          <Header />

          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="icon"
              className="glass-effect border-white/10 hover:bg-white/10 text-white h-8 w-8 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">
                Conectar Redes Sociales
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-white/70">
                Accede a un análisis más profundo y preciso de tus datos
              </p>
            </div>
          </div>

          <div className="glass-card p-6 sm:p-8 lg:p-10 text-center border border-cyan-400/20 shadow-xl shadow-cyan-400/10">
            <div className="max-w-3xl mx-auto">
              <div className="mb-6 inline-flex p-4 glass-effect rounded-2xl">
                <Link2 className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 text-cyan-400" />
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4">
                ¿Quieres sacarle todo el provecho a Argos?
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-white/80 leading-relaxed">
                ¡Conecta tus Redes Sociales para tener acceso a todos tus datos!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {socialNetworks.map((network) => {
              const Icon = network.icon;
              const isSelected = selectedNetwork === network.id;

              return (
                <button
                  key={network.id}
                  onClick={() => setSelectedNetwork(network.id)}
                  className={`glass-card p-6 sm:p-8 text-center transition-all duration-300 hover:scale-105 border ${
                    isSelected
                      ? 'border-cyan-400/50 shadow-xl shadow-cyan-400/20 ring-2 ring-cyan-400/30'
                      : 'border-white/10 hover:border-cyan-400/30'
                  }`}
                >
                  <div className={`mb-4 sm:mb-6 inline-flex p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${network.gradient} shadow-lg`}>
                    <Icon className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                    {network.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/60">
                    Click para conectar
                  </p>
                  {isSelected && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-cyan-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs sm:text-sm font-medium">Seleccionada</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedNetwork && (
            <div className="glass-card p-6 sm:p-8 border border-cyan-400/20 shadow-xl shadow-cyan-400/10">
              <div className="max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  {(() => {
                    const config = getNetworkConfig(selectedNetwork);
                    const Icon = config?.icon;
                    return (
                      <>
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${config?.gradient} shadow-lg`}>
                          {Icon && <Icon className="h-6 w-6 text-white" />}
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold text-white">
                            Conectar {config?.name}
                          </h3>

                          {/* 🔥 MODIFICACIÓN AQUÍ */}
                          <p className="text-xs sm:text-sm text-white/60">
                            Ingresa tus credenciales
                            {selectedNetwork === 'instagram' && (
                              <>
                                <br />
                                <span className="text-xs sm:text-sm text-pink-300 font-semibold">
                                  **Para conectar tu cuenta de Instagram, es necesario que la asocies a una cuenta de Facebook y conectes también esa cuenta de Facebook en Argos**
                                </span>
                              </>
                            )}
                          </p>
                          {/* 🔥 FIN MODIFICACIÓN */}
                        </div>
                      </>
                    );
                  })()}
                </div>

                <form onSubmit={handleConnect} className="space-y-4 sm:space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Usuario / Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                      <Input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="pl-10 glass-effect border-white/10 text-white placeholder:text-white/30 focus:border-cyan-400/50"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 glass-effect border-white/10 text-white placeholder:text-white/30 focus:border-cyan-400/50"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="glass-effect p-4 rounded-lg border border-cyan-400/20">
                    <p className="text-xs text-white/60 leading-relaxed">
                      <Lock className="inline h-3 w-3 mr-1" />
                      Tus credenciales están protegidas y serán utilizadas únicamente para conectar tu cuenta.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-6 text-base sm:text-lg shadow-lg shadow-cyan-500/30 transition-all duration-300"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <Link2 className="mr-2 h-5 w-5" />
                        Conectar Cuenta
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          )}

          <div className="glass-effect p-4 sm:p-6 rounded-xl border border-white/10">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-cyan-400" />
              ¿Qué sucede después?
            </h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>Tu cuenta será verificada en un plazo máximo de 48 horas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>Recibirás una notificación cuando esté lista</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>Podrás acceder a análisis más profundos y precisos de tus datos</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConectarRedes;

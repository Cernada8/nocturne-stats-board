import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import AuroraBackground from '@/components/AuroraBackground';
import { Loader2 } from 'lucide-react';
import MathBackground from '@/components/MathBackground';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <MathBackground />
      
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center">
          <img 
            src="/assets/logo_ADGCO.png" 
            alt="ADGCO Logo" 
            className="h-24 w-auto object-contain drop-shadow-2xl"
          />
        </div>

        <Card className="glass-card p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Iniciar sesión</h1>
            <p className="text-muted-foreground">Accede a tu panel de control</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="glass-effect border-white/10 focus:border-primary bg-transparent text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="glass-effect border-white/10 focus:border-primary bg-transparent text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl transition-all duration-300 hover:scale-[1.02]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
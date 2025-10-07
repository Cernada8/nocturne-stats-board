import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

interface AuthContextType {
  token: string | null;
  userEmail: string | null;
  companyId: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  setCompanyId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('jwt_token');
    const storedEmail = localStorage.getItem('user_email');
    const storedCompanyId = localStorage.getItem('company_id');
    
    if (storedToken && storedEmail) {
      setToken(storedToken);
      setUserEmail(storedEmail);
      setCompanyId(storedCompanyId);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true, // No enviar token en el login
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al iniciar sesión');
      }

      const data = await response.json();
      
      localStorage.setItem('jwt_token', data.token);
      localStorage.setItem('user_email', email);
      
      setToken(data.token);
      setUserEmail(email);
      
      toast.success('¡Bienvenido!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('company_id');
    setToken(null);
    setUserEmail(null);
    setCompanyId(null);
    toast.info('Sesión cerrada');
    navigate('/login');
  };

  const handleSetCompanyId = (id: string) => {
    setCompanyId(id);
    localStorage.setItem('company_id', id);
  };

  return (
    <AuthContext.Provider value={{ 
      token, 
      userEmail, 
      companyId, 
      login, 
      logout, 
      isLoading,
      setCompanyId: handleSetCompanyId
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { userEmail, companyId, setCompanyId, logout } = useAuth();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyUrl, setCompanyUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (userEmail && companyId && !companyLogo) {
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
      
      if (!companyId) {
        setCompanyId(result.data.company_id.toString());
      }
      setCompanyLogo(logoUrl);
      setCompanyUrl(result.data.url || null);
      
    } catch (error) {
      toast.error('Error al cargar información de empresa');
    }
  };

  const handleCompanyLogoClick = () => {
    if (companyUrl) {
      window.open(companyUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        <img 
          src="/assets/logo_ADGCO.png" 
          alt="ADGCO Logo" 
          className="h-8 sm:h-10 md:h-12 w-auto object-contain drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] cursor-pointer hover:drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] transition-all duration-300"
          onClick={() => navigate('/')}
        />
        {companyLogo && (
          <>
            <div className="border-l border-white/20 h-8 sm:h-10 md:h-12"></div>
            <img 
              src={companyLogo} 
              alt="Company Logo" 
              className={`h-8 sm:h-10 md:h-12 w-auto object-contain drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] ${
                companyUrl ? 'cursor-pointer hover:drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] transition-all duration-300' : ''
              }`}
              onClick={handleCompanyLogoClick}
            />
          </>
        )}
      </div>
      <Button
        onClick={logout}
        variant="outline"
        size="sm"
        className="glass-effect border-white/10 hover:bg-white/10 text-white px-2 sm:px-3 md:px-4"
      >
        <LogOut className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Cerrar sesión</span>
      </Button>
    </div>
  );
};

export default Header;
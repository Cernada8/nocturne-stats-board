import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

async function trimTransparentPNG(src: string): Promise<string> {
  // Carga la imagen
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = 'anonymous'; // por si acaso; si sirves /assets del mismo origen no hace falta
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });

  // Dibuja en canvas
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;

  ctx.drawImage(img, 0, 0);

  // Lee píxeles y calcula bounding box del contenido no-transparente
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let top = 0, left = 0, right = width - 1, bottom = height - 1;
  const isRowTransparent = (y: number) => {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3];
      if (a !== 0) return false;
    }
    return true;
  };
  const isColTransparent = (x: number) => {
    for (let y = 0; y < height; y++) {
      const a = data[(y * width + x) * 4 + 3];
      if (a !== 0) return false;
    }
    return true;
  };

  while (top < bottom && isRowTransparent(top)) top++;
  while (bottom > top && isRowTransparent(bottom)) bottom--;
  while (left < right && isColTransparent(left)) left++;
  while (right > left && isColTransparent(right)) right--;

  // Si está totalmente vacío o no hay recorte, devuelve original
  if (right <= left || bottom <= top) return src;

  const cropW = right - left + 1;
  const cropH = bottom - top + 1;

  // Crea un canvas recortado
  const out = document.createElement('canvas');
  out.width = cropW;
  out.height = cropH;
  const octx = out.getContext('2d');
  if (!octx) return src;

  octx.drawImage(canvas, left, top, cropW, cropH, 0, 0, cropW, cropH);

  // Devuelve data URL (puedes cambiar a blobURL si prefieres)
  return out.toDataURL('image/png');
}

const Header = () => {
  const { userEmail, companyId, setCompanyId, logout } = useAuth();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [processedLogo, setProcessedLogo] = useState<string | null>(null);
  const [companyUrl, setCompanyUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (userEmail && companyId && !companyLogo) {
      fetchCompanyId();
    }
  }, [userEmail, companyId, companyLogo]);

  useEffect(() => {
    // cuando tengamos logo, lo recortamos (si falla, usamos el original)
    (async () => {
      if (companyLogo) {
        try {
          const trimmed = await trimTransparentPNG(companyLogo);
          setProcessedLogo(trimmed || companyLogo);
        } catch {
          setProcessedLogo(companyLogo);
        }
      }
    })();
  }, [companyLogo]);

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

        {processedLogo && (
          <>
            <div className="border-l border-white/20 h-8 sm:h-10 md:h-12"></div>

            {/* Contenedor con altura fija para unificar; el logo recortado rellenará mejor */}
            <div
              className={`h-8 sm:h-10 md:h-12 flex items-center ${
                companyUrl ? 'cursor-pointer hover:opacity-90 transition-opacity duration-300' : ''
              }`}
              onClick={handleCompanyLogoClick}
              // evita que el logo sobresalga raro
              style={{ maxWidth: '240px' }} // opcional: limita anchura máxima si hay logos muy horizontales
            >
              <img
                src={processedLogo}
                alt="Company Logo"
                className="h-full w-auto object-contain"
              />
            </div>
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

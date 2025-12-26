import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, KeyRound } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

async function trimTransparentPNG(src: string): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;

  ctx.drawImage(img, 0, 0);

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

  if (right <= left || bottom <= top) return src;

  const cropW = right - left + 1;
  const cropH = bottom - top + 1;

  const out = document.createElement('canvas');
  out.width = cropW;
  out.height = cropH;
  const octx = out.getContext('2d');
  if (!octx) return src;

  octx.drawImage(canvas, left, top, cropW, cropH, 0, 0, cropW, cropH);

  return out.toDataURL('image/png');
}

const Header = () => {
  const { userEmail, companyId, setCompanyId, logout } = useAuth();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [processedLogo, setProcessedLogo] = useState<string | null>(null);
  const [companyUrl, setCompanyUrl] = useState<string | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const navigate = useNavigate();

  // Obtener la inicial del email
  const getUserInitial = () => {
    if (!userEmail) return '?';
    return userEmail.charAt(0).toUpperCase();
  };

  useEffect(() => {
    if (userEmail && companyId && !companyLogo) {
      fetchCompanyId();
    }
  }, [userEmail, companyId, companyLogo]);

  useEffect(() => {
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

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Debe contener al menos una letra mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Debe contener al menos una letra minúscula');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Debe contener al menos un número');
    }
    
    return errors;
  };

  const handlePasswordChange = async () => {
    // Validaciones
    const errors: string[] = [];
    
    if (!passwordData.currentPassword) {
      errors.push('Introduce tu contraseña actual');
    }
    
    if (!passwordData.newPassword) {
      errors.push('Introduce una nueva contraseña');
    } else {
      errors.push(...validatePassword(passwordData.newPassword));
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.push('Las contraseñas no coinciden');
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.push('La nueva contraseña debe ser diferente a la actual');
    }

    if (errors.length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsChangingPassword(true);
    
    try {
      // El email se obtiene automáticamente del token JWT en el backend
      // pero lo enviamos para validación adicional
      const response = await apiFetch('/api/user/change-password', {
        method: 'POST',
        body: JSON.stringify({
          email: userEmail, // Este debe coincidir con el email del token
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al cambiar la contraseña');
      }

      toast.success('Contraseña cambiada exitosamente');
      setIsChangePasswordOpen(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cambiar la contraseña');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDialogClose = () => {
    setIsChangePasswordOpen(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors([]);
  };

  return (
    <>
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

              <div
                className={`h-8 sm:h-10 md:h-12 flex items-center ${
                  companyUrl ? 'cursor-pointer hover:opacity-90 transition-opacity duration-300' : ''
                }`}
                onClick={handleCompanyLogoClick}
                style={{ maxWidth: '240px' }}
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

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900">
                {getUserInitial()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-effect border-white/10">
              <DropdownMenuLabel className="text-white">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Mi cuenta</p>
                  <p className="text-xs leading-none text-white/60">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={() => setIsChangePasswordOpen(true)}
                className="text-white hover:bg-white/10 cursor-pointer"
              >
                <KeyRound className="mr-2 h-4 w-4" />
                <span>Cambiar contraseña</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={logout}
                className="text-white hover:bg-white/10 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Diálogo de cambio de contraseña */}
      <Dialog open={isChangePasswordOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="glass-effect border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-white">Cambiar contraseña</DialogTitle>
            <DialogDescription className="text-white/60">
              Introduce tu contraseña actual y luego tu nueva contraseña.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password" className="text-white">
                Contraseña actual
              </Label>
              <Input
                id="current-password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                className="glass-effect border-white/10 text-white placeholder:text-white/40"
                disabled={isChangingPassword}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="new-password" className="text-white">
                Nueva contraseña
              </Label>
              <Input
                id="new-password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                className="glass-effect border-white/10 text-white placeholder:text-white/40"
                disabled={isChangingPassword}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="confirm-password" className="text-white">
                Confirmar nueva contraseña
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                className="glass-effect border-white/10 text-white placeholder:text-white/40"
                disabled={isChangingPassword}
              />
            </div>

            {passwordErrors.length > 0 && (
              <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3">
                <ul className="text-sm text-red-300 space-y-1">
                  {passwordErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDialogClose}
              className="glass-effect border-white/10 hover:bg-white/10 text-white"
              disabled={isChangingPassword}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePasswordChange}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
              disabled={isChangingPassword}
            >
              {isChangingPassword ? 'Cambiando...' : 'Cambiar contraseña'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;
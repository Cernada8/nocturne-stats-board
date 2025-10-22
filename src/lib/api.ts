import { toast } from 'sonner';

// const API_BASE_URL = 'https://argos.adgtravel.com';
const API_BASE_URL = 'http://localhost:8000';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export const apiFetch = async (endpoint: string, options: FetchOptions = {}) => {
  const { skipAuth, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Añadir Authorization header si hay token y no se especifica skipAuth
  if (!skipAuth) {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Manejar error 401 - sesión expirada o inválida
    if (response.status === 401) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('company_id');
      toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      window.location.href = '/login';
      throw new Error('No autorizado');
    }

    return response;
  } catch (error) {
    throw error;
  }
};

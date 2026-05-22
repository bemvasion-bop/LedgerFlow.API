import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: number;
  email: string;
  role: string;
  companyId?: number;
  companyName?: string;
  planName?: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, rememberMe?: boolean, userInfo?: Partial<User>) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// .NET ClaimTypes serialize to these URI keys inside JWT payloads
const ROLE_CLAIM     = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const NAME_ID_CLAIM  = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
const EMAIL_CLAIM    = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';

const parseToken = (token: string): User | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role  = payload[ROLE_CLAIM]    || payload['role']   || '';
    const id    = Number(payload[NAME_ID_CLAIM] || payload['nameid'] || 0);
    const email = payload[EMAIL_CLAIM]   || payload['email']  || '';
    if (!role) return null; // token without a role is unusable
    return { id, email, role };
  } catch {
    return null;
  }
};

// Helper to get token expiration from JWT
const getTokenExpiration = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
  } catch {
    return null;
  }
};

// Helper to check if token is expired
const isTokenExpired = (token: string): boolean => {
  const exp = getTokenExpiration(token);
  if (!exp) return true; // If we can't read expiration, consider it expired
  return Date.now() >= exp;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage OR sessionStorage on first mount
  useEffect(() => {
    const restoreSession = () => {
      // Check localStorage first (Remember Me)
      let token = localStorage.getItem('token');
      let storage: Storage = localStorage;
      
      // If not in localStorage, check sessionStorage (normal session)
      if (!token) {
        token = sessionStorage.getItem('token');
        storage = sessionStorage;
      }
      
      if (token) {
        // Check if token is expired using JWT exp claim
        if (isTokenExpired(token)) {
          console.log('Token expired, clearing session');
          storage.removeItem('token');
          storage.removeItem('role');
          storage.removeItem('user');
          storage.removeItem('expiresAt');
          setLoading(false);
          return;
        }
        
        // Token is valid - restore session
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const parsed = parseToken(token);
        
        if (parsed) {
          console.log('Session restored for user:', parsed.email);
          setUser(parsed);
        } else {
          // Token is malformed — clear it
          console.log('Malformed token, clearing session');
          storage.removeItem('token');
          storage.removeItem('role');
          storage.removeItem('user');
          storage.removeItem('expiresAt');
        }
      } else {
        console.log('No token found, user needs to login');
      }
      
      setLoading(false);
    };

    restoreSession();
  }, []);

  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to log the action
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore errors - still log out locally
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear ALL local state from both storages
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      localStorage.removeItem('expiresAt');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('role');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('expiresAt');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      console.log('User logged out');
    }
  }, []);

  const login = useCallback((token: string, rememberMe: boolean = false, userInfo?: Partial<User>) => {
    const parsed = parseToken(token);
    if (!parsed) {
      console.error('useAuth.login: received an invalid token');
      return;
    }
    
    // Merge token data with additional user info from login response
    const fullUser: User = {
      ...parsed,
      ...userInfo
    };
    
    // Store in appropriate storage based on Remember Me
    const storage = rememberMe ? localStorage : sessionStorage;
    
    // Get token expiration
    const expiresAt = getTokenExpiration(token);
    
    // Clear the other storage to avoid conflicts
    if (rememberMe) {
      sessionStorage.clear();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      localStorage.removeItem('expiresAt');
    }
    
    // Store complete auth data
    storage.setItem('token', token);
    storage.setItem('role', fullUser.role);
    storage.setItem('user', JSON.stringify(fullUser));
    if (expiresAt) {
      storage.setItem('expiresAt', expiresAt.toString());
    }
    
    // Set authorization header
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Update state
    setUser(fullUser);
    
    console.log(`User logged in (Remember Me: ${rememberMe}):`, fullUser.email);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

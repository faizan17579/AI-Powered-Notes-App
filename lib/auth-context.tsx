import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

// User interface
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  verifyToken: () => Promise<boolean>;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider Component
 * 
 * Provides authentication context to the entire app.
 * Features:
 * - Manages user state and authentication status
 * - Handles token verification on app load
 * - Provides login/logout functions
 * - Persists auth state in localStorage
 * - Auto-redirects unauthenticated users
 * 
 * Usage: Wrap your app with <AuthProvider>
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated
  const isAuthenticated = !!user && !!token;

  // Verify token with server
  const verifyToken = async (): Promise<boolean> => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!storedToken || !storedUser) {
      return false;
    }

    try {
      const response = await fetch('/api/auth?action=verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: storedToken }),
      });

      const data = await response.json();

      if (data.success) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        return true;
      } else {
        // Token is invalid, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
  };

  // Login function
  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      const isValid = await verifyToken();
      
      if (!isValid && router.pathname !== '/login' && router.pathname !== '/register') {
        // Redirect to login if not authenticated and not on auth pages
        router.push('/login');
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Redirect logic for protected routes
  useEffect(() => {
    if (!isLoading) {
      const protectedRoutes = ['/', '/notes/new', '/notes/[id]/edit'];
      const isProtectedRoute = protectedRoutes.some(route => {
        if (route.includes('[id]')) {
          return router.pathname.startsWith('/notes/') && router.pathname.includes('/edit');
        }
        return router.pathname === route;
      });

      if (isProtectedRoute && !isAuthenticated) {
        router.push('/login');
      } else if ((router.pathname === '/login' || router.pathname === '/register') && isAuthenticated) {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, router.pathname]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    verifyToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 * 
 * Custom hook to access authentication context.
 * 
 * Usage: const { user, isAuthenticated, login, logout } = useAuth();
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  loginError: string | null;
  isLoggingIn: boolean;
  login: (matricule: string, mot_de_passe: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('parc_info_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => currentUser?.access_token || null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('parc_info_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('parc_info_user');
    }
  }, [currentUser]);

  const login = async (matricule: string, mot_de_passe: string): Promise<boolean> => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const user = await apiService.login(matricule, mot_de_passe);
      setCurrentUser(user);
      setToken(user.access_token || null);
      return true;
    } catch (err: any) {
      setLoginError(err.message || 'Connexion au serveur impossible.');
      return false;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      token,
      loginError,
      isLoggingIn,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

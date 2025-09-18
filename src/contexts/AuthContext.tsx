import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Family {
  id: string;
  username: string;
  display_name: string;
}

interface AuthContextType {
  currentFamily: Family | null;
  login: (username: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if there's a stored family on app load
    const storedFamily = localStorage.getItem('currentFamily');
    if (storedFamily) {
      try {
        const family = JSON.parse(storedFamily);
        setCurrentFamily(family);
        // Set the session variable for RLS
        supabase.rpc('set_config', {
          setting_name: 'app.current_family',
          setting_value: family.username
        });
      } catch (error) {
        console.error('Error loading stored family:', error);
        localStorage.removeItem('currentFamily');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Check if family exists
      const { data: family, error } = await supabase
        .from('families')
        .select('*')
        .eq('username', username.toLowerCase())
        .single();

      if (error || !family) {
        return { success: false, error: 'Nome famiglia non trovato' };
      }

      // Set the session variable for RLS policies
      await supabase.rpc('set_config', {
        setting_name: 'app.current_family',
        setting_value: family.username
      });

      setCurrentFamily(family);
      localStorage.setItem('currentFamily', JSON.stringify(family));
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Errore durante il login' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentFamily(null);
    localStorage.removeItem('currentFamily');
  };

  const value = {
    currentFamily,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  serviceCode: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [serviceCode, setServiceCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchUserRoleAndService(session.user.id);
        }, 0);
      } else {
        setRole(null);
        setServiceCode(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRoleAndService(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoleAndService = async (userId: string) => {
    try {
      const [{ data: roleData, error: roleError }, { data: profileData }] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', userId).single(),
        supabase.from('profiles').select('service_id').eq('user_id', userId).single(),
      ]);

      if (roleError) {
        console.error('Error fetching role:', roleError);
        setRole(null);
      } else {
        setRole(roleData?.role as UserRole);
      }

      // Fetch service code if service_id exists
      if (profileData?.service_id) {
        const { data: serviceData } = await supabase
          .from('services')
          .select('code')
          .eq('id', profileData.service_id)
          .single();
        setServiceCode(serviceData?.code || null);
      } else {
        setServiceCode(null);
      }
    } catch (error) {
      console.error('Error fetching role/service:', error);
      setRole(null);
      setServiceCode(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setServiceCode(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, serviceCode, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

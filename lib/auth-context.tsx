import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextType = { session: Session | null; ready: boolean };

const AuthContext = createContext<AuthContextType>({ session: null, ready: false });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({
  children,
  navigationReady,
}: {
  children: ReactNode;
  navigationReady: boolean;
}) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const ready = session !== undefined && navigationReady;

  return (
    <AuthContext.Provider value={{ session: session ?? null, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

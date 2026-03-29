import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Generate a unique session ID per browser tab/device
const SESSION_ID = crypto.randomUUID();

export function getSessionId() {
  return SESSION_ID;
}

export async function checkExistingSession(userId: string): Promise<boolean> {
  const { data } = await supabase.rpc('check_active_session', {
    p_user_id: userId,
    p_session_id: SESSION_ID,
  });
  return data === true;
}

export async function registerSession(userId: string) {
  await supabase.rpc('upsert_session', {
    p_user_id: userId,
    p_session_id: SESSION_ID,
  });
}

export async function clearSession(userId: string) {
  await supabase.rpc('clear_session', { p_user_id: userId });
}

/**
 * Heartbeat hook: keeps the session alive and checks if another device took over.
 * If another session is detected, forces sign out.
 */
export function useSessionGuard(userId: string | undefined, onForceLogout: () => void) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const heartbeat = useCallback(async () => {
    if (!userId) return;
    
    // Update our session timestamp
    await registerSession(userId);
    
    // Check if we're still the active session
    const { data } = await supabase
      .from('active_sessions')
      .select('session_id')
      .eq('user_id', userId)
      .single();
    
    if (data && data.session_id !== SESSION_ID) {
      // Another device took over our session
      onForceLogout();
    }
  }, [userId, onForceLogout]);

  useEffect(() => {
    if (!userId) return;

    // Initial registration
    registerSession(userId);

    // Heartbeat every 2 minutes
    intervalRef.current = setInterval(heartbeat, 2 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId, heartbeat]);
}

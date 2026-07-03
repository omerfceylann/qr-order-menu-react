import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { resolveThemeColors } from '../lib/theme';
import type { RestaurantSettings } from '../lib/types';

type AppContextValue = {
  session: Session | null;
  settings: RestaurantSettings | null;
  loadingSettings: boolean;
  refreshSettings: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  async function refreshSettings() {
    if (!isSupabaseConfigured) {
      setLoadingSettings(false);
      return;
    }

    setLoadingSettings(true);
    try {
      const { data } = await supabase.from('restaurant_settings').select('*').limit(1).maybeSingle();
      setSettings(data);
    } finally {
      setLoadingSettings(false);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    refreshSettings();

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!settings) return;
    const theme = resolveThemeColors(settings.primary_color, settings.accent_color);
    document.documentElement.style.setProperty('--brand', theme.primary);
    document.documentElement.style.setProperty('--accent', theme.accent);
    document.documentElement.style.setProperty('--brand-dark', theme.darkPrimary);
    document.documentElement.style.setProperty('--accent-dark', theme.darkAccent);
    if (window.location.pathname.startsWith('/menu/')) return;
    document.documentElement.classList.toggle('dark', settings.theme_mode === 'dark');
    document.documentElement.lang = settings.language || 'tr';
  }, [settings]);

  const value = useMemo(
    () => ({ session, settings, loadingSettings, refreshSettings }),
    [session, settings, loadingSettings],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProviders');
  return context;
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  source: 'env' | 'runtime';
}

const RUNTIME_STORAGE_KEY = 'saffron_fork_supabase_config';

function isPlaceholder(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    !value ||
    lower.includes('your-project-id') ||
    lower.includes('your-supabase-anon-key') ||
    lower.includes('your-supabase-publishable-key')
  );
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
  // Prefer the JWT-based anon key (required by @supabase/supabase-js v2).
  // Fall back to the publishable key (supported by supabase-js v3+).
  const envKey = (
    import.meta.env.VITE_SUPABASE_ANON_KEY ??
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    ''
  ).trim();

  if (envUrl && envKey && !isPlaceholder(envUrl) && !isPlaceholder(envKey)) {
    return { url: envUrl, anonKey: envKey, source: 'env' };
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(RUNTIME_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { url?: string; anonKey?: string };
        const url = (parsed.url ?? '').trim();
        const anonKey = (parsed.anonKey ?? '').trim();
        if (url && anonKey && !isPlaceholder(url) && !isPlaceholder(anonKey)) {
          return { url, anonKey, source: 'runtime' };
        }
      }
    } catch {
      return null;
    }
  }

  return null;
}

let cachedClient: SupabaseClient | null = null;
let cachedSignature = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) {
    cachedClient = null;
    cachedSignature = '';
    return null;
  }

  const signature = `${config.url}::${config.anonKey}`;
  if (!cachedClient || cachedSignature !== signature) {
    const safeFetch: typeof fetch = async (...args) => {
      try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          return new Response(
            JSON.stringify({ error: 'offline', message: 'Offline mode active' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return await fetch(...args);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('Failed to fetch') ||
          msg.includes('ERR_INTERNET_DISCONNECTED') ||
          msg.includes('NetworkError') ||
          (typeof navigator !== 'undefined' && !navigator.onLine)
        ) {
          return new Response(
            JSON.stringify({ error: 'offline', message: 'Offline mode active' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
          );
        }
        throw err;
      }
    };

    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: safeFetch,
      },
    });
    cachedSignature = signature;
  }
  return cachedClient;
}

export function saveRuntimeSupabaseConfig(url: string, anonKey: string): void {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();
  if (!cleanUrl.startsWith('https://') || !cleanUrl.includes('.supabase.')) {
    throw new Error('Supabase URL must look like https://your-project-id.supabase.co');
  }
  if (cleanKey.length < 20) {
    throw new Error('Please paste your full Supabase anon / publishable key.');
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(
      RUNTIME_STORAGE_KEY,
      JSON.stringify({ url: cleanUrl, anonKey: cleanKey }),
    );
  }
  cachedClient = null;
  cachedSignature = '';
}

export function clearRuntimeSupabaseConfig(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(RUNTIME_STORAGE_KEY);
  }
  cachedClient = null;
  cachedSignature = '';
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}


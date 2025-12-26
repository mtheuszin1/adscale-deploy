
import { createClient } from '@supabase/supabase-js';

// No deploy real, essas variáveis vêm do ambiente (Vercel/Netlify/etc)
// O fallback para string vazia evita que o createClient quebre o build
const supabaseUrl = (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '') || '';
const supabaseAnonKey = (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : '') || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    }) 
  : null;

export const isSupabaseConnected = () => {
  if (!supabase) return false;
  return !!supabaseUrl && !!supabaseAnonKey;
};

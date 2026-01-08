// =============================================
// TRANSIGO - SUPABASE CLIENT & CONFIGURATION
// Package partagé pour Driver, Passenger et Admin
// =============================================

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Configuration Supabase
const SUPABASE_URL = 'https://zndgvloyaitopczhjddq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZGd2bG95YWl0b3BjemhqZGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTc1MDgsImV4cCI6MjA4MzEzMzUwOH0.KTHGtMaaWW_GhXacarRN40iqlFUp2KPirp_5peHWBls';

// Client Supabase typé
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});

// Export de la configuration pour les apps qui en ont besoin
export const config = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
};

// Re-export types
export * from './types';
export * from './hooks';

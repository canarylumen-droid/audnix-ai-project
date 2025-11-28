import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Check if Supabase admin is configured
export const isSupabaseAdminConfigured = () => {
  return Boolean(supabaseUrl && supabaseServiceKey && supabaseUrl !== '' && supabaseServiceKey !== '');
};

// Only create admin client if properly configured
let adminClient: SupabaseClient | null = null;

if (isSupabaseAdminConfigured()) {
  adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  console.log('Supabase admin client initialized successfully');
} else {
  console.warn('Supabase admin credentials not configured. Using in-memory storage only.');
}

export const supabaseAdmin = adminClient;

// DEPRECATED: syncUserFromSupabase - no longer used
// All user data is stored in Neon PostgreSQL database via Drizzle ORM
// Authentication is handled via password + SendGrid OTP, not Supabase auth

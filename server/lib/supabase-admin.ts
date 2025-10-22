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

// Helper function to sync user from Supabase to our database
export async function syncUserFromSupabase(supabaseUserId: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured');
  }

  const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);

  if (error || !user) {
    throw new Error('Failed to fetch user from Supabase');
  }

  return {
    supabaseId: user.id,
    email: user.email || '',
    name: user.user_metadata?.full_name || user.user_metadata?.name || null,
    username: user.user_metadata?.user_name || null,
  };
}

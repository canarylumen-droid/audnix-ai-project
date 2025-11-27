import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabase";

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  plan?: string;
  role?: string;
  avatar?: string;
  supabaseId?: string;
  metadata?: Record<string, any>;
}

async function fetchUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error('Failed to fetch user');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}

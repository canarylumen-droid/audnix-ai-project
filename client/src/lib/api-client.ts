
import { toast } from '@/hooks/use-toast';

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function apiClient<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      // User-friendly error messages
      let message = error.message || 'Something went wrong';
      
      if (response.status === 401) {
        message = 'Please sign in to continue';
        window.location.href = '/auth';
      } else if (response.status === 403) {
        message = 'You do not have permission for this action';
      } else if (response.status === 429) {
        message = 'Too many requests. Please try again later.';
      } else if (response.status >= 500) {
        message = 'Server error. Our team has been notified.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
      
      throw new APIError(response.status, message, error.code);
    }

    return response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Network errors
    toast({
      variant: 'destructive',
      title: 'Connection Error',
      description: 'Please check your internet connection',
    });
    
    throw new APIError(0, 'Network error');
  }
}

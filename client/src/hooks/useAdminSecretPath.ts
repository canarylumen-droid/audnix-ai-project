/**
 * Hook to get secret admin URL from environment
 * Usage: const adminPath = useAdminSecretPath() // Returns something like "/admin-secret-12345"
 */
export function useAdminSecretPath(): string {
  // Get from environment variable, defaults to 'admin-secret-xyz' if not set
  const secretPath = import.meta.env.VITE_ADMIN_SECRET_URL || 'admin-secret-xyz';
  return `/${secretPath}`;
}

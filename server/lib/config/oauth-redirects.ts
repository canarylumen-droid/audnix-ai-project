export function getOAuthRedirectUrl(provider: 'gmail' | 'google-calendar' | 'outlook' | 'instagram' | 'whatsapp'): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = process.env.DOMAIN || 'audnixai.com';
  
  const basePath = `/api/oauth/${provider}/callback`;
  
  if (isProduction && domain) {
    return `https://${domain}${basePath}`;
  }
  
  const envKey = `${provider.toUpperCase().replace('-', '_')}_REDIRECT_URI`;
  return process.env[envKey] || `http://localhost:5000${basePath}`;
}

export function getAllOAuthRedirectUrls() {
  return {
    gmail: getOAuthRedirectUrl('gmail'),
    googleCalendar: getOAuthRedirectUrl('google-calendar'),
    outlook: getOAuthRedirectUrl('outlook'),
    instagram: getOAuthRedirectUrl('instagram'),
    whatsapp: getOAuthRedirectUrl('whatsapp')
  };
}

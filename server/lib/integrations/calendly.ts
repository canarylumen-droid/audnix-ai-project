/**
 * Helper strictly for Calendly link enrichment
 */

export function getCalendlyPrefillLink(baseCalendarLink: string, lead: any): string {
  if (!baseCalendarLink) return "our booking page";

  // Check if it's an actual Calendly link
  if (!baseCalendarLink.toLowerCase().includes('calendly.com')) {
    return baseCalendarLink; 
  }

  const nameParam = lead.name ? encodeURIComponent(lead.name) : '';
  const emailParam = lead.email ? encodeURIComponent(lead.email) : '';
  
  // Calendly uses ?name= &email= 
  const separator = baseCalendarLink.includes('?') ? '&' : '?';
  const finalLink = `${baseCalendarLink}${separator}name=${nameParam}&email=${emailParam}`;
  
  return finalLink;
}

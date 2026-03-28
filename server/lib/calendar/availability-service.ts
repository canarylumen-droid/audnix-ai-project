import { storage } from '../../storage.js';
import { googleCalendarOAuth } from '../oauth/google-calendar.js';
import { getCalendlySlots } from './calendly.js';

export interface AvailableSlot {
  start: Date;
  end: Date;
  provider: 'google_calendar' | 'calendly' | 'default';
}

export class AvailabilityService {
  /**
   * Get suggested free times for the user to propose to a lead
   */
  async getSuggestedTimes(userId: string, hoursAhead: number = 72): Promise<AvailableSlot[]> {
    try {
      // 1. Check for Calendly first (primary booking tool)
      const user = await storage.getUserById(userId);
      if (user?.calendlyAccessToken) {
        const slots = await getCalendlySlots(user.calendlyAccessToken, 3); // 3 days ahead
        if (slots && slots.length > 0) {
          return slots.slice(0, 5).map(s => ({
            start: new Date(s.time),
            end: new Date(new Date(s.time).getTime() + 30 * 60000), // Default 30 min
            provider: 'calendly'
          }));
        }
      }

      // 2. Check Google Calendar secondary
      const googleIntegration = await storage.getOAuthAccount(userId, 'google');
      if (googleIntegration?.accessToken) {
        // Find next 5 slots
        const now = new Date();
        const nextSlots: AvailableSlot[] = [];
        
        // Simple search: try 1-hour slots starting next business hour
        let searchTime = new Date(now);
        searchTime.setMinutes(0, 0, 0);
        searchTime.setHours(searchTime.getHours() + 2); // Start in 2 hours

        for (let i = 0; i < 24 && nextSlots.length < 5; i++) {
          // Skip non-business hours (9 AM - 6 PM)
          const hour = searchTime.getHours();
          if (hour < 9 || hour > 18 || searchTime.getDay() === 0 || searchTime.getDay() === 6) {
            searchTime.setHours(searchTime.getHours() + 1);
            continue;
          }

          const endTime = new Date(searchTime.getTime() + 60 * 60000);
          const isAvailable = await googleCalendarOAuth.checkAvailability(
            googleIntegration.accessToken, 
            searchTime, 
            endTime
          );

          if (isAvailable) {
            nextSlots.push({
              start: new Date(searchTime),
              end: endTime,
              provider: 'google_calendar'
            });
          }
          searchTime.setHours(searchTime.getHours() + 1);
        }

        if (nextSlots.length > 0) return nextSlots;
      }

      // 3. Fallback: Default business hours (Emergency mode)
      return this.generateDefaultSlots(hoursAhead);
    } catch (error) {
      console.error('Error in AvailabilityService:', error);
      return this.generateDefaultSlots(hoursAhead);
    }
  }

  private generateDefaultSlots(hoursAhead: number): AvailableSlot[] {
    const slots: AvailableSlot[] = [];
    const now = new Date();
    let search = new Date(now);
    search.setHours(search.getHours() + 24); // Start tomorrow
    search.setMinutes(0, 0, 0);

    while (slots.length < 3) {
      if (search.getHours() >= 10 && search.getHours() <= 16 && search.getDay() !== 0 && search.getDay() !== 6) {
        slots.push({
          start: new Date(search),
          end: new Date(search.getTime() + 60 * 60000),
          provider: 'default'
        });
      }
      search.setHours(search.getHours() + 1);
    }
    return slots;
  }

  formatSlotsForAI(slots: AvailableSlot[]): string {
    if (slots.length === 0) return "No specific times found. Please use the booking link.";
    
    return slots.map(s => {
      return s.start.toLocaleString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }).join(", ");
  }
}

export const availabilityService = new AvailabilityService();

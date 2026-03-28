import { availabilityService } from '../server/lib/calendar/availability-service.js';

async function test() {
  console.log("Testing Availability Service...");
  // Use a dummy user ID for fallback test
  const slots = await availabilityService.getSuggestedTimes("dummy-id");
  console.log("Retrieved Slots:", slots.length);
  const formatted = availabilityService.formatSlotsForAI(slots);
  console.log("Formatted for AI:", formatted);
  
  if (slots.length > 0 && formatted.includes(",")) {
    console.log("✅ Verification Passed: Fallback slots generated and formatted correctly.");
  } else {
    console.log("❌ Verification Failed: Unexpected slot output.");
  }
}

test().catch(console.error);

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { BrandColors } from '@/lib/types'; // Assuming BrandColors is defined in types

/**
 * Get brand colors from user's brand_embeddings metadata
 */
async function getUserBrandColors(userId: string): Promise<BrandColors | undefined> {
  if (!supabaseAdmin) return undefined;

  try {
    const { data: brandData } = await supabaseAdmin
      .from('brand_embeddings')
      .select('metadata')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (brandData?.metadata?.colors) {
      return {
        primary: brandData.metadata.colors.primary,
        secondary: brandData.metadata.colors.secondary,
        accent: brandData.metadata.colors.accent
      };
    }
  } catch (error) {
    console.error('Error fetching brand colors:', error);
  }
  return undefined;
}

/**
 * Auto-generate email subject from content and brand context
 */
async function generateEmailSubject(userId: string, content: string): Promise<string> {
  if (!supabaseAdmin) return 'Message from Our Team';

  try {
    // Get user's business name from settings
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('business_name, company')
      .eq('id', userId)
      .single();

    const businessName = userData?.business_name || userData?.company || 'Our Team';

    // Smart subject generation based on content
    if (content.toLowerCase().includes('meeting') || content.toLowerCase().includes('schedule')) {
      return `📅 Let's Schedule a Meeting - ${businessName}`;
    } else if (content.toLowerCase().includes('offer') || content.toLowerCase().includes('discount')) {
      return `🎁 Special Offer for You - ${businessName}`;
    } else if (content.toLowerCase().includes('question') || content.toLowerCase().includes('help')) {
      return `💬 Quick Question - ${businessName}`;
    } else {
      return `Message from ${businessName}`;
    }
  } catch (error) {
    console.error('Error generating email subject:', error);
    return 'Message from Our Team';
  }
}
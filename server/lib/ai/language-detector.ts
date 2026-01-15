import { storage } from '../../storage.js';
import type { Message } from '../../../shared/schema.js';

export interface LanguageDetection {
  language: string;
  confidence: number;
  code: string; // ISO 639-1 code
}

const LANGUAGE_PATTERNS = {
  es: {
    name: 'Spanish',
    keywords: ['hola', 'gracias', 'por favor', 'sí', 'no', 'cuánto', 'precio', 'quiero'],
    greetings: ['hola', 'buenos días', 'buenas tardes', 'buenas noches']
  },
  fr: {
    name: 'French',
    keywords: ['bonjour', 'merci', 's\'il vous plaît', 'oui', 'non', 'combien', 'prix', 'je veux'],
    greetings: ['bonjour', 'bonsoir', 'salut']
  },
  de: {
    name: 'German',
    keywords: ['hallo', 'danke', 'bitte', 'ja', 'nein', 'wie viel', 'preis', 'ich möchte'],
    greetings: ['hallo', 'guten tag', 'guten morgen']
  },
  pt: {
    name: 'Portuguese',
    keywords: ['olá', 'obrigado', 'por favor', 'sim', 'não', 'quanto', 'preço', 'quero'],
    greetings: ['olá', 'oi', 'bom dia', 'boa tarde']
  },
  it: {
    name: 'Italian',
    keywords: ['ciao', 'grazie', 'per favore', 'sì', 'no', 'quanto', 'prezzo', 'voglio'],
    greetings: ['ciao', 'buongiorno', 'buonasera']
  },
  ar: {
    name: 'Arabic',
    keywords: ['مرحبا', 'شكرا', 'من فضلك', 'نعم', 'لا', 'كم', 'سعر'],
    greetings: ['مرحبا', 'السلام عليكم']
  },
  hi: {
    name: 'Hindi',
    keywords: ['नमस्ते', 'धन्यवाद', 'कृपया', 'हाँ', 'नहीं', 'कितना', 'कीमत'],
    greetings: ['नमस्ते', 'नमस्कार']
  }
};

/**
 * Detect language from message text
 */
export function detectLanguage(text: string): LanguageDetection {
  const lowerText = text.toLowerCase();

  let bestMatch = { language: 'English', code: 'en', confidence: 0.5 };

  for (const [code, data] of Object.entries(LANGUAGE_PATTERNS)) {
    let matchCount = 0;

    // Check keywords
    for (const keyword of data.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    // Check greetings (higher weight)
    for (const greeting of data.greetings) {
      if (lowerText.includes(greeting.toLowerCase())) {
        matchCount += 2;
      }
    }

    const confidence = Math.min(matchCount / data.keywords.length, 1);

    if (confidence > bestMatch.confidence) {
      bestMatch = {
        language: data.name,
        code,
        confidence
      };
    }
  }

  return bestMatch;
}

/**
 * Get translated response based on detected language
 */
export async function getLocalizedResponse(
  message: string,
  detectedLang: LanguageDetection,
  responseType: 'greeting' | 'product_info' | 'price' | 'objection' | 'closing'
): Promise<string> {
  const responses: Record<string, Record<string, string[]>> = {
    es: {
      greeting: ['¡Hola! 👋', '¡Gracias por contactarnos!', '¿Cómo puedo ayudarte hoy?'],
      product_info: ['Este producto tiene características increíbles', 'Es perfecto para ti'],
      price: ['El precio es muy competitivo', 'Tenemos una oferta especial para ti'],
      objection: ['Entiendo tu preocupación', 'Déjame explicarte mejor'],
      closing: ['¿Listo para ordenar?', '¿Puedo ayudarte con algo más?']
    },
    fr: {
      greeting: ['Bonjour! 👋', 'Merci de nous contacter!', 'Comment puis-je vous aider?'],
      product_info: ['Ce produit a des caractéristiques incroyables', 'C\'est parfait pour vous'],
      price: ['Le prix est très compétitif', 'Nous avons une offre spéciale pour vous'],
      objection: ['Je comprends votre préoccupation', 'Laissez-moi mieux expliquer'],
      closing: ['Prêt à commander?', 'Puis-je vous aider avec autre chose?']
    },
    de: {
      greeting: ['Hallo! 👋', 'Danke für Ihre Kontaktaufnahme!', 'Wie kann ich Ihnen helfen?'],
      product_info: ['Dieses Produkt hat unglaubliche Eigenschaften', 'Es ist perfekt für Sie'],
      price: ['Der Preis ist sehr wettbewerbsfähig', 'Wir haben ein Sonderangebot für Sie'],
      objection: ['Ich verstehe Ihre Bedenken', 'Lassen Sie mich besser erklären'],
      closing: ['Bereit zu bestellen?', 'Kann ich Ihnen bei etwas anderem helfen?']
    },
    pt: {
      greeting: ['Olá! 👋', 'Obrigado por entrar em contato!', 'Como posso ajudá-lo hoje?'],
      product_info: ['Este produto tem recursos incríveis', 'É perfeito para você'],
      price: ['O preço é muito competitivo', 'Temos uma oferta especial para você'],
      objection: ['Entendo sua preocupação', 'Deixe-me explicar melhor'],
      closing: ['Pronto para pedir?', 'Posso ajudá-lo com mais alguma coisa?']
    }
  };

  if (detectedLang.code === 'en' || !responses[detectedLang.code]) {
    return message; // Return original English message
  }

  const langResponses = responses[detectedLang.code][responseType];
  return langResponses[Math.floor(Math.random() * langResponses.length)];
}

/**
 * Auto-translate lead's language preference
 */
export async function updateLeadLanguage(leadId: string, language: LanguageDetection): Promise<void> {
  const lead = await storage.getLeadById(leadId);
  if (!lead) return;

  await storage.updateLead(leadId, {
    metadata: {
      ...lead.metadata,
      language: language.language,
      languageCode: language.code,
      languageConfidence: language.confidence
    }
  });
}


/**
 * Email Discovery Service
 * Automatically detects SMTP/IMAP settings based on email domain
 */

interface EmailSettings {
    smtp: {
        host: string;
        port: number;
    };
    imap: {
        host: string;
        port: number;
    };
    provider: string;
}

const PROVIDER_MAP: Record<string, EmailSettings> = {
    'gmail.com': {
        smtp: { host: 'smtp.gmail.com', port: 587 },
        imap: { host: 'imap.gmail.com', port: 993 },
        provider: 'gmail'
    },
    'googlemail.com': {
        smtp: { host: 'smtp.gmail.com', port: 587 },
        imap: { host: 'imap.gmail.com', port: 993 },
        provider: 'gmail'
    },
    'outlook.com': {
        smtp: { host: 'smtp-mail.outlook.com', port: 587 },
        imap: { host: 'outlook.office365.com', port: 993 },
        provider: 'outlook'
    },
    'hotmail.com': {
        smtp: { host: 'smtp-mail.outlook.com', port: 587 },
        imap: { host: 'outlook.office365.com', port: 993 },
        provider: 'outlook'
    },
    'live.com': {
        smtp: { host: 'smtp-mail.outlook.com', port: 587 },
        imap: { host: 'outlook.office365.com', port: 993 },
        provider: 'outlook'
    },
    'icloud.com': {
        smtp: { host: 'smtp.mail.me.com', port: 587 },
        imap: { host: 'imap.mail.me.com', port: 993 },
        provider: 'icloud'
    },
    'me.com': {
        smtp: { host: 'smtp.mail.me.com', port: 587 },
        imap: { host: 'imap.mail.me.com', port: 993 },
        provider: 'icloud'
    },
    'yahoo.com': {
        smtp: { host: 'smtp.mail.yahoo.com', port: 465 },
        imap: { host: 'imap.mail.yahoo.com', port: 993 },
        provider: 'yahoo'
    },
    'ymail.com': {
        smtp: { host: 'smtp.mail.yahoo.com', port: 465 },
        imap: { host: 'imap.mail.yahoo.com', port: 993 },
        provider: 'yahoo'
    },
    'hostinger.com': {
        smtp: { host: 'smtp.hostinger.com', port: 465 },
        imap: { host: 'imap.hostinger.com', port: 993 },
        provider: 'hostinger'
    }
};

export class EmailDiscoveryService {
    /**
     * Resolve settings for a given email address
     */
    static async discoverSettings(email: string): Promise<EmailSettings | null> {
        const domain = email.split('@')[1]?.toLowerCase();
        if (!domain) return null;

        // 1. Check known providers
        if (PROVIDER_MAP[domain]) {
            return PROVIDER_MAP[domain];
        }

        // 2. Heuristic: try common subdomains
        try {
            // In a real implementation, we might do DNS MX or SRV record lookups here.
            // For now, we'll suggest common patterns for unknown domains.
            return {
                smtp: {
                    host: `smtp.${domain}`,
                    port: 587
                },
                imap: {
                    host: `imap.${domain}`,
                    port: 993
                },
                provider: 'custom'
            };
        } catch (e) {
            return null;
        }
    }
}

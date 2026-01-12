import dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);
const resolveMx = promisify(dns.resolveMx);

export interface DnsVerificationResult {
  domain: string;
  spf: {
    found: boolean;
    valid: boolean;
    record?: string;
    issues: string[];
    suggestions: string[];
  };
  dkim: {
    found: boolean;
    valid: boolean;
    selector?: string;
    record?: string;
    issues: string[];
    suggestions: string[];
  };
  dmarc: {
    found: boolean;
    valid: boolean;
    policy?: string;
    record?: string;
    issues: string[];
    suggestions: string[];
  };
  mx: {
    found: boolean;
    records: Array<{ priority: number; exchange: string }>;
  };
  overallScore: number;
  overallStatus: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}

async function checkSpf(domain: string): Promise<DnsVerificationResult['spf']> {
  const issues: string[] = [];
  const suggestions: string[] = [];

  try {
    const records = await resolveTxt(domain);
    const spfRecords = records.flat().filter(r => r.startsWith('v=spf1'));

    if (spfRecords.length === 0) {
      return {
        found: false,
        valid: false,
        issues: ['No SPF record found'],
        suggestions: [
          'Add an SPF record to your DNS settings',
          'Example: v=spf1 include:_spf.google.com include:sendgrid.net ~all'
        ],
      };
    }

    if (spfRecords.length > 1) {
      issues.push('Multiple SPF records found (should only have one)');
    }

    const spfRecord = spfRecords[0];

    if (!spfRecord.includes('~all') && !spfRecord.includes('-all') && !spfRecord.includes('?all')) {
      issues.push('SPF record missing "all" mechanism');
      suggestions.push('Add ~all or -all at the end of your SPF record');
    }

    if (spfRecord.includes('+all')) {
      issues.push('SPF record uses +all which allows any server to send email');
      suggestions.push('Change +all to ~all or -all for better security');
    }

    const lookups = (spfRecord.match(/include:|a:|mx:|ptr:|exists:/g) || []).length;
    if (lookups > 10) {
      issues.push(`SPF record has ${lookups} DNS lookups (max recommended is 10)`);
      suggestions.push('Consider flattening your SPF record to reduce lookups');
    }

    return {
      found: true,
      valid: issues.length === 0,
      record: spfRecord,
      issues,
      suggestions,
    };
  } catch (error: any) {
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      return {
        found: false,
        valid: false,
        issues: ['No SPF record found'],
        suggestions: ['Add an SPF record to authorize your email servers'],
      };
    }
    throw error;
  }
}

async function checkDkim(domain: string, selector?: string): Promise<DnsVerificationResult['dkim']> {
  const commonSelectors = selector ? [selector] : ['default', 'google', 'selector1', 'selector2', 'k1', 'dkim', 'mail', 'smtp', 's1', 's2'];

  for (const sel of commonSelectors) {
    try {
      const records = await resolveTxt(`${sel}._domainkey.${domain}`);
      const dkimRecord = records.flat().join('');

      if (dkimRecord.includes('v=DKIM1')) {
        const issues: string[] = [];
        const suggestions: string[] = [];

        if (!dkimRecord.includes('p=')) {
          issues.push('DKIM record missing public key');
        }

        return {
          found: true,
          valid: issues.length === 0,
          selector: sel,
          record: dkimRecord,
          issues,
          suggestions,
        };
      }
    } catch (error) {
      continue;
    }
  }

  return {
    found: false,
    valid: false,
    issues: ['No DKIM record found'],
    suggestions: [
      'Set up DKIM signing with your email provider',
      'Add a DKIM TXT record at selector._domainkey.yourdomain.com'
    ],
  };
}

async function checkDmarc(domain: string): Promise<DnsVerificationResult['dmarc']> {
  try {
    const records = await resolveTxt(`_dmarc.${domain}`);
    const dmarcRecords = records.flat().filter(r => r.startsWith('v=DMARC1'));

    if (dmarcRecords.length === 0) {
      return {
        found: false,
        valid: false,
        issues: ['No DMARC record found'],
        suggestions: [
          'Add a DMARC record to improve email deliverability',
          'Start with: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com'
        ],
      };
    }

    const dmarcRecord = dmarcRecords[0];
    const issues: string[] = [];
    const suggestions: string[] = [];

    const policyMatch = dmarcRecord.match(/p=(none|quarantine|reject)/i);
    const policy = policyMatch ? policyMatch[1].toLowerCase() : undefined;

    if (policy === 'none') {
      suggestions.push('Consider upgrading from p=none to p=quarantine or p=reject for better protection');
    }

    if (!dmarcRecord.includes('rua=')) {
      suggestions.push('Add rua= to receive aggregate DMARC reports');
    }

    return {
      found: true,
      valid: issues.length === 0,
      policy,
      record: dmarcRecord,
      issues,
      suggestions,
    };
  } catch (error: any) {
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      return {
        found: false,
        valid: false,
        issues: ['No DMARC record found'],
        suggestions: [
          'Add a DMARC record at _dmarc.yourdomain.com',
          'Example: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com'
        ],
      };
    }
    throw error;
  }
}

async function checkMx(domain: string): Promise<DnsVerificationResult['mx']> {
  try {
    const records = await resolveMx(domain);
    return {
      found: records.length > 0,
      records: records.map(r => ({ priority: r.priority, exchange: r.exchange })),
    };
  } catch (error) {
    return {
      found: false,
      records: [],
    };
  }
}

export async function verifyDomainDns(domain: string, dkimSelector?: string): Promise<DnsVerificationResult> {
  let cleanDomain = domain.toLowerCase().trim();
  try {
    const url = new URL(cleanDomain.startsWith('http') ? cleanDomain : `https://${cleanDomain}`);
    cleanDomain = url.hostname;
  } catch (e) {
    cleanDomain = cleanDomain.replace(/\/.*$/, '');
  }

  const [spf, dkim, dmarc, mx] = await Promise.all([
    checkSpf(cleanDomain),
    checkDkim(cleanDomain, dkimSelector),
    checkDmarc(cleanDomain),
    checkMx(cleanDomain),
  ]);

  let score = 0;
  const recommendations: string[] = [];

  if (spf.found && spf.valid) score += 30;
  else if (spf.found) score += 15;
  else recommendations.push('Add SPF record to authorize email senders');

  if (dkim.found && dkim.valid) score += 30;
  else if (dkim.found) score += 15;
  else recommendations.push('Set up DKIM signing for email authentication');

  if (dmarc.found && dmarc.valid) {
    if (dmarc.policy === 'reject') score += 40;
    else if (dmarc.policy === 'quarantine') score += 35;
    else score += 25;
  } else if (dmarc.found) {
    score += 15;
  } else {
    recommendations.push('Add DMARC policy to prevent email spoofing');
  }

  if (!mx.found) {
    recommendations.push('No MX records found - email delivery may fail');
  }

  let overallStatus: DnsVerificationResult['overallStatus'];
  if (score >= 90) overallStatus = 'excellent';
  else if (score >= 70) overallStatus = 'good';
  else if (score >= 50) overallStatus = 'fair';
  else overallStatus = 'poor';

  return {
    domain: cleanDomain,
    spf,
    dkim,
    dmarc,
    mx,
    overallScore: score,
    overallStatus,
    recommendations,
  };
}

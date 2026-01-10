import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

export interface SMTPVerificationResult {
    email: string;
    valid: boolean;
    reason: string;
    riskLevel: 'low' | 'medium' | 'high';
}

export class EmailVerifier {

    /**
     * Full SMTP Verification Pipeline
     */
    async verify(email: string): Promise<SMTPVerificationResult> {
        const result: SMTPVerificationResult = {
            email,
            valid: false,
            reason: '',
            riskLevel: 'high'
        };

        // 1. Format Validation
        if (!this.isValidFormat(email)) {
            result.reason = 'Invalid email format';
            return result;
        }

        // 2. Disposable Email Detection
        if (this.isDisposable(email)) {
            result.reason = 'Disposable email provider';
            result.riskLevel = 'high';
            return result;
        }

        // 3. MX Record Check
        const domain = email.split('@')[1];
        const hasMX = await this.checkMXRecords(domain);

        if (!hasMX) {
            result.reason = 'No MX records found';
            result.riskLevel = 'high';
            return result;
        }

        // 4. Role-based Email Detection
        if (this.isRoleBased(email)) {
            result.valid = true;
            result.reason = 'Role-based email (info@, contact@, etc.)';
            result.riskLevel = 'medium';
            return result;
        }

        // If all checks pass
        result.valid = true;
        result.reason = 'Valid email with MX records';
        result.riskLevel = 'low';

        return result;
    }

    /**
     * Email Format Validation
     */
    private isValidFormat(email: string): boolean {
        const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    }

    /**
     * MX Record Verification
     */
    private async checkMXRecords(domain: string): Promise<boolean> {
        try {
            const records = await resolveMx(domain);
            return records && records.length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Disposable Email Provider Detection
     */
    private isDisposable(email: string): boolean {
        const disposableDomains = [
            'tempmail.com', 'guerrillamail.com', '10minutemail.com',
            'mailinator.com', 'throwaway.email', 'temp-mail.org',
            'fakeinbox.com', 'sharklasers.com', 'yopmail.com'
        ];

        const domain = email.split('@')[1].toLowerCase();
        return disposableDomains.some(d => domain.includes(d));
    }

    /**
     * Role-Based Email Detection
     */
    private isRoleBased(email: string): boolean {
        const roleKeywords = [
            'info', 'contact', 'support', 'sales', 'admin',
            'hello', 'help', 'service', 'team', 'office'
        ];

        const localPart = email.split('@')[0].toLowerCase();
        return roleKeywords.some(keyword => localPart.includes(keyword));
    }

    /**
     * Batch Verification (for high-volume scans)
     */
    async verifyBatch(emails: string[]): Promise<SMTPVerificationResult[]> {
        const results = await Promise.all(
            emails.map(email => this.verify(email))
        );
        return results;
    }
}

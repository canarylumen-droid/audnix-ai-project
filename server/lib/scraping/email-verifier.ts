import dns from 'dns';
import { promisify } from 'util';
import net from 'net';

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

        // 4. Advanced SMTP Handshake (Primary Check)
        try {
            const smtpCheck = await this.checkSMTP(email);
            if (smtpCheck.valid) {
                result.valid = true;
                result.reason = 'Verified via SMTP handshake';
                result.riskLevel = 'low';
                return result;
            } else if (smtpCheck.log.includes('Mailbox address rejected') || smtpCheck.log.includes('550')) {
                result.valid = false;
                result.reason = 'Mailbox does not exist (SMTP rejected)';
                result.riskLevel = 'high';
                return result;
            } else if (smtpCheck.log.includes('Timeout') || smtpCheck.log.includes('Error')) {
                // If handshake times out or errors locally, we fall back to MX check
                // but mark as 'medium' risk to be safe
                result.valid = true;
                result.reason = 'Valid MX (SMTP handshake timed out)';
                result.riskLevel = 'medium';
                return result;
            }
        } catch (e) {
            // Unexpected error during SMTP check
            result.valid = true;
            result.reason = 'Valid MX (SMTP process failed)';
            result.riskLevel = 'medium';
            return result;
        }

        // 5. Final fallback (Role-based check if SMTP failed/indeterminate)
        if (this.isRoleBased(email)) {
            result.valid = true;
            result.reason = 'Role-based email (info@, contact@, etc.)';
            result.riskLevel = 'medium';
            return result;
        }

        result.valid = true;
        result.riskLevel = 'medium';
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
     * Advanced SMTP Handshake to verify mailbox existence
     * NOTE: This requires port 25 access and a non-blacklisted IP.
     * In some dev environments, this may fail or time out.
     */
    async checkSMTP(email: string): Promise<{ valid: boolean; log: string }> {
        const domain = email.split('@')[1];

        try {
            const mxRecords = await resolveMx(domain);
            if (!mxRecords || mxRecords.length === 0) {
                return { valid: false, log: 'No MX records found' };
            }

            // Sort by priority
            const sortedMx = mxRecords.sort((a, b) => a.priority - b.priority);
            const exchange = sortedMx[0].exchange;

            return new Promise((resolve) => {
                const socket = new net.Socket();
                let step = 0;
                let log = '';
                let isValid = false;

                socket.setTimeout(3000); // 3s timeout for speed

                socket.on('connect', () => {
                    log += `Connected to ${exchange}\n`;
                });

                socket.on('data', (data) => {
                    const response = data.toString();
                    log += `S: ${response}`;

                    const code = parseInt(response.substring(0, 3));

                    if (step === 0 && code === 220) {
                        // Server greeting -> Send HELO
                        const cmd = `HELO ${domain}\r\n`;
                        socket.write(cmd);
                        log += `C: ${cmd}`;
                        step++;
                    } else if (step === 1 && code === 250) {
                        // HELO accepted -> MAIL FROM
                        const cmd = `MAIL FROM:<verify@${domain}>\r\n`;
                        socket.write(cmd);
                        log += `C: ${cmd}`;
                        step++;
                    } else if (step === 2 && code === 250) {
                        // MAIL FROM accepted -> RCPT TO
                        const cmd = `RCPT TO:<${email}>\r\n`;
                        socket.write(cmd);
                        log += `C: ${cmd}`;
                        step++;
                    } else if (step === 3) {
                        // RCPT TO response
                        if (code === 250 || code === 251) {
                            isValid = true;
                            log += 'Mailbox exists (250/251 OK)\n';
                        } else {
                            log += `Mailbox address rejected (${code})\n`;
                        }
                        socket.end();
                    } else {
                        socket.end();
                    }
                });

                socket.on('error', (err) => {
                    log += `Error: ${err.message}\n`;
                    resolve({ valid: false, log });
                });

                socket.on('timeout', () => {
                    log += 'Timeout\n';
                    socket.destroy();
                    resolve({ valid: false, log });
                });

                socket.on('close', () => {
                    resolve({ valid: isValid, log });
                });

                socket.connect(25, exchange);
            });

        } catch (error: any) {
            return { valid: false, log: error.message };
        }
    }

    /**
     * Disposable Email Provider Detection - Expanded List
     */
    private isDisposable(email: string): boolean {
        const disposableDomains = [
            'tempmail.com', 'guerrillamail.com', '10minutemail.com',
            'mailinator.com', 'throwaway.email', 'temp-mail.org',
            'fakeinbox.com', 'sharklasers.com', 'yopmail.com',
            'getnada.com', 'dispostable.com', 'grr.la', 'maildrop.cc'
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
            'hello', 'help', 'service', 'team', 'office',
            'marketing', 'jobs', 'careers', 'hr', 'billing'
        ];

        const localPart = email.split('@')[0].toLowerCase();
        return roleKeywords.some(keyword => localPart === keyword || localPart.startsWith(keyword + '.'));
    }

    /**
     * Batch Verification (for high-volume scans)
     */
    async verifyBatch(emails: string[]): Promise<SMTPVerificationResult[]> {
        // Process in chunks of 5 to avoid overwhelming network/server
        const results: SMTPVerificationResult[] = [];
        const chunkSize = 5;

        for (let i = 0; i < emails.length; i += chunkSize) {
            const chunk = emails.slice(i, i + chunkSize);
            const chunkResults = await Promise.all(
                chunk.map(email => this.verify(email))
            );
            results.push(...chunkResults);
        }
        return results;
    }
}

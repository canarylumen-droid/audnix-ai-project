import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, CheckCircle, Unlink, Mail, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Progress } from './ui/progress';
import { EmailFilterIntelligence } from './email-filter-intelligence';

interface EmailStatus {
  connected: boolean;
  email: string | null;
  provider: string;
}

interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  imapHost: string;
  imapPort: number;
  email: string;
  password: string;
}

export function EmailSetupUI() {
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<EmailConfig>({
    smtpHost: '',
    smtpPort: 587,
    imapHost: '',
    imapPort: 993,
    email: '',
    password: ''
  });
  const [connecting, setConnecting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState({ imported: 0, skipped: 0, errors: 0 });
  const [showSetup, setShowSetup] = useState(false);
  const [showFilterInfo, setShowFilterInfo] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/custom-email/status', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (!data.connected) {
          setShowSetup(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch email status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowFilterInfo = () => {
    if (!config.smtpHost || !config.imapHost || !config.email || !config.password) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    setShowFilterInfo(true);
  };

  const handleConnect = async () => {
    setConnecting(true);
    setImporting(true);
    setImportProgress(0);

    try {
      const res = await fetch('/api/custom-email/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          smtpHost: config.smtpHost,
          smtpPort: config.smtpPort,
          imapHost: config.imapHost,
          imapPort: config.imapPort,
          email: config.email,
          password: config.password
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Simulate progress for better UX
        for (let i = 0; i < 100; i += 10) {
          setImportProgress(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        setImportProgress(100);

        setImportStats({
          imported: data.leadsImported || 0,
          skipped: data.leadsSkipped || 0,
          errors: data.errors || 0
        });

        toast({
          title: 'Success!',
          description: `Email connected! ${data.leadsImported} contacts imported.`
        });

        setConfig({ smtpHost: '', smtpPort: 587, imapHost: '', imapPort: 993, email: '', password: '' });
        setShowFilterInfo(false);
        setShowSetup(false);
        await fetchStatus();
      } else {
        const error = await res.json();
        toast({ title: 'Error', description: error.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to connect email', variant: 'destructive' });
    } finally {
      setConnecting(false);
      setImporting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const res = await fetch('/api/custom-email/disconnect', {
        method: 'POST',
        credentials: 'include'
      });

      if (res.ok) {
        toast({ title: 'Success', description: 'Email disconnected' });
        await fetchStatus();
        setShowSetup(true);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to disconnect email', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Loading email settings...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Connected Status */}
      {status?.connected && !showSetup && (
        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Business Email Connected
              <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                ✅ {status.email}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Your campaigns will send from this email address
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                🔄 Auto-follow-ups active • 📊 Real-time tracking • ✉️ Multi-channel ready
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={handleDisconnect}
            >
              <Unlink className="w-4 h-4 mr-2" />
              Disconnect Email
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Setup Form */}
      {showSetup && (
        <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Connect Your Business Email
            </CardTitle>
            <CardDescription>
              Enter your SMTP settings. Contacts will be auto-imported and campaigns start immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Common Email Server Settings */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded p-3">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">
                💡 Common Business Email Server Settings:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <strong>Google Workspace:</strong>
                  <br />
                  SMTP: smtp.gmail.com:587
                  <br />
                  IMAP: imap.gmail.com:993
                </div>
                <div>
                  <strong>Microsoft 365:</strong>
                  <br />
                  SMTP: smtp.office365.com:587
                  <br />
                  IMAP: outlook.office365.com:993
                </div>
                <div>
                  <strong>Zoho Mail:</strong>
                  <br />
                  SMTP: smtp.zoho.com:587
                  <br />
                  IMAP: imap.zoho.com:993
                </div>
                <div>
                  <strong>Custom Domain:</strong>
                  <br />
                  Contact your email provider
                  <br />
                  for SMTP/IMAP settings
                </div>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <Input
                  type="email"
                  placeholder="your-email@company.com"
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password / App Password</label>
                <Input
                  type="password"
                  placeholder="Your email password or app-specific password"
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">SMTP Host (Sending)</label>
                  <Input
                    placeholder="smtp.gmail.com"
                    value={config.smtpHost}
                    onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SMTP Port</label>
                  <Input
                    type="number"
                    placeholder="587"
                    value={config.smtpPort}
                    onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) || 587 })}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">IMAP Host (Reading)</label>
                  <Input
                    placeholder="imap.gmail.com"
                    value={config.imapHost}
                    onChange={(e) => setConfig({ ...config, imapHost: e.target.value })}
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">IMAP Port</label>
                  <Input
                    type="number"
                    placeholder="993"
                    value={config.imapPort}
                    onChange={(e) => setConfig({ ...config, imapPort: parseInt(e.target.value) || 993 })}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Import Progress */}
            {importing && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded p-3 space-y-2">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  ⏳ Importing your contacts...
                </p>
                <Progress value={importProgress} className="h-2" />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {importProgress}% complete • This usually takes 30 seconds
                </p>
              </div>
            )}

            {/* Results */}
            {importStats.imported > 0 && (
              <div className="bg-green-500/5 border border-green-500/20 rounded p-3">
                <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                  ✅ Import Complete
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="font-bold text-lg text-green-600 dark:text-green-400">
                      {importStats.imported}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Imported</p>
                  </div>
                  <div>
                    <p className="font-bold text-lg text-amber-600 dark:text-amber-400">
                      {importStats.skipped}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Skipped</p>
                  </div>
                  <div>
                    <p className="font-bold text-lg text-red-600 dark:text-red-400">
                      {importStats.errors}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Errors</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleShowFilterInfo}
                disabled={connecting || importing}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              >
                {connecting || importing ? (
                  <>⏳ Connecting...</>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Connect & Import
                  </>
                )}
              </Button>
              {showSetup && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSetup(false);
                    setConfig({ smtpHost: '', smtpPort: 587, imapHost: '', imapPort: 993, email: '', password: '' });
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Banner */}
      <div className="bg-blue-500/5 border border-blue-500/30 rounded p-3 text-sm text-blue-700 dark:text-blue-400">
        <p>
          💡 <strong>Available to all users:</strong> Connect your business email (work@yourcompany.com) immediately after signup.
          No limits on email channel, no paid plan required. Your contacts will be auto-imported and campaigns start right away.
        </p>
      </div>

      {/* Filter Intelligence Modal */}
      {showFilterInfo && (
        <EmailFilterIntelligence
          onAcknowledge={handleConnect}
          isLoading={importing}
        />
      )}
    </div>
  );
}

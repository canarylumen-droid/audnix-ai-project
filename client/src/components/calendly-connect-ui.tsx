import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, CheckCircle, Unlink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CalendarStatus {
  calendly: { connected: boolean; accountType: string | null };
  google: { connected: boolean; accountType: string | null };
  primary: string | null;
  message: string;
}

export function CalendlyConnectUI() {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/calendar/status', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch calendar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectCalendly = async () => {
    if (!token.trim()) {
      toast({ title: 'Error', description: 'Please paste your Calendly API token', variant: 'destructive' });
      return;
    }

    setConnecting(true);
    try {
      const res = await fetch('/api/calendar/connect-calendly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ apiToken: token })
      });

      if (res.ok) {
        const data = await res.json();
        toast({ title: 'Success', description: data.message });
        setToken('');
        setShowTokenInput(false);
        await fetchStatus();
      } else {
        const error = await res.json();
        toast({ title: 'Error', description: error.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to connect Calendly', variant: 'destructive' });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectCalendly = async () => {
    try {
      const res = await fetch('/api/calendar/disconnect-calendly', {
        method: 'POST',
        credentials: 'include'
      });

      if (res.ok) {
        toast({ title: 'Success', description: 'Calendly disconnected' });
        await fetchStatus();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to disconnect Calendly', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading calendar status...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Calendly Status */}
      <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📅 Calendly</span>
            {status?.calendly.connected ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500" />
            )}
          </CardTitle>
          <CardDescription>
            {status?.calendly.connected ? 'Your Calendly is connected' : 'Connect your Calendly for booking meetings'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {status?.calendly.connected ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
              <p className="text-sm text-green-700 dark:text-green-400">
                ✅ Connected: {status.calendly.accountType}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Your meetings will be booked in your Calendly account
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-red-600 hover:text-red-700"
                onClick={handleDisconnectCalendly}
              >
                <Unlink className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get your API token in 2 minutes:
              </p>
              <ol className="text-sm space-y-2 ml-4 list-decimal text-gray-700 dark:text-gray-300">
                <li>Sign up free: <a href="https://calendly.com" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">calendly.com</a></li>
                <li>Settings → Integrations → API & Webhooks</li>
                <li>Create personal API token</li>
                <li>Copy and paste below</li>
              </ol>

              {!showTokenInput ? (
                <Button
                  onClick={() => setShowTokenInput(true)}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                >
                  Connect Calendly
                </Button>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="calendly_xxxxxxxxxxxxxxxxxxxxxxxx"
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleConnectCalendly}
                      disabled={connecting}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {connecting ? 'Validating...' : 'Verify & Connect'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowTokenInput(false);
                        setToken('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Calendar Status */}
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📆 Google Calendar</span>
            {status?.google.connected ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-gray-400" />
            )}
          </CardTitle>
          <CardDescription>
            {status?.google.connected ? 'Backup booking method' : 'Optional - Calendly is recommended'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status?.google.connected ? (
            <p className="text-sm text-green-700 dark:text-green-400">
              ✅ {status.google.accountType}
            </p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Not connected (Calendly is your primary option)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <div className="bg-blue-500/5 border border-blue-500/30 rounded p-3 text-sm text-blue-700 dark:text-blue-400">
        <p>💡 <strong>Pro tip:</strong> Calendly syncs with Google Calendar automatically. If you use Google Calendar, Calendly will respect those busy times!</p>
      </div>
    </div>
  );
}

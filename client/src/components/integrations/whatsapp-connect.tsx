import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, QrCode } from 'lucide-react';

export function WhatsAppConnect() {
  const [status, setStatus] = useState<'disconnected' | 'qr_ready' | 'authenticated' | 'ready'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);

        if (data.status === 'qr_ready') {
          const qrResponse = await fetch('/api/whatsapp/qr');
          if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            setQrCode(qrData.qrCode);
          }
        } else {
          setQrCode(null);
        }
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: 'Connection initiated',
          description: 'Please scan the QR code with your WhatsApp app',
        });

        setTimeout(() => {
          checkStatus();
        }, 2000);
      } else {
        throw new Error('Failed to connect');
      }
    } catch (error) {
      toast({
        title: 'Connection failed',
        description: 'Could not initiate WhatsApp connection',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setStatus('disconnected');
        setQrCode(null);
        toast({
          title: 'Disconnected',
          description: 'WhatsApp has been disconnected',
        });
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      toast({
        title: 'Disconnection failed',
        description: 'Could not disconnect WhatsApp',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'disconnected':
        return {
          icon: <XCircle className="h-5 w-5 text-gray-400" />,
          text: 'Disconnected',
          color: 'text-gray-600',
        };
      case 'qr_ready':
        return {
          icon: <QrCode className="h-5 w-5 text-blue-500" />,
          text: 'Scan QR Code',
          color: 'text-blue-600',
        };
      case 'authenticated':
        return {
          icon: <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />,
          text: 'Authenticating...',
          color: 'text-yellow-600',
        };
      case 'ready':
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          text: 'Connected',
          color: 'text-green-600',
        };
      default:
        return {
          icon: <XCircle className="h-5 w-5 text-gray-400" />,
          text: 'Unknown',
          color: 'text-gray-600',
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  // WhatsApp Web.js only supports QR code authentication
  // No OTP/phone number flow available

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="h-6 w-6 text-green-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          WhatsApp Business
          <span className="ml-auto text-xs text-muted-foreground">🔒 Your credentials are never saved</span>
        </CardTitle>
        <CardDescription>
          WhatsApp sends OTP directly to your phone • End-to-end encrypted
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Security Banner */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div className="text-xs space-y-1">
              <p className="font-semibold text-blue-800 dark:text-blue-300">🔐 Advanced Security</p>
              <p className="text-blue-700 dark:text-blue-400">• Your credentials are discarded immediately after connection</p>
              <p className="text-blue-700 dark:text-blue-400">• All conversations are end-to-end encrypted</p>
              <p className="text-blue-700 dark:text-blue-400">• Messages never leave your secure connection</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {statusDisplay.icon}
            <span className={`font-medium ${statusDisplay.color}`}>
              {statusDisplay.text}
            </span>
          </div>
          {status === 'ready' ? (
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disconnect'}
            </Button>
          ) : status === 'qr_ready' || status === 'authenticated' ? (
            <Button variant="outline" disabled>
              Waiting...
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connect WhatsApp'}
            </Button>
          )}
        </div>

        {qrCode && (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-primary/50">
            <div className="text-center space-y-4">
              <p className="text-sm font-medium">Scan this QR code with WhatsApp</p>
              <div className="flex justify-center">
                <img
                  src={qrCode}
                  alt="WhatsApp QR Code"
                  className="w-64 h-64"
                />
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>📱 Open WhatsApp on your phone</p>
                <p>⚙️ Tap Menu or Settings and select Linked Devices</p>
                <p>📸 Tap Link a Device and scan this QR code</p>
              </div>
            </div>
          </div>
        )}

        {status === 'disconnected' && !qrCode && (
          <div className="space-y-4">
            {/* QR Code Method */}
            {!qrCode && (
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Click below to generate a QR code for WhatsApp Web
                </p>
                <Button
                  onClick={handleConnect}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <QrCode className="h-4 w-4 mr-2" />}
                  Generate QR Code
                </Button>
              </div>
            )}
          </div>
        )}

        {status === 'ready' && (
          <div className="space-y-3">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                  Connected • Importing leads...
                </p>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                Your WhatsApp conversations are being securely imported. AI will start working automatically.
              </p>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-amber-50 dark:bg-amber-950/20 rounded">
          <p className="font-semibold text-amber-800 dark:text-amber-400">⚠️ Important Notes:</p>
          <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-300">
            <li>Use a dedicated phone number (not your personal WhatsApp)</li>
            <li>Don't spam messages - respect WhatsApp's limits</li>
            <li>Your phone must stay connected to the internet</li>
            <li>Session stays active until you disconnect</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
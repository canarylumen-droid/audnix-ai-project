import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface PendingPayment {
  id: string;
  email: string;
  name: string;
  plan: string;
  amount: number;
  pendingDate: string;
}

export default function PaymentApprovalsPage() {
  const [pending, setPending] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoApproving, setAutoApproving] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const response = await fetch("/api/payment-approval/pending");
        if (response.ok) {
          const data = await response.json();
          setPending(data.pending || []);
        }
      } catch (error) {
        console.error("Error fetching pending approvals:", error);
        toast({
          title: "Error",
          description: "Failed to load pending approvals",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
    // Refresh every 5 seconds to catch new payments
    const interval = setInterval(fetchPending, 5000);
    return () => clearInterval(interval);
  }, []);

  const approvePayment = async (userId: string) => {
    setAutoApproving((prev) => ({ ...prev, [userId]: true }));

    try {
      const response = await fetch(`/api/payment-approval/approve/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Auto-approved from admin dashboard" }),
      });

      if (response.ok) {
        // Remove from pending list
        setPending((prev) => prev.filter((p) => p.id !== userId));
        toast({
          title: "Approved ✅",
          description: "User has been upgraded",
        });
      } else {
        throw new Error("Failed to approve");
      }
    } catch (error) {
      console.error("Error approving payment:", error);
      toast({
        title: "Error",
        description: "Failed to approve payment",
        variant: "destructive",
      });
    } finally {
      setAutoApproving((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const rejectPayment = async (userId: string) => {
    try {
      const response = await fetch(`/api/payment-approval/reject/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Admin rejected from dashboard" }),
      });

      if (response.ok) {
        setPending((prev) => prev.filter((p) => p.id !== userId));
        toast({
          title: "Rejected",
          description: "Payment has been rejected",
        });
      } else {
        throw new Error("Failed to reject");
      }
    } catch (error) {
      console.error("Error rejecting payment:", error);
      toast({
        title: "Error",
        description: "Failed to reject payment",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Payment Approvals</h1>
        <p className="text-gray-400 mt-2">Auto-approve pending payments or review manually</p>
      </div>

      {pending.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6 text-center text-gray-400">
            No pending approvals at this time.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pending.map((payment) => (
            <Card key={payment.id} className="bg-slate-800/50 border-cyan-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white">{payment.name}</CardTitle>
                    <CardDescription>{payment.email}</CardDescription>
                  </div>
                  <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm font-semibold capitalize">
                    {payment.plan}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white font-semibold">${payment.amount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Paid:</span>
                    <span className="text-white">{new Date(payment.pendingDate).toLocaleString()}</span>
                  </div>

                  {/* Auto-approve button with 5-second countdown */}
                  <AutoApproveButton
                    userId={payment.id}
                    onApprove={() => approvePayment(payment.id)}
                    isApproving={autoApproving[payment.id] || false}
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rejectPayment(payment.id)}
                    className="w-full mt-2"
                    disabled={autoApproving[payment.id]}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AutoApproveButton({
  userId,
  onApprove,
  isApproving,
}: {
  userId: string;
  onApprove: () => void;
  isApproving: boolean;
}) {
  const [countdown, setCountdown] = useState(5);
  const [autoApproved, setAutoApproved] = useState(false);

  useEffect(() => {
    if (isApproving) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !autoApproved) {
      setAutoApproved(true);
      onApprove();
    }
  }, [countdown, isApproving, autoApproved, onApprove]);

  if (isApproving || autoApproved) {
    return (
      <Button disabled className="w-full bg-green-500/20 text-green-300 cursor-not-allowed">
        ✅ Approved
      </Button>
    );
  }

  return (
    <Button
      onClick={onApprove}
      className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
      disabled={countdown > 0}
    >
      {countdown > 0 ? `Auto-approve in ${countdown}s` : "Approve"}
    </Button>
  );
}

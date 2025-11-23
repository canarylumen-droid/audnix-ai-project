import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "wouter";
import { Button } from "@/components/ui/button";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [marked, setMarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    const markPaymentPending = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const planParam = params.get("plan") || "starter";
        const amountParam = parseInt(params.get("amount") || "49");

        setPlan(planParam);
        setAmount(amountParam);

        // Get user ID (from session)
        const userRes = await fetch("/api/user");
        const userData = await userRes.json();
        const userId = userData.id;

        // Mark as pending approval
        const response = await fetch(`/api/payment-approval/mark-pending/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: planParam,
            amount: amountParam,
          }),
        });

        if (response.ok) {
          setMarked(true);
        }
      } catch (error) {
        console.error("Error marking payment:", error);
      } finally {
        setLoading(false);
      }
    };

    markPaymentPending();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Processing payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/50 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-xl text-center">
        {marked ? (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Payment Successful! ✅</h1>
              <p className="text-cyan-300 mb-1">Plan: <span className="font-semibold capitalize">{plan}</span></p>
              <p className="text-cyan-300">Amount: <span className="font-semibold">${amount}</span></p>
            </div>

            <div className="bg-slate-700/50 border border-cyan-500/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-300 mb-2">⏳ Pending Admin Approval</p>
              <p className="text-xs text-gray-400">Your payment has been recorded. The admin will approve your access within seconds.</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                Admin dashboard will auto-approve in moments. You'll be upgraded automatically.
              </p>
              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
              >
                Go to Dashboard
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Error Recording Payment</h1>
              <p className="text-red-300">Could not mark payment as pending.</p>
            </div>

            <Button
              onClick={() => navigate("/dashboard")}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
            >
              Return to Dashboard
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

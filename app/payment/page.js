// app/payment/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import app from "../../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = getAuth(app);

  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const planKey = searchParams.get("plan") || "";
  const planTitle = searchParams.get("title") || "";
  const amount = Number(searchParams.get("amount") || 0);
  const tranRef = searchParams.get("tranRef"); // PayTabs return param

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.replace(`/?redirect=payment&plan=${encodeURIComponent(planKey)}`);
      } else {
        setUser(u);
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If PayTabs redirected back with tranRef → verify
  useEffect(() => {
    const doVerify = async () => {
      if (!tranRef) return;
      setVerifying(true);
      setError("");
      try {
        const res = await fetch(`/api/verify-payment?tranRef=${encodeURIComponent(tranRef)}`);
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json?.message || "Verification failed");
        }

        alert("✅ Payment verified! Please sign in again.");
        router.replace("/?payment=success");
      } catch (e) {
        setError(e.message || "Verification failed");
      } finally {
        setVerifying(false);
      }
    };
    doVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tranRef]);

  const startPayment = async () => {
    if (!user) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey,
          planTitle,
          amount,
          uid: user.uid,
          email: user.email,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.payment_url) {
        throw new Error(json?.message || "Could not create payment");
      }

      // Redirect user to PayTabs payment page
      window.location.href = json.payment_url;
    } catch (e) {
      setError(e.message || "Payment init failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Redirecting to sign in…
      </div>
    );
  }

  if (tranRef) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        {verifying ? "Verifying your payment…" : error ? `Error: ${error}` : "Done"}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center px-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-lg border border-white/20">
        <h1 className="text-2xl font-bold mb-4">Confirm Your Purchase</h1>
        <div className="bg-black/30 rounded-xl p-4 mb-6">
          <p className="text-white/90"><strong>Plan:</strong> {planTitle || planKey}</p>
          <p className="text-white/90"><strong>Amount:</strong> ${amount.toFixed(2)} USD</p>
          <p className="text-white/70 mt-2">You’ll be redirected to PayTabs to complete the secure payment.</p>
        </div>

        {error && (
          <div className="bg-red-500/80 text-white text-sm p-2 rounded mb-4">
            {error}
          </div>
        )}

        <button
          onClick={startPayment}
          disabled={submitting}
          className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-semibold"
        >
          {submitting ? "Redirecting…" : "Pay Now"}
        </button>

        <button
          onClick={() => router.push("/billing")}
          className="w-full py-3 rounded-lg border border-gray-600 hover:border-indigo-400 hover:text-indigo-400 transition font-semibold mt-3"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

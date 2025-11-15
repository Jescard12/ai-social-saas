"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function PendingPage() {
  const router = useRouter();
  const search = useSearchParams();

  const [email, setEmail] = useState("");
  const [loadingText, setLoadingText] = useState("Checking your payment status...");

  useEffect(() => {
    let interval;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/?mode=signin");
        return;
      }

      setEmail(u.email || "");
      const userRef = doc(db, "users", u.uid);

      // Poll Firestore every 5 seconds
      interval = setInterval(async () => {
        try {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const { status } = snap.data();
            if (status === "approved" || status === "trial") {
              clearInterval(interval);
              router.push("/dashboard");
            } else if (status === "expired") {
              clearInterval(interval);
              router.push("/billing");
            }
          }
        } catch (err) {
          console.error("Error checking payment:", err);
        }
      }, 5000);
    });

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [router]);

  const paymentId = search.get("paymentId");

  // Animated dots for “Checking status…”
  useEffect(() => {
    const dots = [".", "..", "..."];
    let i = 0;
    const interval = setInterval(() => {
      setLoadingText(`Checking your payment status${dots[i % dots.length]}`);
      i++;
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0f1f] via-[#1a1f3b] to-[#2a0f3f] text-white px-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg p-10 w-full max-w-md text-center border border-white/10 animate-fade-in">
        <div className="flex flex-col items-center justify-center space-y-5">
          {/* Spinner */}
          <div className="w-14 h-14 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>

          <h1 className="text-2xl font-extrabold tracking-tight">Payment Under Review</h1>
          <p className="text-white/80">
            Thanks {email ? <span className="font-semibold text-indigo-400">({email})</span> : ""}! <br />
            We’ve received your payment reference
            {paymentId ? <span className="font-semibold text-indigo-400"> #{paymentId}</span> : ""}.
          </p>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Once verified, your account will be activated automatically.
          </p>
          <p className="text-indigo-300 font-medium animate-pulse mt-3">{loadingText}</p>
        </div>
      </div>
    </div>
  );
}

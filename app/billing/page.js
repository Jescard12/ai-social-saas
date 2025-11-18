"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [manualEmail, setManualEmail] = useState("");

  const plans = [
    {
      title: "3-Day Free Trial",
      price: "$0",
      duration: "for 3 days",
      features: ["Access to AI chats", "Basic strategies", "Social media content"],
      type: "trial",
      amount: 0,
      code: "trial",
    },
    {
      title: "Weekly Plan",
      price: "$5",
      duration: "per week",
      features: ["Unlimited AI chats", "Full strategies", "Advanced content tools"],
      type: "paid",
      amount: 5,
      code: "weekly",
    },
    {
      title: "1 Month",
      price: "$15",
      duration: "per month",
      features: ["Unlimited AI chats", "Full strategies", "Advanced content tools"],
      type: "paid",
      amount: 15,
      code: "monthly",
    },
    {
      title: "3 Months",
      price: "$40",
      duration: "every 3 months",
      features: ["Unlimited AI chats", "Full strategies", "Advanced content tools"],
      type: "paid",
      amount: 40,
      code: "quarterly",
    },
    {
      title: "6 Months",
      price: "$70",
      duration: "every 6 months",
      features: ["Unlimited AI chats", "Full strategies", "Advanced content tools"],
      type: "paid",
      amount: 70,
      code: "semiannual",
    },
    {
      title: "1 Year",
      price: "$120",
      duration: "per year",
      features: ["Unlimited AI chats", "Full strategies", "Advanced content tools"],
      type: "paid",
      amount: 120,
      code: "yearly",
    },
  ];

  // ---- AUTH + FETCH USER ----
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/?mode=signin");
        return;
      }

      setUser(u);

      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) setUserData(snap.data());
      } catch (err) {
        console.error("Error loading user:", err);
      }

      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  // ---- START TRIAL ----
  const startTrial = async () => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists() && snap.data().trialUsed) {
      alert("⚠️ You have already used your free trial.");
      return;
    }

    const startDate = Timestamp.now();
    const endDate = Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));

    const data = {
      uid: user.uid,
      email: user.email,
      status: "trial",
      plan: "trial",
      paid: false,
      startDate,
      endDate,
      trialStart: startDate,
      trialEnd: endDate,
      trialMessagesSent: 0,
      trialUsed: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (!snap.exists()) await setDoc(userRef, data);
    else await updateDoc(userRef, data);

    alert("✅ Your 3-day free trial has started!");
    router.push("/dashboard");
  };

  // ---- MANUAL PAYMENT ----
  const submitManualPayment = async () => {
    if (!user || !selectedPlan || !manualEmail.trim()) {
      alert("⚠️ Please fill all required fields.");
      return;
    }

    const startDate = Timestamp.now();
    let endDate;

    const addMonths = (months) => new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);

    switch (selectedPlan.code) {
      case "weekly":
        endDate = Timestamp.fromDate(addMonths(0.25));
        break;
      case "monthly":
        endDate = Timestamp.fromDate(addMonths(1));
        break;
      case "quarterly":
        endDate = Timestamp.fromDate(addMonths(3));
        break;
      case "semiannual":
        endDate = Timestamp.fromDate(addMonths(6));
        break;
      case "yearly":
        endDate = Timestamp.fromDate(addMonths(12));
        break;
      default:
        endDate = null;
    }

    try {
      const paymentRef = await addDoc(collection(db, "payments"), {
        userId: user.uid,
        email: manualEmail.trim(),
        plan: selectedPlan.code,
        amount: selectedPlan.amount,
        method: "manual",
        status: "pending",
        startDate,
        endDate,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "users", user.uid), {
        status: "pending",
        requestedPlan: selectedPlan.code,
        startDate,
        endDate,
        updatedAt: serverTimestamp(),
      });

      alert("✅ Payment request submitted! We&apos;ll contact you shortly.");
      router.push(`/pending?paymentId=${paymentRef.id}`);
    } catch (err) {
      console.error("Payment submission error:", err);
      alert("❌ Something went wrong while submitting payment.");
    }
  };

  const handleSelect = async (plan) => {
    if (plan.type === "trial") {
      await startTrial();
    } else {
      setSelectedPlan(plan);
      document.getElementById("manual-payment-form")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading)
    return (
      <div className="text-center text-white py-20 bg-gradient-to-br from-[#0a0f1f] via-[#1a1f3b] to-[#2a0f3f]">
        Loading your plans...
      </div>
    );

  // ---- UI ----
  return (
    <div className="bg-gradient-to-br from-[#0a0f1f] via-[#1a1f3b] to-[#2a0f3f] text-white min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-10 py-6">
        <h1
          onClick={() => router.push("/landing")}
          className="text-2xl font-extrabold cursor-pointer hover:opacity-80 transition duration-200"
        >
          Buz<span className="text-indigo-500">AI</span>
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-gray-300 text-sm hidden md:inline">{user?.email}</span>
          <button
            onClick={async () => {
              await signOut(auth);
              router.push("/auth");
            }}
            className="px-5 py-2 rounded-full bg-white/10 hover:bg-gradient-to-r hover:from-red-500 hover:to-orange-500 transition-all duration-300 font-semibold border border-white/20 hover:border-transparent hover:scale-105"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Plans Section */}
      <section className="text-center mt-10 px-6">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-3">Choose Your Plan</h2>
        <p className="text-lg text-gray-300">Start with a free trial or upgrade anytime.</p>
      </section>

      <section className="mt-10 px-10 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-10">
          {plans
            .filter(
              (p) =>
                !(
                  p.type === "trial" &&
                  (userData?.trialUsed || userData?.plan === "paid" || userData?.status === "approved")
                )
            )
            .map((plan, i) => (
              <div
                key={i}
                className="bg-white/10 border border-white/10 p-8 rounded-2xl shadow-lg hover:shadow-indigo-500/30 transition duration-300 flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-2xl font-semibold mb-2">{plan.title}</h3>
                  <p className="text-4xl font-extrabold">
                    {plan.price}{" "}
                    <span className="text-lg font-normal text-gray-300">{plan.duration}</span>
                  </p>
                  <ul className="mt-6 space-y-2 text-gray-300 text-sm">
                    {plan.features.map((f, j) => (
                      <li key={j}>✔ {f}</li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => handleSelect(plan)}
                  className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-500 transition duration-200"
                >
                  {plan.type === "trial" ? "Start Free Trial" : "Select"}
                </button>
              </div>
            ))}
        </div>
      </section>

      {/* Manual Payment */}
      <section id="manual-payment-form" className="mt-16 px-10 max-w-3xl mx-auto w-full">
        <div className="bg-white/10 border border-white/10 rounded-2xl p-6">
          <h3 className="text-2xl font-bold mb-2">Submit Payment Request</h3>
          <p className="text-gray-300 mb-4">
            Contact us on WhatsApp first, then submit your payment details below.
          </p>

          {/* Important Notice */}
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 text-sm text-yellow-200 mb-6">
            <p className="font-bold text-lg mb-2">⚠️ IMPORTANT:</p>
            <p className="mb-2">You MUST contact us on WhatsApp before submitting your payment request.</p>
            <p className="font-semibold">📱 WhatsApp: +961 81 719 919</p>
            <p className="text-xs mt-2">We&apos;ll guide you through the payment process and confirm your plan activation.</p>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Sign-up Email</label>
              <input
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="Your sign-up email"
                className="w-full p-3 rounded-lg bg-white text-black"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Selected Plan</label>
              <input
                disabled
                value={
                  selectedPlan
                    ? `${selectedPlan.title} (${selectedPlan.amount === 0 ? "$0" : `$${selectedPlan.amount}`})`
                    : "Choose a plan above"
                }
                className="w-full p-3 rounded-lg bg-white text-black"
              />
            </div>

            <button
              onClick={submitManualPayment}
              disabled={!selectedPlan || selectedPlan?.type !== "paid"}
              className="px-6 py-3 rounded-full bg-green-600 disabled:bg-gray-600 text-white font-semibold hover:bg-green-500 transition duration-200"
            >
              Submit Request
            </button>
          </div>
        </div>
      </section>

      <footer className="mt-16 py-10 text-center border-t border-white/10">
        <p className="text-gray-400">© {new Date().getFullYear()} BuzAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
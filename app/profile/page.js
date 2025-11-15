"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [chatCount, setChatCount] = useState(0);
  const [planData, setPlanData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/");
        return;
      }

      setUser(currentUser);
      setAuthLoading(false);

      try {
        // Fetch number of chats
        const q = query(collection(db, "chats"), where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        setChatCount(querySnapshot.size);

        // Fetch user plan
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();

          // Auto-correct if approved but plan not updated
          if (data.status === "approved" && data.requestedPlan && !data.plan) {
            data.plan = data.requestedPlan;
          }

          setPlanData(data);
        } else {
          console.warn("User document not found.");
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const goBackToDashboard = () => {
    router.push("/dashboard");
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0f1f] via-[#1a1f3b] to-[#2a0f3f] text-white">
        <p className="text-lg animate-pulse">Loading your profile...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0f1f] via-[#1a1f3b] to-[#2a0f3f] p-6">
      <div className="bg-gradient-to-br from-indigo-900/30 to-blue-900/20 backdrop-blur-lg rounded-2xl shadow-xl p-8 w-full max-w-md text-center text-white border border-indigo-500/20">
        {/* Avatar */}
        <div className="flex justify-center mb-5">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center text-4xl font-bold shadow-lg">
            {user?.email ? user.email.charAt(0).toUpperCase() : "?"}
          </div>
        </div>

        <h1 className="text-2xl font-extrabold mb-4">Your Profile</h1>

        <div className="space-y-2 text-white/90 mb-6">
          <p>
            <strong>Email:</strong> {user.email || "N/A"}
          </p>
          
          <p>
            <strong>Total Chats:</strong> {chatCount}
          </p>
        </div>

        {/* Subscription Info - DIFFERENT BACKGROUND COLOR */}
        {planData ? (
          <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/30 p-5 rounded-xl mb-6 text-left space-y-2 border border-purple-500/20 backdrop-blur-md">
            <p className="flex justify-between">
              <strong>Plan:</strong> 
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {planData.plan || "N/A"}
              </span>
            </p>
            <p className="flex justify-between">
              <strong>Status:</strong> 
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                planData.status === "approved" 
                  ? "bg-green-500/20 text-green-300 border border-green-500/30" 
                  : planData.status === "trial"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
              }`}>
                {planData.status || "N/A"}
              </span>
            </p>
            <p>
              <strong>Start Date:</strong>{" "}
              {planData.startDate
                ? new Date(
                    planData.startDate.seconds
                      ? planData.startDate.seconds * 1000
                      : planData.startDate
                  ).toLocaleDateString()
                : "N/A"}
            </p>
            <p>
              <strong>End Date:</strong>{" "}
              {planData.endDate
                ? new Date(
                    planData.endDate.seconds
                      ? planData.endDate.seconds * 1000
                      : planData.endDate
                  ).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-red-900/30 to-orange-900/20 p-5 rounded-xl mb-6 text-center border border-red-500/20 backdrop-blur-md">
            <p className="text-red-300 font-semibold">⚠️ No active plan found</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={goBackToDashboard}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 px-5 py-2.5 rounded-full font-semibold transition shadow-lg transform hover:scale-105 duration-200"
          >
            Back to Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 px-5 py-2.5 rounded-full font-semibold transition shadow-lg transform hover:scale-105 duration-200"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
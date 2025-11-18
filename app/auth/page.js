"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import firebaseApp, { auth, db } from "@/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  // ✅ we already have initialized auth & db from firebase.js, no need for getAuth/getFirestore

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (isSignUp) {
        // ✅ Sign up new user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const uid = userCredential.user.uid;

        const trialStart = Timestamp.now();
        const trialEnd = Timestamp.fromDate(
          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        );

        await setDoc(doc(db, "users", uid), {
          uid,
          email,
          plan: "trial",
          trialStart,
          trialEnd,
          trialMessagesSent: 0,
          paid: false,
        });
      } else {
        // ✅ Sign in existing user
        await signInWithEmailAndPassword(auth, email, password);
      }

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Try again.");
    }
  };

  // ✅ Handle forgot password
  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to send reset email.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute w-72 h-72 bg-purple-500/30 rounded-full blur-3xl top-[-50px] left-[-50px] animate-pulse"></div>
      <div className="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl bottom-[-100px] right-[-100px] animate-pulse"></div>

      <div className="relative z-10 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <h1 className="text-3xl font-bold text-white text-center mb-6">
          {isSignUp ? "Create Your Account" : "Welcome Back"}
        </h1>
        <p className="text-gray-200 text-center mb-8 text-sm">
          AI-powered tools to build and grow your business.
        </p>

        {error && (
          <div className="bg-red-500 text-white p-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-500 text-white p-2 rounded mb-4 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg border border-white/30 bg-white/90 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-lg border border-white/30 bg-white/90 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!isSignUp}
          />
          <button
            type="submit"
            className="w-full p-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold shadow-lg hover:scale-[1.02] transition-transform duration-200"
          >
            {isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        {!isSignUp && (
          <p className="text-center text-gray-300 mt-4">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-red-400 hover:underline"
            >
              Forgot Password?
            </button>
          </p>
        )}

        <p className="text-center text-gray-300 mt-6">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-400 hover:underline"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>

        <p className="text-center text-gray-300 mt-4">
          <button
            type="button"
            onClick={() => router.push("/landing")}
            className="text-indigo-400 hover:underline"
          >
            Back to Landing Page
          </button>
        </p>
      </div>
    </div>
  );
}

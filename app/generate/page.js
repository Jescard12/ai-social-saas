"use client";

import { useState, useEffect, useRef } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDAw5zBgF7JlxIOcmBj1vsAjY1sSbVY6DY",
  authDomain: "ai-social-saas-1de62.firebaseapp.com",
  projectId: "ai-social-saas-1de62",
  storageBucket: "ai-social-saas-1de62.appspot.com",
  messagingSenderId: "826184746431",
  appId: "1:826184746431:web:97eb40e0e33bc70161cd0a",
};

// ✅ Initialize Firebase once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export default function GeneratePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages]);

  // ✅ Check user authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        return;
      }

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
          alert("⚠️ User not found. Please contact support.");
          setUser(null);
          return;
        }

        const data = userSnap.data();
        const now = new Date();
        const trialEndDate = data.trialEnd?.toDate
          ? data.trialEnd.toDate()
          : data.trialEnd
          ? new Date(data.trialEnd)
          : null;
        const planEndDate = data.endDate?.toDate
          ? data.endDate.toDate()
          : data.endDate
          ? new Date(data.endDate)
          : null;

        if (data.status === "trial" && trialEndDate && trialEndDate <= now) {
          alert("⏳ Your trial has ended. Please upgrade.");
          setUser(null);
          return;
        }

        if (data.status === "approved" && planEndDate && planEndDate <= now) {
          alert("💳 Subscription expired. Please renew.");
          setUser(null);
          return;
        }

        if (data.status === "pending") {
          alert("🕓 Payment still pending approval.");
          setUser(null);
          return;
        }

        setUser(currentUser);
      } catch (err) {
        console.error("Auth check error:", err);
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Send message
  const handleSend = async () => {
    if (!input.trim() || !user) return;
    setLoading(true);

    try {
      const token = await user.getIdToken();

      // ✅ Include previous messages for memory
      const payload = {
        prompt: input.trim(),
        messages: messages,
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "user", content: input },
          { role: "assistant", content: data.result },
        ]);
        setInput("");
      } else {
        alert(data.error || "Failed to generate response.");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("❌ Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div style={{ padding: 20, color: "white" }}>Please sign in to chat with Buz AI.</div>;
  }

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 700,
        margin: "0 auto",
        color: "white",
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #0a0f1f, #1a1f3b, #2a0f3f)",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: "bold", textAlign: "center" }}>Buz AI Chat</h1>

      {/* Chat window */}
      <div
        style={{
          border: "1px solid #333",
          borderRadius: 8,
          padding: 10,
          height: 400,
          overflowY: "auto",
          backgroundColor: "#111",
          marginBottom: 10,
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <strong>{msg.role === "user" ? "You" : "Buz AI"}:</strong> {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <textarea
        rows={3}
        style={{ width: "100%", padding: 10, borderRadius: 5 }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
      />

      <button
        onClick={handleSend}
        disabled={loading}
        style={{
          marginTop: 10,
          padding: "10px 20px",
          borderRadius: 5,
          backgroundColor: "#4f46e5",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
          width: "100%",
        }}
      >
        {loading ? "Generating..." : "Send"}
      </button>
    </div>
  );
}
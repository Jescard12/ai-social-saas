import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth, db } from "@/firebase";
import { verifyIdToken } from "firebase/auth";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy 
} from "firebase/firestore";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ POST handler
export async function POST(request) {
  try {
    // 1️⃣ Verify Firebase user (using client SDK)
    const authHeader = request.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "").trim();
    
    // Verify token using Firebase client SDK
    let userId;
    try {
      // For client SDK, we need to use the token directly in frontend
      // Since this is server-side, we'll trust the token for now
      // In production, you might want to use a different auth approach
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: token }),
      });
      
      const data = await response.json();
      if (data.users && data.users[0]) {
        userId = data.users[0].localId;
      } else {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
    } catch (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2️⃣ Parse JSON safely
    let bodyText = await request.text();
    let body = {};
    try {
      body = JSON.parse(bodyText);
    } catch (err) {
      console.error("⚠️ Invalid JSON:", err);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { prompt, chatId } = body;
    if (!prompt || !chatId)
      return NextResponse.json({ error: "Missing prompt or chatId" }, { status: 400 });

    console.log(`💬 Prompt received: ${prompt} 📁 Chat: ${chatId}`);

    // 🔐 CHECK TRIAL MESSAGE LIMIT (Backend enforcement)
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Check if user is on trial
      if (userData.status === "trial") {
        const today = new Date().toISOString().split("T")[0];
        const chatsToday = userData.chatsToday || 0;
        const lastChatDate = userData.lastChatDate || "";
        const trialMessagesSent = userData.trialMessagesSent || 0;
        
        // Reset counter if new day
        let newChatsToday = chatsToday;
        if (lastChatDate !== today) {
          newChatsToday = 0;
        }
        
        // Check daily limit (10 messages)
        if (newChatsToday >= 10) {
          return NextResponse.json({ 
            error: "🚫 Daily Message Limit Reached\n\nYou've used all 10 messages for today. This limit resets at midnight.\n\n💡 Upgrade to our paid plan for unlimited messages and advanced features!" 
          }, { status: 429 });
        }
        
        // Check total trial limit (30 messages over 3 days)
        if (trialMessagesSent >= 30) {
          return NextResponse.json({ 
            error: "🎯 Trial Period Completed\n\nYou've used all 30 messages included in your free trial.\n\n🚀 Upgrade now to continue using BuzAI with:\n• Unlimited messages\n• Priority support\n• Advanced features\n• No restrictions" 
          }, { status: 429 });
        }
        
        // Update counters
        await updateDoc(userRef, {
          chatsToday: newChatsToday + 1,
          trialMessagesSent: trialMessagesSent + 1,
          lastChatDate: today,
          updatedAt: new Date()
        });
        
        console.log(`📊 Trial user usage: ${newChatsToday + 1}/10 today, ${trialMessagesSent + 1}/30 total`);
      }
    }

    // 3️⃣ Load chat memory
    const messagesRef = collection(db, `chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    const memory = snap.docs.map((d) => ({
      role: d.data().role,
      content: d.data().text || "",
    }));

    // 4️⃣ Fetch file content (if any)
    const chatDoc = await getDoc(doc(db, "chats", chatId));
    let fileContent = chatDoc.exists() ? chatDoc.data().fileContent : "";
    let fileName = chatDoc.exists() ? chatDoc.data().fileName : "";

    if (fileContent) {
      console.log(`📄 Loaded file content from Firestore (${fileName || "unknown file"})`);
    }

    // 5️⃣ Build messages for AI
    const systemMessage = {
      role: "system",
      content:
        "You are Buz AI, a professional business strategist and marketing assistant. " +
        "You help entrepreneurs plan, analyze, and build ideas clearly. " +
        "If the user uploaded a file, use its content for context. Be precise, insightful, and strategic.",
    };

    const userPrompt = fileContent
      ? `User prompt: "${prompt}"\n\n📄 File content:\n${fileContent.slice(0, 5000)}`
      : prompt;

    const messagesForAI = [
      systemMessage,
      ...memory.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userPrompt },
    ];

    // 6️⃣ Generate response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messagesForAI,
      temperature: 0.8,
      max_tokens: 2000,
    });

    const result = completion.choices[0]?.message?.content?.trim() || "No response generated.";

    // 7️⃣ Save AI reply
    await addDoc(collection(db, `chats/${chatId}/messages`), {
      role: "assistant",
      text: result,
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("🔥 /api/generate error:", error);
    return NextResponse.json({ error: "Internal Server Error. Please try again." }, { status: 500 });
  }
}
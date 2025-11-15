import { NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/firebase";
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

// 🔍 ADD THIS CHECK - Right after OpenAI initialization
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is missing from environment variables");
}

// ✅ POST handler
export async function POST(request) {
  try {
    // 1️⃣ SIMPLIFIED TOKEN VERIFICATION (gets you unblocked)
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // Simple token decode (without complex verification)
    let userId;
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        userId = payload.user_id;
      }
    } catch (error) {
      console.error("Token decode error:", error);
    }

    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 🔍 ADD CONNECTION TESTS - Right here
    console.log("🔍 Testing connections...");
    
    // Test OpenAI connection
    try {
      // Simple test - list models to verify API key
      await openai.models.list();
      console.log("✅ OpenAI API connection successful");
    } catch (error) {
      console.error("❌ OpenAI API connection failed:", error.message);
      return NextResponse.json({ 
        error: "OpenAI API configuration error: " + error.message 
      }, { status: 500 });
    }

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

    console.log("🤖 Sending request to OpenAI...");
    
    // 6️⃣ Generate response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messagesForAI,
      temperature: 0.8,
      max_tokens: 2000,
    });

    const result = completion.choices[0]?.message?.content?.trim() || "No response generated.";
    console.log("✅ OpenAI response received successfully");

    // 7️⃣ Save AI reply
    await addDoc(collection(db, `chats/${chatId}/messages`), {
      role: "assistant",
      text: result,
      createdAt: new Date(),
    });

    console.log("💾 Response saved to Firestore");

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("🔥 /api/generate error:", error);
    
    // More detailed error logging
    if (error.response) {
      console.error("🔥 OpenAI API Response Error:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else if (error.request) {
      console.error("🔥 No response received from OpenAI:", error.request);
    } else {
      console.error("🔥 Error setting up request:", error.message);
    }
    
    console.error("🔥 Error stack:", error.stack);

    return NextResponse.json({ 
      error: "Internal Server Error. Please try again.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
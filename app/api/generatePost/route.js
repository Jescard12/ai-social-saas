import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

// ✅ Firebase Admin Initialization
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: "ai-social-saas-1de62",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

// ✅ Set correct base URL for both local & production
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function POST(request) {
  try {
    // 🔐 Verify Firebase user token
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = await getAuth().verifyIdToken(token);
    const userId = decoded?.uid;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔐 CHECK TRIAL MARKETING PACKAGE LIMIT (1 per day)
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      
      if (userData.status === "trial") {
        const today = new Date().toISOString().split("T")[0];
        const lastPackageDate = userData.lastPackageDate || "";
        const packagesToday = userData.packagesToday || 0;
        
        // Reset counter if new day
        let newPackagesToday = packagesToday;
        if (lastPackageDate !== today) {
          newPackagesToday = 0;
        }
        
        // Check daily marketing package limit (1 per day)
        if (newPackagesToday >= 1) {
          return NextResponse.json({ 
            error: "📊 Daily Marketing Package Limit\n\nYou've already created 1 marketing package today. This limit resets at midnight.\n\n🚀 Upgrade to create unlimited marketing packages and scale your business faster!" 
          }, { status: 429 });
        }
        
        // Update package counter
        await userRef.update({
          packagesToday: newPackagesToday + 1,
          lastPackageDate: today,
          updatedAt: new Date()
        });
        
        console.log(`📦 Trial user marketing packages: ${newPackagesToday + 1}/1 today`);
      }
    }

    // 🧾 Parse body
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: "Please provide a business idea or topic" }, { status: 400 });
    }

    console.log("🎨 Generating marketing package for:", prompt);

    // 🧠 Generate the marketing package
    const marketingPackage = await generateMarketingPackage(prompt, token);

    return NextResponse.json({
      success: true,
      marketingPackage,
    });
  } catch (error) {
    console.error("🔥 Marketing package generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate marketing package. Please try again." },
      { status: 500 }
    );
  }
}

/* ============================================================
   🧠 MAIN FUNCTION — SMART MARKETING PACKAGE GENERATOR
============================================================ */
async function generateMarketingPackage(userPrompt, userToken) {
  try {
    // Step 1️⃣: Summarize the user idea clearly
    const ideaSummary = await summarizeBusinessIdea(userPrompt, userToken);
    console.log("🧠 Summarized idea:", ideaSummary);

    // Step 2️⃣: Generate the marketing package from the summarized idea
    const response = await fetch(`${BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        prompt: `
Create a COMPLETE marketing package for: "${ideaSummary}"

IMPORTANT: Provide the FULL response without cutting off. Include:

🎯 TITLE - Catchy business name/headline
📱 SOCIAL BIO - 2-3 line engaging bio for FB/IG
#️⃣ HASHTAGS - Mix of specific, industry, niche (8-10 total)
💼 LINKEDIN - Professional post (3-4 paragraphs max)
🎨 CONTENT GUIDE - Visuals, colors, tone (be concise)
🎵 MUSIC - 3 fitting music/sound suggestions
⏰ POSTING TIMES - Best time slots with reasoning

Keep each section focused but complete. Don't truncate the response.`,
        chatId: "marketing-package",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.result;
    } else {
      throw new Error("Failed to generate marketing package");
    }
  } catch (error) {
    console.warn("⚠️ Main generation failed, using fallback:", error);
    return await generateAIFallbackPackage(userPrompt, userToken);
  }
}

/* ============================================================
   🧠 SUMMARIZE USER IDEA (Paraphrase Input)
============================================================ */
async function summarizeBusinessIdea(userPrompt, userToken) {
  try {
    const response = await fetch(`${BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        prompt: `
Summarize the following business idea in one short, catchy sentence:
"${userPrompt}"

Rules:
- Paraphrase it clearly (don't just repeat the same words).
- Make it sound like a professional business concept.
- Remove generic terms like "create post" or "generate marketing".
- Example:
  Input: "generate a post about a store that sells handmade jewelry"
  Output: "Handcrafted Jewelry Boutique Launch"`,
        chatId: "summary-extraction",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.result.trim().replace(/^"|"$/g, "");
    }
    throw new Error("Summarization failed");
  } catch (error) {
    console.error("⚠️ Summarization failed:", error);
    return manualSummarizationFallback(userPrompt);
  }
}

/* ============================================================
   ⚙️ AI FALLBACK GENERATOR (uses same /api/generate endpoint)
============================================================ */
async function generateAIFallbackPackage(userPrompt, userToken) {
  try {
    const ideaSummary = await summarizeBusinessIdea(userPrompt, userToken);

    const response = await fetch(`${BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        prompt: `
Create a fallback marketing content pack for:
"${ideaSummary}"

Each section must sound natural and slightly different each time:
1️⃣ Facebook/Instagram bio
2️⃣ Hashtag mix
3️⃣ LinkedIn post
4️⃣ Content direction
5️⃣ Music ideas
6️⃣ Posting schedule`,
        chatId: "fallback-generation",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.result;
    }
    throw new Error("Fallback generation failed");
  } catch (error) {
    console.error("AI fallback error:", error);
    return generateStaticBackup(userPrompt);
  }
}

/* ============================================================
   🧩 SIMPLE TEXT FALLBACK — works without AI
============================================================ */
function manualSummarizationFallback(prompt) {
  const clean = prompt
    .replace(/generate|create|make|write|post|marketing|about|for|to/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function generateStaticBackup(userPrompt) {
  const topic = manualSummarizationFallback(userPrompt);
  return `
# 🎯 MARKETING PACKAGE: ${topic}

## 📱 FACEBOOK/INSTAGRAM BIO
Experience the vision of ${topic}! 🌟 Innovative, engaging, and built for success. 🚀

## #️⃣ HASHTAG STRATEGY
**Primary:** #${topic.replace(/\s+/g, "")} #Innovation #Growth  
**Secondary:** #Marketing #Strategy #CreativeBusiness  
**Niche:** #${topic.replace(/\s+/g, "")}Experts #SuccessFormula

## 💼 LINKEDIN POST
We're building momentum in ${topic} — a project focused on creativity, consistency, and customer connection.  
Every day, we transform challenges into growth opportunities and inspire our audience to do the same.

## 🎨 CONTENT CREATION GUIDE
Use clean visuals, smart typography, and professional colors that evoke trust and curiosity.

## 🎵 MUSIC IDEAS
- Upbeat Corporate Vibes  
- Chill Business Lounge  
- Confident Piano Beats

## ⏰ OPTIMAL POSTING TIMES
Best posting windows: Tuesday–Thursday, 9–11 AM or 5–7 PM local time.  
Maintain consistency with 3–4 posts weekly.
  `.trim();
}
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

    console.log("🎨 Generating ULTIMATE marketing package for:", prompt);

    // 🚀 Generate the ENHANCED marketing package
    const marketingPackage = await generateUltimateMarketingPackage(prompt, token);

    return NextResponse.json({
      success: true,
      marketingPackage,
      enhanced: true,
      packageType: "ultimate"
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
   🚀 ULTIMATE MARKETING PACKAGE GENERATOR
============================================================ */
async function generateUltimateMarketingPackage(userPrompt, userToken) {
  try {
    // Step 1️⃣: Summarize the user idea clearly
    const ideaSummary = await summarizeBusinessIdea(userPrompt, userToken);
    console.log("🧠 Summarized idea:", ideaSummary);

    // Step 2️⃣: Generate the ULTIMATE marketing package
    const response = await fetch(`${BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        prompt: `
Create the ULTIMATE marketing package for: "${ideaSummary}"

Generate a COMPREHENSIVE business marketing strategy with:

🎯 **BUSINESS VIABILITY SCORE**
- Market Demand Score: /10
- Competition Level: /10  
- Profit Potential: /10
- Overall Viability: /10

📊 **COMPETITOR ANALYSIS**
- Top 3 Competitors
- Their Strengths & Weaknesses
- Your Unique Advantage

🚀 **READY-TO-USE MARKETING ASSETS**

📱 **INSTAGRAM** (3 posts)
[For each: Caption + Hashtags + Visual Description]

🐦 **TWITTER** (3 tweets + thread idea)

👔 **LINKEDIN** (Professional post)

📧 **EMAIL NEWSLETTER** (Ready-to-send)

🎥 **TIKTOK/REELS** (3 video ideas)

🔥 **VIRAL POTENTIAL ANALYSIS**
- Viral Score: /100
- Trending Angles
- Optimal Posting Times
- Target Audience

💡 **GROWTH HACKS**
- 3 Quick Wins (first 30 days)
- 3 Long-term Strategies 
- Budget-friendly tactics

📈 **SUCCESS METRICS**
- Expected Engagement Rates
- Conversion Projections
- Timeline to Results

Format this beautifully with emojis and clear sections. Make it ACTIONABLE and READY-TO-USE!`,
        chatId: "ultimate-marketing-package",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.result;
    } else {
      throw new Error("Failed to generate marketing package");
    }
  } catch (error) {
    console.warn("⚠️ Ultimate generation failed, using fallback:", error);
    return await generateEnhancedFallbackPackage(userPrompt, userToken);
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
   🚀 ENHANCED FALLBACK GENERATOR
============================================================ */
async function generateEnhancedFallbackPackage(userPrompt, userToken) {
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
Create a COMPREHENSIVE marketing package for: "${ideaSummary}"

Include these sections with scores and analysis:

🎯 VIABILITY SCORE: /10
📊 COMPETITOR ANALYSIS: Top 3 competitors
📱 SOCIAL MEDIA: Instagram, Twitter, LinkedIn ready posts
🔥 VIRAL POTENTIAL: /100 score
💡 GROWTH HACKS: Quick wins & long-term strategies
📈 METRICS: Expected results timeline

Make it professional and actionable!`,
        chatId: "enhanced-fallback",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.result;
    }
    throw new Error("Enhanced fallback failed");
  } catch (error) {
    console.error("Enhanced fallback error:", error);
    return generateUltimateStaticBackup(userPrompt);
  }
}

/* ============================================================
   🧩 ULTIMATE STATIC BACKUP — with viral scores
============================================================ */
function manualSummarizationFallback(prompt) {
  const clean = prompt
    .replace(/generate|create|make|write|post|marketing|about|for|to/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function generateUltimateStaticBackup(userPrompt) {
  const topic = manualSummarizationFallback(userPrompt);
  return `
# 🚀 ULTIMATE MARKETING PACKAGE: ${topic}

## 🎯 BUSINESS VIABILITY SCORE
- Market Demand Score: 8/10
- Competition Level: 6/10  
- Profit Potential: 7/10
- Overall Viability: 7.5/10

## 📊 COMPETITOR ANALYSIS
**Top 3 Competitors:**
1. [Competitor 1] - Strengths: Established presence | Weaknesses: Higher pricing
2. [Competitor 2] - Strengths: Strong branding | Weaknesses: Limited features
3. [Competitor 3] - Strengths: Large audience | Weaknesses: Poor customer service

**Your Unique Advantage:** Personalized approach and innovative solutions

## 📱 INSTAGRAM POSTS (3 READY-TO-POST)

**Post 1:**
🎯 Caption: "Transform your vision into reality! ✨ ${topic} just got better with our innovative approach. Ready to elevate your game? 🚀"
📸 Visual: Professional lifestyle shot showing results
🏷️ Hashtags: #${topic.replace(/\s+/g, "")} #Innovation #BusinessGrowth #Success

**Post 2:**
🎯 Caption: "Why settle for ordinary when you can achieve extraordinary? 🌟 Our ${topic} solutions are changing the game daily! 💼"
📸 Visual: Behind-the-scenes creative process
🏷️ Hashtags: #Entrepreneur #Marketing #${topic.replace(/\s+/g, "")}Tips #Growth

**Post 3:**
🎯 Caption: "Your success story starts here! 📈 Discover how ${topic} can transform your results and drive real impact. 🔥"
📸 Visual: Customer testimonial or case study visual
🏷️ Hashtags: #Success #BusinessTips #${topic.replace(/\s+/g, "")} #Strategy

## 🐦 TWITTER CONTENT
**Tweet 1:** "Just launched our enhanced ${topic} services! 🚀 Game-changing results for our clients. #BusinessGrowth #${topic.replace(/\s+/g, "")}"

**Tweet 2:** "3 reasons why ${topic} is essential for 2024: 1) Market demand 📈 2) Innovation potential 💡 3) Customer impact 🌟 What would you add?"

**Tweet Thread Idea:** "The complete guide to mastering ${topic} in 5 tweets ↓"

## 👔 LINKEDIN PROFESSIONAL POST
"We're excited to announce our comprehensive ${topic} solutions designed for modern businesses seeking growth and innovation. 

Our approach combines proven strategies with cutting-edge techniques to deliver measurable results. Having helped numerous clients achieve their objectives, we understand the unique challenges in this space.

The market for ${topic} continues to evolve, and staying ahead requires both expertise and adaptability. We're committed to being your partner in this journey.

#ProfessionalServices #BusinessStrategy #${topic.replace(/\s+/g, "")} #Innovation"

## 🔥 VIRAL POTENTIAL ANALYSIS
- **Viral Score:** 78/100
- **Trending Angles:** Innovation stories, Success case studies, Behind-the-scenes
- **Optimal Posting Times:** Tue-Thu 9-11 AM, 5-7 PM
- **Target Audience:** Entrepreneurs, Business owners, Industry professionals

## 💡 GROWTH HACKS
**Quick Wins (First 30 Days):**
1. Leverage customer testimonials in all marketing
2. Create engaging visual content for social media
3. Network with complementary businesses

**Long-term Strategies:**
1. Build authority through content marketing
2. Develop referral partnership programs
3. Expand service offerings based on client feedback

## 📈 SUCCESS METRICS
- **Expected Engagement:** 5-8% on social media
- **Conversion Rate:** 3-5% from qualified leads
- **Timeline to Results:** 30-60 days for initial impact, 6 months for significant growth

---
*Generated with BuzAI Ultimate Marketing Package* 🚀
  `.trim();
}
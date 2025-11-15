import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

// ✅ Initialize Firebase Admin
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

export async function POST(request) {
  try {
    // 1️⃣ Verify Firebase user
    const authHeader = request.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = await getAuth().verifyIdToken(token);
    const userId = decoded?.uid;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 🔐 CHECK TRIAL UPLOAD LIMIT (1 per day)
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      
      if (userData.status === "trial") {
        const today = new Date().toISOString().split("T")[0];
        const lastUploadDate = userData.lastUploadDate || "";
        const uploadsToday = userData.uploadsToday || 0;
        
        // Reset counter if new day
        let newUploadsToday = uploadsToday;
        if (lastUploadDate !== today) {
          newUploadsToday = 0;
        }
        
        // Check daily upload limit (1 file)
        if (newUploadsToday >= 1) {
          return NextResponse.json({ 
            error: "📎 Daily File Upload Limit\n\nYou've already uploaded 1 file today. This limit resets at midnight.\n\n💡 Upgrade to upload multiple files daily and get unlimited AI analysis!" 
          }, { status: 429 });
        }
        
        // Update upload counter
        await userRef.update({
          uploadsToday: newUploadsToday + 1,
          lastUploadDate: today,
          updatedAt: new Date()
        });
        
        console.log(`📎 Trial user uploads: ${newUploadsToday + 1}/1 today`);
      }
    }

    // 2️⃣ Parse form data
    const formData = await request.formData();
    const file = formData.get("file");
    const chatId = formData.get("chatId");

    if (!file || !chatId) {
      return NextResponse.json({ error: "Missing file or chat ID" }, { status: 400 });
    }

    // 3️⃣ Read file content
    const buffer = await file.arrayBuffer();
    const textDecoder = new TextDecoder("utf-8");
    let fileContent = textDecoder.decode(buffer);
    const fileName = file.name;

    // 4️⃣ Save file content to Firestore
    await db.collection("chats").doc(chatId).set({
      fileContent: fileContent,
      fileName: fileName,
      fileUploadedAt: new Date()
    }, { merge: true });

    console.log(`✅ File uploaded successfully: ${fileName} (${fileContent.length} chars)`);

    return NextResponse.json({ 
      success: true, 
      message: "File uploaded successfully",
      fileName: fileName,
      contentLength: fileContent.length
    });

  } catch (error) {
    console.error("🔥 /api/upload error:", error);
    return NextResponse.json({ error: "File upload failed. Please try again." }, { status: 500 });
  }
}
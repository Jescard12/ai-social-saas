"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from '@/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import Swal from "sweetalert2";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Enhanced Markdown component with code copy functionality and better styling
const CustomMarkdown = ({ children }) => {
  const [copiedCode, setCopiedCode] = useState(null);

  const copyToClipboard = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        components={{
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeContent = String(children).replace(/\n$/, '');
            const index = Math.random();

            if (!inline && match) {
              return (
                <div className="relative my-4 rounded-lg overflow-hidden border border-gray-700">
                  <div className="flex justify-between items-center bg-gray-900 px-4 py-2 border-b border-gray-700">
                    <span className="text-xs text-gray-400 uppercase font-mono">
                      {match[1]}
                    </span>
                    <button
                      onClick={() => copyToClipboard(codeContent, index)}
                      className="flex items-center gap-2 px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded-md transition-colors text-gray-300"
                    >
                      {copiedCode === index ? "✅ Copied!" : "📋 Copy"}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    style={atomDark}
                    language={match[1]}
                    PreTag="div"
                    className="!m-0 !rounded-none !bg-gray-950"
                    showLineNumbers
                  >
                    {codeContent}
                  </SyntaxHighlighter>
                </div>
              );
            } else if (!inline) {
              return (
                <div className="relative my-2">
                  <code className="bg-gray-900 text-gray-200 px-2 py-1 rounded-md text-sm font-mono border border-gray-700">
                    {children}
                  </code>
                  <button
                    onClick={() => copyToClipboard(codeContent, index)}
                    className="absolute -top-1 -right-1 bg-gray-800 hover:bg-gray-700 p-1 rounded text-xs transition-colors text-gray-300"
                  >
                    {copiedCode === index ? "✅" : "📋"}
                  </button>
                </div>
              );
            }
            return (
              <code className="bg-gray-800 text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono border border-gray-700" {...props}>
                {children}
              </code>
            );
          },

          // FIXED: p component
          p: ({ node, ...props }) => {
            const hasImage = node?.children?.some(child => 
              child.type === 'element' && child.tagName === 'img'
            );
            
            if (hasImage) {
              return <div>{props.children}</div>;
            }
            
            return <p className="my-3 text-gray-300 leading-relaxed" {...props} />;
          },

          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b border-gray-700 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold mt-5 mb-3 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-300" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="my-3 space-y-2 list-disc list-inside text-gray-300" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="my-3 space-y-2 list-decimal list-inside text-gray-300" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="pl-2 text-gray-300" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic bg-blue-900/20 py-2 rounded-r-lg text-gray-300" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-gray-700">
              <table className="min-w-full divide-y divide-gray-700" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-800" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-gray-700" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-3 text-sm text-gray-300 border-b border-gray-700" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-blue-400 hover:text-blue-300 underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />
          ),
          img: ({ node, ...props }) => {
            if (!props.src || props.src === "") {
              return null;
            }
            return (
              <div className="text-center my-6 p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                <img
                  {...props}
                  className="max-w-full h-auto rounded-lg shadow-2xl mx-auto border-2 border-gray-600"
                  alt={props.alt || "Generated content"}
                  onError={(e) => {
                    console.log("❌ Image failed to load");
                    e.target.style.display = 'none';
                  }}
                  onLoad={() => console.log("✅ Image loaded successfully")}
                />
                <div className="text-sm text-gray-400 mt-3 flex items-center justify-center gap-2">
                  <span className="bg-purple-900/30 px-2 py-1 rounded-md">✨</span>
                  AI-generated marketing visual
                </div>
              </div>
            );
          },
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-gray-700" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-white" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-gray-300" {...props} />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

// Progress Bar Component
const ProgressBar = ({ progress, message, estimatedTime }) => (
  <div className="w-full max-w-md mx-auto p-4 bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-600 shadow-2xl">
    <div className="flex justify-between text-sm text-gray-300 mb-3">
      <span className="font-semibold">{message}</span>
      <span className="text-blue-400">{progress}%</span>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-3 mb-2 overflow-hidden">
      <div 
        className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
    {estimatedTime && (
      <div className="text-xs text-gray-400 text-center">
        ⏱️ Estimated: {estimatedTime}
      </div>
    )}
  </div>
);

// Success Metrics Component
const SuccessMetrics = ({ metrics, onClose }) => (
  <div className="fixed top-4 right-4 bg-gradient-to-br from-green-500 to-teal-600 text-white p-4 rounded-2xl shadow-2xl border border-green-300/30 backdrop-blur-lg z-50 animate-fade-in">
    <button 
      onClick={onClose}
      className="absolute top-2 right-2 text-white/80 hover:text-white text-lg"
    >
      ✕
    </button>
    
    <div className="flex items-center gap-2 mb-3">
      <div className="text-2xl">🎉</div>
      <h3 className="font-bold text-lg">Success Generated!</h3>
    </div>
    
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="bg-white/20 p-2 rounded-lg text-center">
        <div className="text-lg font-bold">{metrics.timeSaved}+</div>
        <div className="text-xs opacity-90">Minutes Saved</div>
      </div>
      <div className="bg-white/20 p-2 rounded-lg text-center">
        <div className="text-lg font-bold">{metrics.ideasGenerated}</div>
        <div className="text-xs opacity-90">Ideas Generated</div>
      </div>
      <div className="bg-white/20 p-2 rounded-lg text-center">
        <div className="text-lg font-bold">{metrics.actionSteps}</div>
        <div className="text-xs opacity-90">Action Steps</div>
      </div>
      <div className="bg-white/20 p-2 rounded-lg text-center">
        <div className="text-lg font-bold">{metrics.contentQuality}%</div>
        <div className="text-xs opacity-90">Quality Score</div>
      </div>
    </div>
    
    <div className="mt-3 text-xs text-center opacity-80">
      Your AI assistant is working hard! 🚀
    </div>
  </div>
);

export default function Dashboard() {
  const router = useRouter();
  const messagesEndRef = useRef(null);

  const [user, setUser] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [abortController, setAbortController] = useState(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // NEW: Progress and Metrics States
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showSuccessMetrics, setShowSuccessMetrics] = useState(false);
  const [successMetrics, setSuccessMetrics] = useState(null);
  const [showTools, setShowTools] = useState(false);

  // ---- AUTH + ACCESS GATE ----
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
        return;
      }
      setUser(currentUser);

      try {
        await checkPlan(currentUser);
      } catch (err) {
        console.error("Plan check error:", err);
      }
      fetchChats(currentUser.uid);
    });
    return () => unsubscribe();
  }, [router]);

  // 🔄 Periodic Plan Checker
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      try {
        if (user && user.uid) checkPlan(user);
      } catch (err) {
        console.error("Periodic plan check failed:", err);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // ---- Progress Animation ----
  const startProgressAnimation = () => {
    setGenerationProgress(0);
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);
    return interval;
  };

  // ---- Success Metrics Calculator ----
  const calculateSuccessMetrics = (responseText, type) => {
    const wordCount = responseText.split(/\s+/).length;
    const sectionCount = (responseText.match(/#+\s/g) || []).length;
    const emojiCount = (responseText.match(/[🚀🎯📊🔥💡📱🐦👔🎥📈⚠️🎨🎵⏰]/g) || []).length;
    
    let timeSaved, ideasGenerated, actionSteps;
    
    if (type === 'marketing') {
      timeSaved = Math.floor(wordCount / 50) * 30;
      ideasGenerated = sectionCount * 2;
      actionSteps = Math.max(5, Math.floor(wordCount / 100));
    } else if (type === 'mentor') {
      timeSaved = 120;
      ideasGenerated = 8;
      actionSteps = 5;
    } else {
      timeSaved = Math.floor(wordCount / 30) * 15;
      ideasGenerated = Math.floor(wordCount / 50);
      actionSteps = Math.floor(wordCount / 80);
    }
    
    return {
      timeSaved: Math.min(timeSaved, 240),
      ideasGenerated: Math.min(ideasGenerated, 20),
      actionSteps: Math.min(actionSteps, 10),
      contentQuality: Math.min(95, 70 + Math.floor(wordCount / 20)),
      wordCount,
      sectionCount
    };
  };

  // ---- Function: Check user plan ----
  const checkPlan = async (currentUser) => {
    if (!currentUser || !currentUser.uid) {
      return;
    }
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      router.push("/billing");
      return;
    }

    const data = userDocSnap.data();
    const status = data?.status;
    const trialEnd = data?.trialEnd;
    const endDate = data?.endDate;
    const now = new Date();

    const trialEndDate =
      trialEnd && typeof trialEnd?.toDate === "function"
        ? trialEnd.toDate()
        : trialEnd
        ? new Date(trialEnd)
        : null;

    const planEndDate =
      endDate && typeof endDate?.toDate === "function"
        ? endDate.toDate()
        : endDate
        ? new Date(endDate)
        : null;

    if (status === "pending") {
      router.push("/pending");
      return;
    } else if (status === "trial") {
      if (!trialEndDate || trialEndDate <= now) {
        router.push("/billing");
        return;
      }
    } else if (status === "approved") {
      if (!planEndDate || planEndDate <= now) {
        router.push("/billing");
        return;
      }
    } else {
      router.push("/billing");
      return;
    }
  };

  // ---- DATA HELPERS ----
  const fetchChats = async (uid) => {
    if (!uid) return;
    try {
      const qy = query(
        collection(db, "chats"),
        where("userId", "==", uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(qy);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setHistory(data);
    } catch (err) {
      console.error("fetchChats error:", err);
    }
  };

  const fetchChatMessages = async (chatId) => {
    if (!chatId) {
      setChatMessages([]);
      return;
    }
    try {
      const qy = query(
        collection(db, `chats/${chatId}/messages`),
        orderBy("createdAt", "asc")
      );
      const snap = await getDocs(qy);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setChatMessages(data);
      setActiveChatId(chatId);
      scrollToBottom();
    } catch (err) {
      console.error("fetchChatMessages error:", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // ---- STOP GENERATION FUNCTION ----
  const handleStopGeneration = async () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setLoading(false);
      setImgLoading(false);
      setGenerationProgress(0);
      console.log("🛑 Generation stopped by user");
    }
  };

  // ---- CHAT: TEXT + FILE ----
  const handlePromptSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() && !file) return;
    
    const progressInterval = startProgressAnimation();
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);

    let userMessageRef = null;

    try {
      if (!user) {
        clearInterval(progressInterval);
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
        await Swal.fire({
          title: 'Authentication Required',
          text: 'Please log in to continue',
          icon: 'warning',
          confirmButtonText: 'Got it',
          background: '#1a1f3b',
          color: 'white',
          confirmButtonColor: '#4F46E5'
        });
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const data = userSnap.exists() ? userSnap.data() : {};

      if (data.status === "trial") {
        const today = new Date().toISOString().split("T")[0];
        let chatsToday = data.chatsToday || 0;
        const lastChatDate = data.lastChatDate || "";
        if (lastChatDate !== today) chatsToday = 0;
        
        await updateDoc(userRef, {
          chatsToday: chatsToday + 1,
          lastChatDate: today,
          updatedAt: serverTimestamp(),
        });
      }

      let chatId = activeChatId;
      if (!chatId) {
        const chatDoc = await addDoc(collection(db, "chats"), {
          userId: user.uid,
          createdAt: serverTimestamp(),
          title: prompt || (file ? `📎 ${file.name}` : "Untitled Chat"),
        });
        chatId = chatDoc.id;
        setActiveChatId(chatId);
        fetchChats(user.uid);
      }

      userMessageRef = await addDoc(collection(db, `chats/${chatId}/messages`), {
        role: "user",
        text: prompt || `📎 Uploaded file: ${file?.name}`,
        createdAt: serverTimestamp(),
      });

      const token = await user.getIdToken();

      if (file) {
        console.log("📤 Starting file upload...", file.name);
        
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("chatId", chatId);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadFormData,
          signal: controller.signal
        });

        if (controller.signal.aborted) {
          console.log("🛑 File upload cancelled");
          if (userMessageRef) {
            await deleteDoc(userMessageRef);
          }
          return;
        }

        console.log("📤 Upload response status:", uploadRes.status);

        if (!uploadRes.ok) {
          let errorData;
          try {
            errorData = await uploadRes.json();
          } catch {
            setLoading(false);
            setAbortController(null);
            await Swal.fire({
              title: 'Upload Failed',
              text: 'File upload failed. Please try again.',
              icon: 'error',
              confirmButtonText: 'Got it',
              background: '#1a1f3b',
              color: 'white',
              confirmButtonColor: '#4F46E5'
            });
            return;
          }
          setLoading(false);
          setAbortController(null);
          await Swal.fire({
            title: 'Upload Limit',
            text: errorData.error || "File upload failed",
            icon: 'info',
            confirmButtonText: 'Got it',
            background: '#1a1f3b',
            color: 'white',
            confirmButtonColor: '#4F46E5'
          });
          return;
        }
        
        const uploadResult = await uploadRes.json();
        console.log("✅ File upload successful:", uploadResult);
      }

      console.log("🤖 Sending prompt to generate API...");
      const generateRes = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          prompt: prompt || `Analyze the uploaded file: ${file?.name}`,
          chatId 
        }),
        signal: controller.signal
      });

      if (controller.signal.aborted) {
        console.log("🛑 Generation cancelled");
        if (userMessageRef) {
          await deleteDoc(userMessageRef);
        }
        return;
      }

      console.log("🤖 Generate response status:", generateRes.status);

      let resultData;
      try {
        resultData = await generateRes.json();
      } catch (jsonError) {
        console.error("❌ JSON parse error:", jsonError);
        setLoading(false);
        setAbortController(null);
        await Swal.fire({
          title: 'Server Error',
          text: 'Invalid response from server. Please try again.',
          icon: 'error',
          confirmButtonText: 'Got it',
          background: '#1a1f3b',
          color: 'white',
          confirmButtonColor: '#4F46E5'
        });
        return;
      }

      if (!generateRes.ok) {
        setLoading(false);
        setAbortController(null);
        await Swal.fire({
          title: resultData.error?.includes('Limit') ? 'Limit Reached' : 'Request Failed',
          text: resultData.error || "Request failed. Please try again.",
          icon: resultData.error?.includes('Limit') ? 'info' : 'error',
          confirmButtonText: 'Got it',
          background: '#1a1f3b',
          color: 'white',
          confirmButtonColor: '#4F46E5'
        });
        return;
      }

      if (resultData.error) {
        setLoading(false);
        setAbortController(null);
        await Swal.fire({
          title: 'Error',
          text: resultData.error,
          icon: 'error',
          confirmButtonText: 'Got it',
          background: '#1a1f3b',
          color: 'white',
          confirmButtonColor: '#4F46E5'
        });
        return;
      }

      console.log("✅ Response generated successfully");

      setPrompt("");
      setFile(null);
      setFileName("");
      const fileInput = document.getElementById("fileUpload");
      if (fileInput) fileInput.value = null;

      fetchChatMessages(chatId);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log("🛑 Request was cancelled");
        if (userMessageRef) {
          await deleteDoc(userMessageRef);
        }
        return;
      }
      console.error("❌ Error generating response:", error);
      await Swal.fire({
        title: 'Error',
        text: 'Something went wrong. Please try again.',
        icon: 'error',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setTimeout(() => {
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
      }, 500);
    }
  };

  const handleAdCopyGenerator = async () => {
    if (!prompt.trim()) {
      await Swal.fire({
        title: 'Product/Service Needed',
        text: 'Describe what you want to advertise (e.g., "new fitness app", "coffee shop special", "consulting services")',
        icon: 'info',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }
  
    const progressInterval = startProgressAnimation();
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
  
    try {
      if (!user) {
        clearInterval(progressInterval);
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
        await Swal.fire({
          title: 'Authentication Required',
          text: 'Please log in to continue',
          icon: 'warning',
          confirmButtonText: 'Got it',
          background: '#1a1f3b',
          color: 'white',
          confirmButtonColor: '#4F46E5'
        });
        return;
      }
  
      const token = await user.getIdToken();
      let chatId = activeChatId;
      
      if (!chatId) {
        const chatDoc = await addDoc(collection(db, "chats"), {
          userId: user.uid,
          createdAt: serverTimestamp(),
          title: `📢 Ad Copy: ${prompt.substring(0, 30)}...`,
        });
        chatId = chatDoc.id;
        setActiveChatId(chatId);
        fetchChats(user.uid);
      }
  
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        role: "user",
        text: `📢 Generate Ad Copy For: ${prompt}`,
        createdAt: serverTimestamp(),
      });
  
      console.log("📢 Generating ad copy for:", prompt);
  
      const adRes = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          prompt: `CREATE HIGH-CONVERTING AD COPY for: "${prompt}"
  
  Generate COMPLETE advertising copy for all major platforms:
  
  🎯 **FACEBOOK/INSTAGRAM ADS**
  - Primary Headline (attention-grabbing)
  - Secondary Text (benefit-focused)
  - Call-to-Action (clear & compelling)
  - Target Audience Suggestions
  
  🔍 **GOOGLE SEARCH ADS**
  - 3 Headline Variations (30 chars max)
  - 2 Description Variations (90 chars max)
  - Display Path Suggestions
  - Keyword Recommendations
  
  📱 **TIKTOK/REELS VIDEO SCRIPT**
  - Hook (first 3 seconds)
  - Value Proposition (next 10 seconds)
  - Call-to-Action (last 5 seconds)
  - Trending Audio/Sound Suggestions
  
  🔄 **A/B TESTING VARIATIONS**
  - Emotional Appeal Version
  - Logical/Benefit Version
  - Social Proof Version
  - Urgency/Scarcity Version
  
  🎨 **VISUAL RECOMMENDATIONS**
  - Image/Video Style
  - Color Psychology Tips
  - Font Suggestions
  - Brand Element Placement
  
  Include specific CTAs, emotional triggers, and platform-best practices. Make it READY-TO-USE!`,
          chatId 
        }),
        signal: controller.signal
      });
  
      if (!adRes.ok) {
        const errorData = await adRes.json();
        throw new Error(errorData.error || "Ad copy generation failed");
      }
  
      const resultData = await adRes.json();
      
      const metrics = calculateSuccessMetrics(resultData.result, 'adcopy');
      setSuccessMetrics(metrics);
      setShowSuccessMetrics(true);
      setTimeout(() => setShowSuccessMetrics(false), 5000);
      
      setPrompt("");
      fetchChatMessages(chatId);
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("Ad copy generator error:", err);
      await Swal.fire({
        title: 'Error',
        text: err.message || 'Failed to generate ad copy',
        icon: 'error',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setTimeout(() => {
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
      }, 500);
    }
  };

  
  const handleContentCalendar = async () => {
    if (!prompt.trim()) {
      await Swal.fire({
        title: 'Business/Theme Needed',
        text: 'Tell me about your business or content theme (e.g., "vegan restaurant", "fitness coach", "tech startup")',
        icon: 'info',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }
  
    const progressInterval = startProgressAnimation();
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
  
    try {
      if (!user) {
        clearInterval(progressInterval);
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
        await Swal.fire({
          title: 'Authentication Required',
          text: 'Please log in to continue',
          icon: 'warning',
          confirmButtonText: 'Got it',
          background: '#1a1f3b',
          color: 'white',
          confirmButtonColor: '#4F46E5'
        });
        return;
      }
  
      const token = await user.getIdToken();
      let chatId = activeChatId;
      
      if (!chatId) {
        const chatDoc = await addDoc(collection(db, "chats"), {
          userId: user.uid,
          createdAt: serverTimestamp(),
          title: `📅 Content Calendar: ${prompt.substring(0, 30)}...`,
        });
        chatId = chatDoc.id;
        setActiveChatId(chatId);
        fetchChats(user.uid);
      }
  
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        role: "user",
        text: `📅 Build Content Calendar For: ${prompt}`,
        createdAt: serverTimestamp(),
      });
  
      console.log("📅 Building content calendar for:", prompt);
  
      const calendarRes = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          prompt: `CREATE A 30-DAY CONTENT CALENDAR for: "${prompt}"
  
  Generate a COMPREHENSIVE content strategy:
  
  📅 **MONTHLY CONTENT THEMES**
  - Week 1 Theme: [Theme + goal]
  - Week 2 Theme: [Theme + goal] 
  - Week 3 Theme: [Theme + goal]
  - Week 4 Theme: [Theme + goal]
  
  📱 **DAILY CONTENT PLAN (30 days)**
  For each day include:
  - Platform: Instagram/Facebook/TikTok/LinkedIn/Email
  - Content Type: Post/Story/Reel/Article/Newsletter
  - Topic/Idea: Specific content concept
  - Hashtags: Platform-appropriate hashtags
  
  🎯 **CONTENT MIX STRATEGY**
  - 50% Educational/Value Content
  - 30% Engaging/Entertaining Content  
  - 20% Promotional/Sales Content
  
  📊 **PLATFORM-SPECIFIC STRATEGY**
  - Instagram: Visual storytelling + Reels
  - Facebook: Community building + Groups
  - TikTok: Trend participation + Authenticity
  - LinkedIn: Professional insights + Networking
  - Email: Value-driven newsletters
  
  📈 **PERFORMANCE TRACKING**
  - Key metrics to monitor
  - Engagement goals
  - Conversion targets
  - Growth indicators
  
  Make it actionable with specific post ideas and optimal posting times.`,
          chatId 
        }),
        signal: controller.signal
      });
  
      if (!calendarRes.ok) {
        const errorData = await calendarRes.json();
        throw new Error(errorData.error || "Content calendar generation failed");
      }
  
      const resultData = await calendarRes.json();
      
      const metrics = calculateSuccessMetrics(resultData.result, 'calendar');
      setSuccessMetrics(metrics);
      setShowSuccessMetrics(true);
      setTimeout(() => setShowSuccessMetrics(false), 5000);
      
      setPrompt("");
      fetchChatMessages(chatId);
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("Content calendar error:", err);
      await Swal.fire({
        title: 'Error',
        text: err.message || 'Failed to build content calendar',
        icon: 'error',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setTimeout(() => {
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
      }, 500);
    }
  };

  const handleEmailCampaign = async () => {
    if (!prompt.trim()) {
      await Swal.fire({
        title: 'Campaign Goal Needed',
        text: 'Describe your email campaign goal (e.g., "welcome series for new customers", "product launch announcement", "lead nurturing sequence")',
        icon: 'info',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }
  
    const progressInterval = startProgressAnimation();
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
  
    try {
      if (!user) {
        clearInterval(progressInterval);
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
        await Swal.fire({
          title: 'Authentication Required',
          text: 'Please log in to continue',
          icon: 'warning',
          confirmButtonText: 'Got it',
          background: '#1a1f3b',
          color: 'white',
          confirmButtonColor: '#4F46E5'
        });
        return;
      }
  
      const token = await user.getIdToken();
      let chatId = activeChatId;
      
      if (!chatId) {
        const chatDoc = await addDoc(collection(db, "chats"), {
          userId: user.uid,
          createdAt: serverTimestamp(),
          title: `📧 Email Campaign: ${prompt.substring(0, 30)}...`,
        });
        chatId = chatDoc.id;
        setActiveChatId(chatId);
        fetchChats(user.uid);
      }
  
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        role: "user",
        text: `📧 Build Email Campaign For: ${prompt}`,
        createdAt: serverTimestamp(),
      });
  
      console.log("📧 Building email campaign for:", prompt);
  
      const emailRes = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          prompt: `CREATE A COMPLETE EMAIL CAMPAIGN for: "${prompt}"
  
  Generate READY-TO-SEND email sequences:
  
  📧 **CAMPAIGN OVERVIEW**
  - Campaign Goal & Target Audience
  - Key Performance Indicators
  - Timeline & Send Schedule
  
  🔄 **EMAIL SEQUENCE (5-7 emails)**
  For each email include:
  - Subject Line (3 compelling variations)
  - Preheader Text (mobile preview)
  - Email Body (conversational & engaging)
  - Call-to-Action (clear & clickable)
  - Send Timing (optimal day/time)
  
  🎯 **EMAIL TYPES COVERED**
  - Welcome/Onboarding Email
  - Value/Education Email
  - Engagement/Nurturing Email
  - Promotion/Offer Email
  - Re-engagement/Win-back Email
  
  📊 **CONVERSION OPTIMIZATION**
  - Personalization Points
  - Urgency & Scarcity Elements
  - Social Proof Integration
  - Mobile-Responsive Design Tips
  
  📈 **PERFORMANCE TRACKING**
  - Open Rate Benchmarks
  - Click-Through Rate Goals
  - Conversion Rate Targets
  - A/B Testing Suggestions
  
  🔧 **TECHNICAL SETUP**
  - Segmentation Recommendations
  - Automation Triggers
  - List Management Tips
  - Compliance Guidelines (GDPR/CAN-SPAM)
  
  Make each email feel personal and provide exact copy that can be used immediately.`,
          chatId 
        }),
        signal: controller.signal
      });
  
      if (!emailRes.ok) {
        const errorData = await emailRes.json();
        throw new Error(errorData.error || "Email campaign generation failed");
      }
  
      const resultData = await emailRes.json();
      
      const metrics = calculateSuccessMetrics(resultData.result, 'email');
      setSuccessMetrics(metrics);
      setShowSuccessMetrics(true);
      setTimeout(() => setShowSuccessMetrics(false), 5000);
      
      setPrompt("");
      fetchChatMessages(chatId);
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("Email campaign error:", err);
      await Swal.fire({
        title: 'Error',
        text: err.message || 'Failed to build email campaign',
        icon: 'error',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setTimeout(() => {
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
      }, 500);
    }
  };

  const handleSWOTAnalysis = async () => {
    if (!prompt.trim()) {
      await Swal.fire({
        title: 'Business/Project Needed',
        text: 'Describe your business, project, or idea for SWOT analysis (e.g., "my coffee shop", "new SaaS product", "marketing agency")',
        icon: 'info',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }
  
    const progressInterval = startProgressAnimation();
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
  
    try {
      if (!user) {
        clearInterval(progressInterval);
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
        await Swal.fire({
          title: 'Authentication Required',
          text: 'Please log in to continue',
          icon: 'warning',
          confirmButtonText: 'Got it',
          background: '#1a1f3b',
          color: 'white',
          confirmButtonColor: '#4F46E5'
        });
        return;
      }
  
      const token = await user.getIdToken();
      let chatId = activeChatId;
      
      if (!chatId) {
        const chatDoc = await addDoc(collection(db, "chats"), {
          userId: user.uid,
          createdAt: serverTimestamp(),
          title: `⚖️ SWOT Analysis: ${prompt.substring(0, 30)}...`,
        });
        chatId = chatDoc.id;
        setActiveChatId(chatId);
        fetchChats(user.uid);
      }
  
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        role: "user",
        text: `⚖️ SWOT Analysis For: ${prompt}`,
        createdAt: serverTimestamp(),
      });
  
      console.log("⚖️ Conducting SWOT analysis for:", prompt);
  
      const swotRes = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          prompt: `CONDUCT A COMPREHENSIVE SWOT ANALYSIS for: "${prompt}"
  
  Provide a DETAILED strategic analysis:
  
  ✅ **STRENGTHS (Internal Positive Factors)**
  - [3-5 key strengths with explanations]
  - Competitive advantages
  - Unique resources/capabilities
  - Brand/reputation assets
  
  ❌ **WEAKNESSES (Internal Negative Factors)**
  - [3-5 key weaknesses with explanations]
  - Resource limitations
  - Skill/knowledge gaps
  - Operational inefficiencies
  
  🎯 **OPPORTUNITIES (External Positive Factors)**
  - [3-5 key opportunities with explanations]
  - Market trends to leverage
  - Technological advancements
  - Competitor vulnerabilities
  - Customer needs to fulfill
  
  ⚠️ **THREATS (External Negative Factors)**
  - [3-5 key threats with explanations]
  - Market/industry challenges
  - Competitive pressures
  - Economic/regulatory risks
  - Technological disruptions
  
  📊 **STRATEGIC INSIGHTS**
  - How to leverage strengths against opportunities
  - How to use strengths to mitigate threats
  - How to address weaknesses that block opportunities
  - How to protect against weaknesses exacerbating threats
  
  🚀 **ACTIONABLE RECOMMENDATIONS**
  - Immediate priorities (next 30 days)
  - Medium-term initiatives (3-6 months)
  - Long-term strategic moves (1 year+)
  - Key performance indicators to track
  
  Be brutally honest and data-driven. Focus on actionable business intelligence.`,
          chatId 
        }),
        signal: controller.signal
      });
  
      if (!swotRes.ok) {
        const errorData = await swotRes.json();
        throw new Error(errorData.error || "SWOT analysis failed");
      }
  
      const resultData = await swotRes.json();
      
      const metrics = calculateSuccessMetrics(resultData.result, 'swot');
      setSuccessMetrics(metrics);
      setShowSuccessMetrics(true);
      setTimeout(() => setShowSuccessMetrics(false), 5000);
      
      setPrompt("");
      fetchChatMessages(chatId);
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("SWOT analysis error:", err);
      await Swal.fire({
        title: 'Error',
        text: err.message || 'Failed to conduct SWOT analysis',
        icon: 'error',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setTimeout(() => {
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
      }, 500);
    }
  };

  const handleCompetitorAnalysis = async () => {
    if (!prompt.trim()) {
      await Swal.fire({
        title: 'Business/Product Needed',
        text: 'Tell me about your business or product for competitor analysis',
        icon: 'info',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }
  
    const progressInterval = startProgressAnimation();
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
  
    try {
      if (!user) {
        clearInterval(progressInterval);
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
        await Swal.fire({
          title: 'Authentication Required',
          text: 'Please log in to continue',
          icon: 'warning',
          confirmButtonText: 'Got it',
          background: '#1a1f3b',
          color: 'white',
          confirmButtonColor: '#4F46E5'
        });
        return;
      }
  
      const token = await user.getIdToken();
      let chatId = activeChatId;
      
      if (!chatId) {
        const chatDoc = await addDoc(collection(db, "chats"), {
          userId: user.uid,
          createdAt: serverTimestamp(),
          title: `🔍 Competitor Analysis: ${prompt.substring(0, 30)}...`,
        });
        chatId = chatDoc.id;
        setActiveChatId(chatId);
        fetchChats(user.uid);
      }
  
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        role: "user",
        text: `🔍 Competitor Analysis Request: ${prompt}`,
        createdAt: serverTimestamp(),
      });
  
      console.log("🔍 Analyzing competitors for:", prompt);
  
      const analysisRes = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          prompt: `CONDUCT A COMPETITOR ANALYSIS for this business: "${prompt}"
  
  Provide a DETAILED competitor analysis with:
  
  🏆 **TOP 3-5 COMPETITORS**
  - [Competitor 1]: Pricing, features, target market
  - [Competitor 2]: Pricing, features, target market  
  - [Competitor 3]: Pricing, features, target market
  
  📊 **COMPETITIVE LANDSCAPE**
  - Market leaders vs niche players
  - Pricing ranges in the market
  - Key differentiators in the industry
  
  ✅ **COMPETITOR STRENGTHS**
  - What they do well
  - Their unique advantages
  - Customer loyalty factors
  
  ❌ **COMPETITOR WEAKNESSES**
  - Where they fall short
  - Customer complaints/common issues
  - Gaps in their offerings
  
  🎯 **YOUR COMPETITIVE ADVANTAGE**
  - How you can differentiate
  - Untapped market opportunities
  - Your unique value proposition
  
  💡 **WINNING STRATEGIES**
  - Specific tactics to outperform competitors
  - Pricing strategies to gain market share
  - Marketing angles they're missing
  
  Be specific and actionable. Focus on real competitive insights.`,
          chatId 
        }),
        signal: controller.signal
      });
  
      if (!analysisRes.ok) {
        const errorData = await analysisRes.json();
        throw new Error(errorData.error || "Competitor analysis failed");
      }
  
      const resultData = await analysisRes.json();
      
      // Calculate and show success metrics
      const metrics = calculateSuccessMetrics(resultData.result, 'analysis');
      setSuccessMetrics(metrics);
      setShowSuccessMetrics(true);
      setTimeout(() => setShowSuccessMetrics(false), 5000);
      
      setPrompt("");
      fetchChatMessages(chatId);
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("Competitor analysis error:", err);
      await Swal.fire({
        title: 'Error',
        text: err.message || 'Failed to analyze competitors',
        icon: 'error',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setTimeout(() => {
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
      }, 500);
    }
  };
  const handleBusinessMentor = async () => {
    if (!prompt.trim()) {
      await Swal.fire({
        title: 'Ask Your Business Mentor',
        text: 'What business challenge can I help you with? (e.g., "Should I quit my job?", "Is my pricing right?", "How to get first customers?")',
        icon: 'info',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }
  
    const progressInterval = startProgressAnimation();
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
  
    try {
      if (!user) {
        clearInterval(progressInterval);
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
        await Swal.fire({
          title: 'Authentication Required',
          text: 'Please log in to continue',
          icon: 'warning',
          confirmButtonText: 'Got it',
          background: '#1a1f3b',
          color: 'white',
          confirmButtonColor: '#4F46E5'
        });
        return;
      }
  
      const token = await user.getIdToken();
      let chatId = activeChatId;
      
      if (!chatId) {
        const chatDoc = await addDoc(collection(db, "chats"), {
          userId: user.uid,
          createdAt: serverTimestamp(),
          title: `👔 Mentor: ${prompt.substring(0, 30)}...`,
        });
        chatId = chatDoc.id;
        setActiveChatId(chatId);
        fetchChats(user.uid);
      }
  
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        role: "user",
        text: `👔 Business Mentor Question: ${prompt}`,
        createdAt: serverTimestamp(),
      });
  
      console.log("👔 Consulting business mentor for:", prompt);
  
      const mentorRes = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          prompt: `ACT AS A TOUGH BUT FAIR BUSINESS MENTOR. The user is asking: "${prompt}"
  
  Give direct, no-BS advice with this structure:
  
  🎯 **BRUTAL HONESTY**
  [Tell them the hard truth about their situation/chances]
  
  💡 **3 ACTIONABLE STEPS** (to take NOW)
  1. [Specific, immediate action]
  2. [Specific, immediate action] 
  3. [Specific, immediate action]
  
  ⚠️ **BIGGEST RISKS TO AVOID**
  - [Common mistake 1]
  - [Common mistake 2]
  - [Common mistake 3]
  
  🚀 **MOST PROMISING OPPORTUNITY**
  [What they should focus on for maximum impact]
  
  📊 **REALISTIC TIMELINE**
  - Short-term (30 days): [What to expect]
  - Medium-term (3-6 months): [Realistic goals]
  - Long-term (1 year): [Potential outcomes]
  
  Be motivational but realistic. Don't sugarcoat. Give them the tough love they need to succeed.`,
          chatId 
        }),
        signal: controller.signal
      });
  
      if (!mentorRes.ok) {
        const errorData = await mentorRes.json();
        throw new Error(errorData.error || "Mentor advice failed");
      }
  
      const resultData = await mentorRes.json();
      
      // Calculate and show success metrics
      const metrics = calculateSuccessMetrics(resultData.result, 'mentor');
      setSuccessMetrics(metrics);
      setShowSuccessMetrics(true);
      setTimeout(() => setShowSuccessMetrics(false), 5000);
      
      setPrompt("");
      fetchChatMessages(chatId);
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("Business mentor error:", err);
      await Swal.fire({
        title: 'Error',
        text: err.message || 'Failed to get mentor advice',
        icon: 'error',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setTimeout(() => {
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
      }, 500);
    }
  };

  const handleGenerateMarketingPackage = async () => {
    if (!prompt.trim()) {
      await Swal.fire({
        title: 'Business Description Needed',
        text: 'Describe your business, product, or marketing goal (e.g., "new coffee shop", "fitness app launch", "digital marketing services")',
        icon: 'info',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }
    
    const progressInterval = startProgressAnimation();
    const controller = new AbortController();
    setAbortController(controller);
    setImgLoading(true);
  
    try {
      if (!user) {
        clearInterval(progressInterval);
        setGenerationProgress(0);
        setImgLoading(false);
        setAbortController(null);
        await Swal.fire({
          title: 'Authentication Required',
          text: 'Please log in to continue',
          icon: 'warning',
          confirmButtonText: 'Got it',
          background: '#1a1f3b',
          color: 'white',
          confirmButtonColor: '#4F46E5'
        });
        return;
      }
  
      const token = await user.getIdToken();
      let chatId = activeChatId;
      
      if (!chatId) {
        const chatDoc = await addDoc(collection(db, "chats"), {
          userId: user.uid,
          createdAt: serverTimestamp(),
          title: `📊 ${prompt.substring(0, 30)}... (Marketing Package)`,
        });
        chatId = chatDoc.id;
        setActiveChatId(chatId);
        fetchChats(user.uid);
      }
  
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        role: "user",
        text: `📊 Generate COMPLETE marketing package: ${prompt}`,
        createdAt: serverTimestamp(),
      });
  
      console.log("📊 Generating ULTRA marketing package for:", prompt);
  
      const res = await fetch("/api/generatePost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
        signal: controller.signal
      });
  
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Generation failed");
      }
  
      const data = await res.json();

      // Calculate and show success metrics
      const metrics = calculateSuccessMetrics(data.marketingPackage, 'marketing');
      setSuccessMetrics(metrics);
      setShowSuccessMetrics(true);
      setTimeout(() => setShowSuccessMetrics(false), 6000);
  
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        role: "assistant",
        text: data.marketingPackage,
        createdAt: serverTimestamp(),
      });
  
      setPrompt("");
      fetchChatMessages(chatId);
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("Marketing package error:", err);
      await Swal.fire({
        title: 'Error',
        text: err.message || 'Something went wrong. Please try again.',
        icon: 'error',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setTimeout(() => {
        setGenerationProgress(0);
        setImgLoading(false);
        setAbortController(null);
      }, 500);
    }
  };
  const handleROICalculator = async () => {
    if (!prompt.trim()) {
      await Swal.fire({
        title: 'Investment Details Needed',
        text: 'Describe your marketing investment or campaign (e.g., "$1000 Facebook ads", "email marketing campaign", "content creation budget")',
        icon: 'info',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }
  
    const progressInterval = startProgressAnimation();
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
  
    try {
      if (!user) {
        clearInterval(progressInterval);
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
        await Swal.fire({
          title: 'Authentication Required',
          text: 'Please log in to continue',
          icon: 'warning',
          confirmButtonText: 'Got it',
          background: '#1a1f3b',
          color: 'white',
          confirmButtonColor: '#4F46E5'
        });
        return;
      }
  
      const token = await user.getIdToken();
      let chatId = activeChatId;
      
      if (!chatId) {
        const chatDoc = await addDoc(collection(db, "chats"), {
          userId: user.uid,
          createdAt: serverTimestamp(),
          title: `📈 ROI Calculator: ${prompt.substring(0, 30)}...`,
        });
        chatId = chatDoc.id;
        setActiveChatId(chatId);
        fetchChats(user.uid);
      }
  
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        role: "user",
        text: `📈 Calculate ROI For: ${prompt}`,
        createdAt: serverTimestamp(),
      });
  
      console.log("📈 Calculating ROI for:", prompt);
  
      const roiRes = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          prompt: `CALCULATE ROI AND BUSINESS IMPACT for: "${prompt}"
  
  Provide COMPREHENSIVE ROI analysis:
  
  💰 **INVESTMENT BREAKDOWN**
  - Total Investment Cost
  - Breakdown of Expenses
  - Timeline for Investment
  - Resource Allocation
  
  📊 **RETURN PROJECTIONS**
  - Expected Revenue Generation
  - Customer Acquisition Cost (CAC)
  - Customer Lifetime Value (LTV)
  - Break-even Point Calculation
  
  🎯 **ROI METRICS**
  - ROI Percentage: (Gain - Cost) / Cost
  - Payback Period
  - Net Present Value (NPV)
  - Internal Rate of Return (IRR)
  
  📈 **PERFORMANCE SCENARIOS**
  - Best Case Scenario (Optimistic)
  - Expected Case Scenario (Realistic) 
  - Worst Case Scenario (Conservative)
  - Risk-Adjusted Return
  
  🔍 **INDUSTRY BENCHMARKS**
  - Average ROI for Similar Investments
  - Competitor Performance Metrics
  - Industry Standard KPIs
  - Success Rate Comparisons
  
  ⚠️ **RISK ASSESSMENT**
  - Key Risk Factors
  - Mitigation Strategies
  - Contingency Planning
  - Exit Strategy Options
  
  🚀 **OPTIMIZATION RECOMMENDATIONS**
  - Cost Reduction Opportunities
  - Revenue Enhancement Strategies
  - Efficiency Improvements
  - Scaling Potential
  
  Provide specific numbers, percentages, and actionable insights. Use realistic industry data.`,
          chatId 
        }),
        signal: controller.signal
      });
  
      if (!roiRes.ok) {
        const errorData = await roiRes.json();
        throw new Error(errorData.error || "ROI calculation failed");
      }
  
      const resultData = await roiRes.json();
      
      const metrics = calculateSuccessMetrics(resultData.result, 'roi');
      setSuccessMetrics(metrics);
      setShowSuccessMetrics(true);
      setTimeout(() => setShowSuccessMetrics(false), 5000);
      
      setPrompt("");
      fetchChatMessages(chatId);
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("ROI calculator error:", err);
      await Swal.fire({
        title: 'Error',
        text: err.message || 'Failed to calculate ROI',
        icon: 'error',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setTimeout(() => {
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
      }, 500);
    }
  };

  const handleSEOOptimizer = async () => {
    if (!prompt.trim()) {
      await Swal.fire({
        title: 'Website/Content Needed',
        text: 'Describe your website, page, or content for SEO optimization (e.g., "homepage for my bakery", "blog post about digital marketing", "product page for software")',
        icon: 'info',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }
  
    const progressInterval = startProgressAnimation();
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
  
    try {
      if (!user) {
        clearInterval(progressInterval);
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
        await Swal.fire({
          title: 'Authentication Required',
          text: 'Please log in to continue',
          icon: 'warning',
          confirmButtonText: 'Got it',
          background: '#1a1f3b',
          color: 'white',
          confirmButtonColor: '#4F46E5'
        });
        return;
      }
  
      const token = await user.getIdToken();
      let chatId = activeChatId;
      
      if (!chatId) {
        const chatDoc = await addDoc(collection(db, "chats"), {
          userId: user.uid,
          createdAt: serverTimestamp(),
          title: `🔍 SEO Optimizer: ${prompt.substring(0, 30)}...`,
        });
        chatId = chatDoc.id;
        setActiveChatId(chatId);
        fetchChats(user.uid);
      }
  
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        role: "user",
        text: `🔍 SEO Optimization For: ${prompt}`,
        createdAt: serverTimestamp(),
      });
  
      console.log("🔍 Optimizing SEO for:", prompt);
  
      const seoRes = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          prompt: `PROVIDE COMPREHENSIVE SEO OPTIMIZATION for: "${prompt}"
  
  Generate COMPLETE SEO strategy:
  
  🎯 **KEYWORD RESEARCH**
  - Primary Target Keywords (High Volume)
  - Secondary Keywords (Medium Volume)
  - Long-tail Keywords (Low Competition)
  - Competitor Keywords Analysis
  
  📝 **ON-PAGE SEO OPTIMIZATION**
  - Meta Title Tag (50-60 characters)
  - Meta Description (150-160 characters)
  - URL Structure Optimization
  - Header Tag Structure (H1, H2, H3)
  
  📄 **CONTENT OPTIMIZATION**
  - Keyword Density & Placement
  - Content Length Recommendations
  - Internal Linking Strategy
  - Content Freshness Plan
  
  🔗 **TECHNICAL SEO AUDIT**
  - Page Speed Optimization Tips
  - Mobile Responsiveness Check
  - Schema Markup Implementation
  - XML Sitemap Recommendations
  
  📊 **OFF-PAGE SEO STRATEGY**
  - Backlink Building Opportunities
  - Social Media Signal Optimization
  - Local SEO Optimization (if applicable)
  - Brand Mention Strategies
  
  📈 **PERFORMANCE TRACKING**
  - Key SEO Metrics to Monitor
  - Google Search Console Setup
  - Analytics Implementation
  - Ranking Position Tracking
  
  🚀 **COMPETITIVE ANALYSIS**
  - Top 3 Competitor SEO Strategies
  - Gap Analysis & Opportunities
  - Unique Value Proposition
  - Differentiation Strategy
  
  💡 **ACTION PLAN**
  - Immediate Actions (Next 7 days)
  - Short-term Goals (30 days)
  - Medium-term Strategy (3 months)
  - Long-term Vision (6-12 months)
  
  Provide specific, actionable recommendations with exact keyword suggestions and implementation steps.`,
          chatId 
        }),
        signal: controller.signal
      });
  
      if (!seoRes.ok) {
        const errorData = await seoRes.json();
        throw new Error(errorData.error || "SEO optimization failed");
      }
  
      const resultData = await seoRes.json();
      
      const metrics = calculateSuccessMetrics(resultData.result, 'seo');
      setSuccessMetrics(metrics);
      setShowSuccessMetrics(true);
      setTimeout(() => setShowSuccessMetrics(false), 5000);
      
      setPrompt("");
      fetchChatMessages(chatId);
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("SEO optimizer error:", err);
      await Swal.fire({
        title: 'Error',
        text: err.message || 'Failed to optimize SEO',
        icon: 'error',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setTimeout(() => {
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
      }, 500);
    }
  };

  const handleFinancialProjections = async () => {
    if (!prompt.trim()) {
      await Swal.fire({
        title: 'Business/Project Details Needed',
        text: 'Describe your business or project for financial projections (e.g., "startup coffee shop", "SaaS business", "ecommerce store", "consulting firm")',
        icon: 'info',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }
  
    const progressInterval = startProgressAnimation();
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
  
    try {
      if (!user) {
        clearInterval(progressInterval);
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
        await Swal.fire({
          title: 'Authentication Required',
          text: 'Please log in to continue',
          icon: 'warning',
          confirmButtonText: 'Got it',
          background: '#1a1f3b',
          color: 'white',
          confirmButtonColor: '#4F46E5'
        });
        return;
      }
  
      const token = await user.getIdToken();
      let chatId = activeChatId;
      
      if (!chatId) {
        const chatDoc = await addDoc(collection(db, "chats"), {
          userId: user.uid,
          createdAt: serverTimestamp(),
          title: `💰 Financial Projections: ${prompt.substring(0, 30)}...`,
        });
        chatId = chatDoc.id;
        setActiveChatId(chatId);
        fetchChats(user.uid);
      }
  
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        role: "user",
        text: `💰 Financial Projections For: ${prompt}`,
        createdAt: serverTimestamp(),
      });
  
      console.log("💰 Creating financial projections for:", prompt);
  
      const financeRes = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          prompt: `CREATE DETAILED FINANCIAL PROJECTIONS for: "${prompt}"
  
  Generate COMPREHENSIVE 3-year financial forecast:
  
  💰 **REVENUE PROJECTIONS**
  - Monthly Revenue Forecast (Year 1)
  - Quarterly Growth Projections
  - Revenue Streams Breakdown
  - Pricing Strategy Analysis
  
  📊 **EXPENSE BREAKDOWN**
  - Fixed Costs (Rent, Salaries, Utilities)
  - Variable Costs (COGS, Marketing, Commissions)
  - One-time Startup Costs
  - Operating Expense Ratios
  
  💵 **PROFIT & LOSS STATEMENT**
  - Gross Profit Margin Calculations
  - Operating Profit Projections
  - Net Profit Forecast
  - Break-even Analysis
  
  📈 **CASH FLOW PROJECTION**
  - Monthly Cash Inflows
  - Monthly Cash Outflows
  - Cash Balance Tracking
  - Working Capital Requirements
  
  🔄 **BALANCE SHEET PROJECTIONS**
  - Assets (Current & Fixed)
  - Liabilities (Short-term & Long-term)
  - Equity Calculations
  - Financial Ratios Analysis
  
  🎯 **KEY FINANCIAL METRICS**
  - Gross Margin Percentage
  - Operating Margin
  - Net Profit Margin
  - Return on Investment (ROI)
  
  📋 **FUNDING REQUIREMENTS**
  - Initial Capital Needs
  - Working Capital Requirements
  - Growth Funding Timeline
  - Investor Return Projections
  
  ⚠️ **RISK ANALYSIS & SENSITIVITY**
  - Best Case Scenario Projections
  - Expected Case Projections
  - Worst Case Scenario Projections
  - Key Risk Factors & Mitigation
  
  Provide specific numbers, percentages, and realistic industry benchmarks. Focus on actionable financial insights.`,
          chatId 
        }),
        signal: controller.signal
      });
  
      if (!financeRes.ok) {
        const errorData = await financeRes.json();
        throw new Error(errorData.error || "Financial projections failed");
      }
  
      const resultData = await financeRes.json();
      
      const metrics = calculateSuccessMetrics(resultData.result, 'finance');
      setSuccessMetrics(metrics);
      setShowSuccessMetrics(true);
      setTimeout(() => setShowSuccessMetrics(false), 5000);
      
      setPrompt("");
      fetchChatMessages(chatId);
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("Financial projections error:", err);
      await Swal.fire({
        title: 'Error',
        text: err.message || 'Failed to create financial projections',
        icon: 'error',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setTimeout(() => {
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
      }, 500);
    }
  };

  const handleKPIDashboard = async () => {
    if (!prompt.trim()) {
      await Swal.fire({
        title: 'Business/Department Needed',
        text: 'Describe your business, department, or project for KPI tracking (e.g., "marketing team", "ecommerce store", "SaaS product", "sales department")',
        icon: 'info',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }
  
    const progressInterval = startProgressAnimation();
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
  
    try {
      if (!user) {
        clearInterval(progressInterval);
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
        await Swal.fire({
          title: 'Authentication Required',
          text: 'Please log in to continue',
          icon: 'warning',
          confirmButtonText: 'Got it',
          background: '#1a1f3b',
          color: 'white',
          confirmButtonColor: '#4F46E5'
        });
        return;
      }
  
      const token = await user.getIdToken();
      let chatId = activeChatId;
      
      if (!chatId) {
        const chatDoc = await addDoc(collection(db, "chats"), {
          userId: user.uid,
          createdAt: serverTimestamp(),
          title: `📊 KPI Dashboard: ${prompt.substring(0, 30)}...`,
        });
        chatId = chatDoc.id;
        setActiveChatId(chatId);
        fetchChats(user.uid);
      }
  
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        role: "user",
        text: `📊 Create KPI Dashboard For: ${prompt}`,
        createdAt: serverTimestamp(),
      });
  
      console.log("📊 Creating KPI dashboard for:", prompt);
  
      const kpiRes = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          prompt: `CREATE A COMPREHENSIVE KPI DASHBOARD for: "${prompt}"
  
  Design a COMPLETE performance tracking system:
  
  🎯 **KEY PERFORMANCE INDICATORS (KPIs)**
  - 5-8 Critical Business Metrics
  - Leading vs Lagging Indicators
  - Industry Benchmark Comparisons
  - Target vs Actual Performance
  
  📈 **DASHBOARD VISUALIZATION LAYOUT**
  - Executive Summary Section
  - Real-time Performance Metrics
  - Trend Analysis Charts
  - Comparative Performance Views
  
  🔄 **DATA TRACKING & COLLECTION**
  - Data Sources & Integration Points
  - Automated Data Collection Methods
  - Manual Input Requirements
  - Data Validation Processes
  
  📊 **PERFORMANCE CATEGORIES**
  
  💰 **FINANCIAL KPIs**
  - Monthly Recurring Revenue (MRR)
  - Customer Acquisition Cost (CAC)
  - Lifetime Value (LTV)
  - Gross Margin Percentage
  - Burn Rate & Runway
  
  👥 **CUSTOMER KPIs**
  - Customer Satisfaction (CSAT/NPS)
  - Churn Rate & Retention
  - Customer Growth Rate
  - Support Ticket Resolution Time
  
  🚀 **MARKETING KPIs**
  - Conversion Rates by Channel
  - Cost Per Acquisition (CPA)
  - Marketing Qualified Leads (MQL)
  - Return on Marketing Investment
  
  🛠️ **OPERATIONAL KPIs**
  - Employee Productivity Metrics
  - Process Efficiency Scores
  - Quality Assurance Rates
  - Delivery/Service Level Agreements
  
  📱 **TECHNICAL KPIs**
  - System Uptime & Reliability
  - Page Load Speed
  - API Response Times
  - Security Incident Rates
  
  🔔 **ALERT & NOTIFICATION SYSTEM**
  - Performance Threshold Alerts
  - Automated Reporting Schedule
  - Escalation Procedures
  - Action Item Tracking
  
  📋 **IMPLEMENTATION ROADMAP**
  - Phase 1: Core Metrics (Week 1-2)
  - Phase 2: Advanced Analytics (Week 3-4)
  - Phase 3: Optimization (Month 2)
  - Phase 4: Scaling (Month 3+)
  
  Provide specific metric formulas, tracking tools recommendations, and implementation timelines.`,
          chatId 
        }),
        signal: controller.signal
      });
  
      if (!kpiRes.ok) {
        const errorData = await kpiRes.json();
        throw new Error(errorData.error || "KPI dashboard creation failed");
      }
  
      const resultData = await kpiRes.json();
      
      const metrics = calculateSuccessMetrics(resultData.result, 'kpi');
      setSuccessMetrics(metrics);
      setShowSuccessMetrics(true);
      setTimeout(() => setShowSuccessMetrics(false), 5000);
      
      setPrompt("");
      fetchChatMessages(chatId);
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("KPI dashboard error:", err);
      await Swal.fire({
        title: 'Error',
        text: err.message || 'Failed to create KPI dashboard',
        icon: 'error',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setTimeout(() => {
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
      }, 500);
    }
  };

  const handleCustomerJourney = async () => {
    if (!prompt.trim()) {
      await Swal.fire({
        title: 'Customer/Business Context Needed',
        text: 'Describe your customer type and business for journey mapping (e.g., "first-time home buyers for real estate", "small business owners for accounting services", "students for online courses")',
        icon: 'info',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }
  
    const progressInterval = startProgressAnimation();
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
  
    try {
      if (!user) {
        clearInterval(progressInterval);
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
        await Swal.fire({
          title: 'Authentication Required',
          text: 'Please log in to continue',
          icon: 'warning',
          confirmButtonText: 'Got it',
          background: '#1a1f3b',
          color: 'white',
          confirmButtonColor: '#4F46E5'
        });
        return;
      }
  
      const token = await user.getIdToken();
      let chatId = activeChatId;
      
      if (!chatId) {
        const chatDoc = await addDoc(collection(db, "chats"), {
          userId: user.uid,
          createdAt: serverTimestamp(),
          title: `🛣️ Customer Journey: ${prompt.substring(0, 30)}...`,
        });
        chatId = chatDoc.id;
        setActiveChatId(chatId);
        fetchChats(user.uid);
      }
  
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        role: "user",
        text: `🛣️ Map Customer Journey For: ${prompt}`,
        createdAt: serverTimestamp(),
      });
  
      console.log("🛣️ Mapping customer journey for:", prompt);
  
      const journeyRes = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          prompt: `CREATE A DETAILED CUSTOMER JOURNEY MAP for: "${prompt}"
  
  Map the COMPLETE customer experience:
  
  🎯 **CUSTOMER PERSONA PROFILE**
  - Demographic & Psychographic Details
  - Goals, Needs & Pain Points
  - Decision-Making Process
  - Key Influencers & Objections
  
  🛣️ **JOURNEY STAGES & TOUCHPOINTS**
  
  🔍 **AWARENESS STAGE**
  - Initial Problem Recognition
  - Information Search Channels
  - Brand Discovery Points
  - Content Consumption Patterns
  
  💡 **CONSIDERATION STAGE**
  - Solution Evaluation Criteria
  - Competitor Comparison Process
  - Trust-Building Activities
  - Objection Handling Needs
  
  🤝 **DECISION STAGE**
  - Final Decision Factors
  - Purchase Process Steps
  - Contract/Signup Experience
  - Onboarding Sequence
  
  ✅ **RETENTION STAGE**
  - Post-Purchase Experience
  - Product/Service Usage Patterns
  - Support & Service Interactions
  - Success Milestones
  
  🌟 **ADVOCACY STAGE**
  - Referral Triggers
  - Review & Testimonial Process
  - Community Engagement
  - Loyalty Program Participation
  
  📊 **CUSTOMER EMOTION MAPPING**
  - High Points & Peak Experiences
  - Pain Points & Frustration Areas
  - Moments of Truth & Delight
  - Emotional Journey Visualization
  
  🔄 **TOUCHPOINT ANALYSIS**
  - Digital Touchpoints (Website, App, Email)
  - Physical Touchpoints (Store, Office, Events)
  - Human Touchpoints (Sales, Support, Service)
  - Automated Touchpoints (Chatbots, Notifications)
  
  📈 **CONVERSION FUNNEL METRICS**
  - Stage-to-Stage Conversion Rates
  - Drop-off Points & Bottlenecks
  - Time Spent in Each Stage
  - Customer Effort Scores
  
  🚀 **OPTIMIZATION OPPORTUNITIES**
  - Quick Wins (30-day improvements)
  - Strategic Initiatives (3-6 month projects)
  - Technology & Automation Solutions
  - Personalization & Customization Ideas
  
  🔧 **IMPLEMENTATION ROADMAP**
  - Phase 1: Critical Pain Point Resolution
  - Phase 2: Experience Enhancement
  - Phase 3: Loyalty & Advocacy Building
  - Phase 4: Continuous Improvement
  
  Provide specific, actionable recommendations for each journey stage with measurable improvement targets.`,
          chatId 
        }),
        signal: controller.signal
      });
  
      if (!journeyRes.ok) {
        const errorData = await journeyRes.json();
        throw new Error(errorData.error || "Customer journey mapping failed");
      }
  
      const resultData = await journeyRes.json();
      
      const metrics = calculateSuccessMetrics(resultData.result, 'journey');
      setSuccessMetrics(metrics);
      setShowSuccessMetrics(true);
      setTimeout(() => setShowSuccessMetrics(false), 5000);
      
      setPrompt("");
      fetchChatMessages(chatId);
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("Customer journey error:", err);
      await Swal.fire({
        title: 'Error',
        text: err.message || 'Failed to map customer journey',
        icon: 'error',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setTimeout(() => {
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
      }, 500);
    }
  };

  const handleCrisisManagement = async () => {
    if (!prompt.trim()) {
      await Swal.fire({
        title: 'Business/Scenario Needed',
        text: 'Describe your business or potential crisis scenario (e.g., "restaurant food safety issue", "tech company data breach", "retail store PR crisis", "service business customer complaint")',
        icon: 'info',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }
  
    const progressInterval = startProgressAnimation();
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
  
    try {
      if (!user) {
        clearInterval(progressInterval);
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
        await Swal.fire({
          title: 'Authentication Required',
          text: 'Please log in to continue',
          icon: 'warning',
          confirmButtonText: 'Got it',
          background: '#1a1f3b',
          color: 'white',
          confirmButtonColor: '#4F46E5'
        });
        return;
      }
  
      const token = await user.getIdToken();
      let chatId = activeChatId;
      
      if (!chatId) {
        const chatDoc = await addDoc(collection(db, "chats"), {
          userId: user.uid,
          createdAt: serverTimestamp(),
          title: `🚨 Crisis Management: ${prompt.substring(0, 30)}...`,
        });
        chatId = chatDoc.id;
        setActiveChatId(chatId);
        fetchChats(user.uid);
      }
  
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        role: "user",
        text: `🚨 Crisis Management Plan For: ${prompt}`,
        createdAt: serverTimestamp(),
      });
  
      console.log("🚨 Creating crisis management plan for:", prompt);
  
      const crisisRes = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          prompt: `CREATE A COMPREHENSIVE CRISIS MANAGEMENT PLAN for: "${prompt}"
  
  Develop a ROBUST emergency response strategy:
  
  🚨 **CRISIS IDENTIFICATION & ASSESSMENT**
  - Potential Crisis Scenarios
  - Risk Probability & Impact Matrix
  - Early Warning Indicators
  - Crisis Severity Classification
  
  👥 **CRISIS RESPONSE TEAM**
  - Team Roles & Responsibilities
  - Decision-Making Authority
  - Communication Chain of Command
  - Backup & Succession Planning
  
  📞 **IMMEDIATE RESPONSE PROTOCOL (First 24 Hours)**
  - Initial Assessment & Fact-Finding
  - Internal Communication Procedures
  - External Communication Strategy
  - Legal & Regulatory Considerations
  
  💬 **COMMUNICATION STRATEGY**
  
  🎯 **STAKEHOLDER COMMUNICATION**
  - Customers: Messaging Templates
  - Employees: Internal Announcements
  - Media: Press Releases & Statements
  - Investors/Board: Official Updates
  
  🛡️ **DIGITAL COMMUNICATION**
  - Social Media Response Plan
  - Website Updates & Notifications
  - Email Communication Templates
  - Online Reputation Management
  
  📋 **CRISIS-SPECIFIC RESPONSE PLANS**
  
  🔐 **DATA BREACH/SECURITY INCIDENT**
  - Technical Containment Procedures
  - Customer Notification Requirements
  - Regulatory Compliance Steps
  - System Recovery Timeline
  
  📰 **PUBLIC RELATIONS CRISIS**
  - Media Response Framework
  - Spokesperson Training
  - Message Consistency Guidelines
  - Rebuilding Trust Strategy
  
  ⚖️ **LEGAL/COMPLIANCE ISSUES**
  - Legal Counsel Engagement
  - Regulatory Reporting Requirements
  - Document Preservation Procedures
  - Settlement/Negotiation Strategies
  
  🔄 **OPERATIONAL DISRUPTION**
  - Business Continuity Procedures
  - Alternative Operation Methods
  - Supply Chain Contingency Plans
  - Customer Service Alternatives
  
  📊 **RECOVERY & RESOLUTION**
  - Short-term Recovery Actions (1-7 days)
  - Medium-term Restoration (1-4 weeks)
  - Long-term Improvement (1-6 months)
  - Post-Crisis Evaluation Process
  
  🔍 **POST-CRISIS ANALYSIS**
  - Root Cause Investigation
  - Impact Assessment & Documentation
  - Lessons Learned & Process Improvements
  - Plan Updates & Revisions
  
  📈 **PREVENTION & PREPAREDNESS**
  - Regular Risk Assessments
  - Employee Training Programs
  - Crisis Simulation Exercises
  - Continuous Plan Updates
  
  Provide specific, actionable templates and step-by-step procedures for immediate implementation.`,
          chatId 
        }),
        signal: controller.signal
      });
  
      if (!crisisRes.ok) {
        const errorData = await crisisRes.json();
        throw new Error(errorData.error || "Crisis management planning failed");
      }
  
      const resultData = await crisisRes.json();
      
      const metrics = calculateSuccessMetrics(resultData.result, 'crisis');
      setSuccessMetrics(metrics);
      setShowSuccessMetrics(true);
      setTimeout(() => setShowSuccessMetrics(false), 5000);
      
      setPrompt("");
      fetchChatMessages(chatId);
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("Crisis management error:", err);
      await Swal.fire({
        title: 'Error',
        text: err.message || 'Failed to create crisis management plan',
        icon: 'error',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setTimeout(() => {
        setGenerationProgress(0);
        setLoading(false);
        setAbortController(null);
      }, 500);
    }
  };

  // ---- CHAT: DELETE ----
  const handleDeleteChat = async (chatId) => {
    try {
      const confirm = await Swal.fire({
        title: "Delete this chat?",
        text: "This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it",
        cancelButtonText: "Cancel",
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5',
        cancelButtonColor: '#6B7280'
      });

      if (confirm.isConfirmed) {
        await deleteDoc(doc(db, "chats", chatId));
        setActiveChatId(null);
        setChatMessages([]);
        fetchChats(user?.uid);
        
        await Swal.fire({
          title: 'Deleted!',
          text: 'Your chat has been deleted.',
          icon: 'success',
          confirmButtonText: 'Got it',
          background: '#1a1f3b',
          color: 'white',
          confirmButtonColor: '#4F46E5'
        });
      }
    } catch (err) {
      console.error("handleDeleteChat error:", err);
      await Swal.fire({
        title: 'Error',
        text: 'Failed to delete chat.',
        icon: 'error',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/auth");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // ---- UI ----
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a0f1f] via-[#1a1f3b] to-[#2a0f3f] text-white relative">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-4 left-4 z-50 p-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 md:hidden"
      >
        {sidebarOpen ? "✖" : "☰"}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col rounded-tr-3xl rounded-br-3xl shadow-lg transform transition-transform duration-300 z-40
  w-64 md:w-72
  ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="p-6 border-b border-white/10 flex flex-col space-y-3">
        <h1
  onClick={() => router.push("/landing")}
  className="text-2xl md:text-3xl font-extrabold tracking-tight cursor-pointer hover:opacity-80 transition"
  title="Go to landing page"
>
  <span className="text-white">Buz</span>
  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-500">
    AI
  </span>
</h1>

          <button
            onClick={() => {
              setActiveChatId(null);
              setChatMessages([]);
              setPrompt("");
              setFile(null);
              setFileName("");
            }}
            className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400 py-2 rounded-full transition font-semibold text-white shadow-lg"
          >
            + New Chat
          </button>
        </div>

        {/* Chat History */}
<div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
  {history.length === 0 ? (
    <p className="text-gray-400 text-sm text-center">No chats yet.</p>
  ) : (
    (() => {
      const groupedChats = {};
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      history.forEach((chat) => {
        let chatDate;
        if (chat.createdAt && typeof chat.createdAt.toDate === 'function') {
          chatDate = chat.createdAt.toDate();
        } else if (chat.createdAt) {
          chatDate = new Date(chat.createdAt);
        } else {
          chatDate = new Date();
        }
        
        const dateStr = chatDate.toDateString();
        let groupName;
        
        if (dateStr === today.toDateString()) {
          groupName = "Today";
        } else if (dateStr === yesterday.toDateString()) {
          groupName = "Yesterday";
        } else {
          const day = String(chatDate.getDate()).padStart(2, '0');
          const month = String(chatDate.getMonth() + 1).padStart(2, '0');
          const year = chatDate.getFullYear();
          groupName = `${day}/${month}/${year}`;
        }
        
        if (!groupedChats[groupName]) {
          groupedChats[groupName] = [];
        }
        groupedChats[groupName].push(chat);
      });

      return Object.entries(groupedChats).map(([dateGroup, chats]) => (
        <div key={dateGroup} className="space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
            {dateGroup}
          </div>
          
          <div className="space-y-2">
            {chats.map((chat) => {
              const isActive = activeChatId === chat.id;
              return (
                <div
                  key={chat.id}
                  className={`group relative p-3 rounded-2xl cursor-pointer flex justify-between items-center shadow-md transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                  style={{
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                  }}
                >
                  <p
                    onClick={() => {
                      fetchChatMessages(chat.id);
                      setSidebarOpen(false);
                    }}
                    className="truncate text-sm flex-1 group-hover:text-indigo-200 transition-colors duration-200 text-left"
                  >
                    {chat.title || "Untitled Chat"}
                  </p>
                  <button
                    onClick={() => handleDeleteChat(chat.id)}
                    className="ml-2 text-red-400 hover:text-red-500 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                    title="Delete chat"
                  >
                    🗑
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ));
    })()
  )}
</div>

        {/* Footer (Profile + Logout) */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            onClick={() => router.push("/profile")}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 py-2 rounded-full transition font-semibold shadow-lg"
          >
            Profile
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 py-2 rounded-full transition font-semibold shadow-lg"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Chat */}
      <main className="flex-1 flex flex-col md:ml-72">
        <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-4 custom-scrollbar">
          {/* Progress Bar when loading */}
          {(loading || imgLoading) && generationProgress > 0 && (
            <div className="flex justify-center mb-6">
              <ProgressBar 
                progress={generationProgress} 
                message={
                  imgLoading ? "🚀 Creating your ultimate marketing package..." : 
                  loading ? "💭 Generating expert response..." : 
                  "Processing your request..."
                }
                estimatedTime={imgLoading ? "45-60 seconds" : "15-30 seconds"}
              />
            </div>
          )}

          {activeChatId ? (
            chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 md:px-5 py-2 md:py-3 rounded-2xl md:rounded-3xl max-w-[85%] md:max-w-4xl whitespace-pre-line shadow-lg transition ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                      : "bg-black/30 backdrop-blur-md text-gray-200 border border-white/10"
                  }`}
                >
                  <CustomMarkdown>{msg.text}</CustomMarkdown>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center mt-20 px-4">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3 text-center">
  Start your new idea with {""}
  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-500">BuzAI
  </span>
</h2>

              <p className="max-w-md text-gray-400 text-sm md:text-base">
                Your AI assistant for building and upgrading businesses, and creating social media content.
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <form
          onSubmit={handlePromptSubmit}
          className="p-3 md:p-4 border-t border-white/10 flex flex-wrap gap-2 md:gap-3 bg-gradient-to-br from-[#0a0f1f] via-[#1a1f3b] to-[#2a0f3f] sticky bottom-0"
        >
          <input
            type="text"
            placeholder="Type your message..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 p-3 md:p-4 rounded-full border-none text-black placeholder-gray-500 focus:outline-none shadow-inner bg-white min-w-[120px]"
          />

          {/* File upload */}
          <input
            type="file"
            className="hidden"
            id="fileUpload"
            onChange={(e) => {
              if (e.target.files[0]) {
                setFile(e.target.files[0]);
                setFileName(e.target.files[0].name);
              }
            }}
          />
          <label
            htmlFor="fileUpload"
            className="bg-gray-500 hover:bg-gray-600 px-4 md:px-5 py-2 md:py-3 rounded-full text-white cursor-pointer transition shadow"
            title={fileName || "Attach a file"}
          >
            📎
          </label>

          {file && (
            <div className="flex items-center space-x-2 text-gray-200">
              <span className="truncate max-w-[120px] md:max-w-[140px]">{fileName}</span>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setFileName("");
                  const input = document.getElementById("fileUpload");
                  if (input) input.value = null;
                }}
                className="text-red-400 hover:text-red-600 transition"
                title="Remove file"
              >
                ❌
              </button>
            </div>
          )}

<div className="flex flex-wrap gap-2">
  {/* Regular Send Button */}
  <button
    type="submit"
    disabled={loading}
    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 px-4 md:px-6 py-2 md:py-3 rounded-full text-white font-semibold shadow-lg transition"
  >
    {loading ? "Thinking..." : "Send"}
  </button>

  {/* Special Tools Dropdown */}
<div className="relative">
  <button
    type="button"
    className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 px-4 md:px-5 py-2 md:py-3 rounded-full text-white font-semibold shadow-lg transition flex items-center gap-2"
    onClick={() => setShowTools(!showTools)}
  >
    🛠️ Special Tools
    <span className="text-xs">▼</span>
  </button>

  {/* Dropdown Menu - NOW APPEARS ABOVE */}
{showTools && (
  <div className="absolute bottom-full left-0 mb-2 w-56 bg-gray-800/95 backdrop-blur-lg border border-gray-600 rounded-xl shadow-2xl z-50 p-2 max-h-96 overflow-y-auto">
    {/* Marketing Package */}
    <button
      onClick={() => {
        handleGenerateMarketingPackage();
        setShowTools(false);
      }}
      disabled={imgLoading}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/50 transition flex items-center gap-2 text-sm text-white mb-1"
    >
      <span className="text-green-400">🚀</span>
      Marketing Package
      {imgLoading && (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white ml-auto"></div>
      )}
    </button>

    {/* Business Mentor */}
    <button
      onClick={() => {
        handleBusinessMentor();
        setShowTools(false);
      }}
      disabled={loading}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/50 transition flex items-center gap-2 text-sm text-white mb-1"
    >
      <span className="text-blue-400">👔</span>
      Business Mentor
      {loading && (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white ml-auto"></div>
      )}
    </button>

    {/* Competitor Analysis */}
    <button
      onClick={() => {
        handleCompetitorAnalysis();
        setShowTools(false);
      }}
      disabled={loading}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/50 transition flex items-center gap-2 text-sm text-white mb-1"
    >
      <span className="text-orange-400">🔍</span>
      Competitor Analysis
      {loading && (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white ml-auto"></div>
      )}
    </button>

    {/* Divider */}
    <div className="border-t border-gray-600 my-2"></div>

    {/* PRIORITY 1 TOOLS */}
    
    {/* Ad Copy Generator */}
    <button
      onClick={() => {
        handleAdCopyGenerator();
        setShowTools(false);
      }}
      disabled={loading}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/50 transition flex items-center gap-2 text-sm text-white mb-1"
    >
      <span className="text-purple-400">📢</span>
      Ad Copy Generator
      {loading && (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white ml-auto"></div>
      )}
    </button>

    {/* Content Calendar Builder */}
    <button
      onClick={() => {
        handleContentCalendar();
        setShowTools(false);
      }}
      disabled={loading}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/50 transition flex items-center gap-2 text-sm text-white mb-1"
    >
      <span className="text-yellow-400">📅</span>
      Content Calendar
      {loading && (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white ml-auto"></div>
      )}
    </button>

    {/* Email Campaign Builder */}
    <button
      onClick={() => {
        handleEmailCampaign();
        setShowTools(false);
      }}
      disabled={loading}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/50 transition flex items-center gap-2 text-sm text-white mb-1"
    >
      <span className="text-red-400">📧</span>
      Email Campaigns
      {loading && (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white ml-auto"></div>
      )}
    </button>

    {/* SWOT Analysis */}
    <button
      onClick={() => {
        handleSWOTAnalysis();
        setShowTools(false);
      }}
      disabled={loading}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/50 transition flex items-center gap-2 text-sm text-white mb-1"
    >
      <span className="text-teal-400">⚖️</span>
      SWOT Analysis
      {loading && (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white ml-auto"></div>
      )}
    </button>

    {/* Divider */}
    <div className="border-t border-gray-600 my-2"></div>

    {/* PRIORITY 2 TOOLS */}
    
    {/* ROI Calculator */}
    <button
      onClick={() => {
        handleROICalculator();
        setShowTools(false);
      }}
      disabled={loading}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/50 transition flex items-center gap-2 text-sm text-white mb-1"
    >
      <span className="text-indigo-400">📈</span>
      ROI Calculator
      {loading && (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white ml-auto"></div>
      )}
    </button>

    {/* SEO Optimizer */}
    <button
      onClick={() => {
        handleSEOOptimizer();
        setShowTools(false);
      }}
      disabled={loading}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/50 transition flex items-center gap-2 text-sm text-white mb-1"
    >
      <span className="text-green-400">🔍</span>
      SEO Optimizer
      {loading && (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white ml-auto"></div>
      )}
    </button>

    {/* Financial Projections */}
    <button
      onClick={() => {
        handleFinancialProjections();
        setShowTools(false);
      }}
      disabled={loading}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/50 transition flex items-center gap-2 text-sm text-white mb-1"
    >
      <span className="text-yellow-400">💰</span>
      Financial Projections
      {loading && (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white ml-auto"></div>
      )}
    </button>

    {/* NEW DIVIDER */}
    <div className="border-t border-gray-600 my-2"></div>

    {/* PRIORITY 3 TOOLS */}
    
    {/* KPI Dashboard Generator */}
    <button
      onClick={() => {
        handleKPIDashboard();
        setShowTools(false);
      }}
      disabled={loading}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/50 transition flex items-center gap-2 text-sm text-white mb-1"
    >
      <span className="text-purple-400">📊</span>
      KPI Dashboard
      {loading && (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white ml-auto"></div>
      )}
    </button>

    {/* Customer Journey Mapper */}
    <button
      onClick={() => {
        handleCustomerJourney();
        setShowTools(false);
      }}
      disabled={loading}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/50 transition flex items-center gap-2 text-sm text-white mb-1"
    >
      <span className="text-teal-400">🛣️</span>
      Customer Journey
      {loading && (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white ml-auto"></div>
      )}
    </button>

    {/* Crisis Management Planner */}
    <button
      onClick={() => {
        handleCrisisManagement();
        setShowTools(false);
      }}
      disabled={loading}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/50 transition flex items-center gap-2 text-sm text-white"
    >
      <span className="text-red-400">🚨</span>
      Crisis Management
      {loading && (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white ml-auto"></div>
      )}
    </button>
  </div>
)}
</div>

  {/* STOP BUTTON - Shows only when generating */}
  {(loading || imgLoading) && (
    <button
      type="button"
      onClick={handleStopGeneration}
      className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 px-4 py-2 md:py-3 rounded-full text-white font-semibold shadow-lg transition"
    >
      Stop
    </button>
  )}
</div>
</form>
</main>

{/* Success Metrics Popup */}
{showSuccessMetrics && successMetrics && (
  <SuccessMetrics 
    metrics={successMetrics} 
    onClose={() => setShowSuccessMetrics(false)} 
  />
)}
</div>
  );
}

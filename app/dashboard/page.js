
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
//import firebaseApp, { auth, db } from "@/firebase";
import { auth } from '@/firebase';
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
          // Enhanced code block with copy functionality
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeContent = String(children).replace(/\n$/, '');
            const index = Math.random(); // Simple unique key

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
                      {copiedCode === index ? (
                        <>✅ Copied!</>
                      ) : (
                        <>📋 Copy</>
                      )}
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

          // Enhanced headers with gradients and icons
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b border-gray-700 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold mt-5 mb-3 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-300" {...props} />
          ),

          // Enhanced lists
          ul: ({ node, ...props }) => (
            <ul className="my-3 space-y-2 list-disc list-inside text-gray-300" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="my-3 space-y-2 list-decimal list-inside text-gray-300" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="pl-2 text-gray-300" {...props} />
          ),

          // Enhanced blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic bg-blue-900/20 py-2 rounded-r-lg text-gray-300" {...props} />
          ),

          // Enhanced tables
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

          // Enhanced paragraphs
          p: ({ node, ...props }) => {
            const hasImage = node.children?.some(child => 
              child.type === 'element' && child.tagName === 'img'
            );
            
            if (hasImage) {
              return <>{props.children}</>;
            }
            
            return <p className="my-3 text-gray-300 leading-relaxed" {...props} />;
          },

          // Enhanced links
          a: ({ node, ...props }) => (
            <a className="text-blue-400 hover:text-blue-300 underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />
          ),

          // Enhanced images
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

          // Enhanced horizontal rule
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-gray-700" {...props} />
          ),

          // Enhanced strong/bold
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-white" {...props} />
          ),

          // Enhanced emphasis/italic
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

// ... (rest of your component code remains exactly the same)

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

  // ---- AUTH + ACCESS GATE ----
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/");
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
      console.log("🛑 Generation stopped by user");
      
    }
  };

  // ---- CHAT: TEXT + FILE ----
  const handlePromptSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() && !file) return;
    
    // Create new AbortController for this request
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);

    let userMessageRef = null; // Track the user message

    try {
      if (!user) {
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

      // ---- Trial chat limit is now handled in backend ----
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

      // ---- Create chat if needed ----
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

      // ---- Save user message and track the reference ----
      userMessageRef = await addDoc(collection(db, `chats/${chatId}/messages`), {
        role: "user",
        text: prompt || `📎 Uploaded file: ${file?.name}`,
        createdAt: serverTimestamp(),
      });

      const token = await user.getIdToken();

      // ✅ UPLOAD FILE FIRST (if present)
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
          // Show backend error message directly
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

      // ✅ THEN SEND PROMPT TO GENERATE API
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

      // Handle backend errors - DON'T throw, just show the message
      if (!generateRes.ok) {
        setLoading(false);
        setAbortController(null);
        // Show the beautiful backend error message directly
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
      setLoading(false);
      setAbortController(null);
    }
  };

  // ---- COMPREHENSIVE MARKETING PACKAGE GENERATION ----
  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      await Swal.fire({
        title: 'Description Needed',
        text: 'Describe your business or marketing topic (e.g., "new chocolate store opening", "fitness center launch", "digital marketing agency services").',
        icon: 'info',
        confirmButtonText: 'Got it',
        background: '#1a1f3b',
        color: 'white',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }
    
    // Create new AbortController for this request
    const controller = new AbortController();
    setAbortController(controller);
    setImgLoading(true);

    let userMessageRef = null; // Track the user message

    try {
      if (!user) {
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
          title: `📊 ${prompt.substring(0, 30)}... (marketing package)`,
        });
        chatId = chatDoc.id;
        setActiveChatId(chatId);
        fetchChats(user.uid);
      }

      // Save user's marketing package request
      userMessageRef = await addDoc(collection(db, `chats/${chatId}/messages`), {
        role: "user",
        text: `📊 Generate marketing package: ${prompt}`,
        createdAt: serverTimestamp(),
      });

      console.log("📊 Generating comprehensive marketing package for:", prompt);

      const res = await fetch("/api/generatePost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
        signal: controller.signal
      });

      // Check if request was aborted
      if (controller.signal.aborted) {
        console.log("🛑 Marketing package generation cancelled");
        if (userMessageRef) {
          await deleteDoc(userMessageRef);
        }
        return;
      }

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch {
          setImgLoading(false);
          setAbortController(null);
          await Swal.fire({
            title: 'Request Failed',
            text: 'Marketing package generation failed. Please try again.',
            icon: 'error',
            confirmButtonText: 'Got it',
            background: '#1a1f3b',
            color: 'white',
            confirmButtonColor: '#4F46E5'
          });
          return;
        }
        
        // Show backend error message directly
        setImgLoading(false);
        setAbortController(null);
        await Swal.fire({
          title: errorData.error?.includes('Limit') ? 'Marketing Limit Reached' : 'Generation Failed',
          text: errorData.error || "Marketing package generation failed",
          icon: errorData.error?.includes('Limit') ? 'info' : 'error',
          confirmButtonText: 'Understand',
          background: '#1a1f3b',
          color: 'white',
          confirmButtonColor: '#4F46E5'
        });
        return;
      }

      const data = await res.json();

      if (data.error) {
        setImgLoading(false);
        setAbortController(null);
        await Swal.fire({
          title: 'Error',
          text: data.error,
          icon: 'error',
          confirmButtonText: 'Got it',
          background: '#1a1f3b',
          color: 'white',
          confirmButtonColor: '#4F46E5'
        });
        return;
      }

      // Save the complete marketing package to chat
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        role: "assistant",
        text: data.marketingPackage,
        createdAt: serverTimestamp(),
      });

      console.log("✅ Professional marketing package generated and saved");

      setPrompt("");
      fetchChatMessages(chatId);
    } catch (err) {
      // Don't show error if it was an abort
      if (err.name === 'AbortError') {
        console.log("🛑 Marketing package generation cancelled");
        if (userMessageRef) {
          await deleteDoc(userMessageRef);
        }
        return;
      }
      console.error("handleGenerateImage error:", err);
      
      // Use SweetAlert2 for beautiful error messages
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
      setImgLoading(false);
      setAbortController(null);
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
      router.push("/");
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

          {/* NEW: Start New Chat Button */}
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
      // Group chats by date
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
          // European format: DD/MM/YYYY
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
          {/* Date Group Header */}
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
            {dateGroup}
          </div>
          
          {/* Chats for this date group */}
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
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 px-4 md:px-6 py-2 md:py-3 rounded-full text-white font-semibold shadow-lg transition"
            >
              {loading ? "Thinking..." : "Send"}
            </button>

            <button
  type="button"
  onClick={handleGenerateImage}
  disabled={imgLoading}
  className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 px-4 md:px-5 py-2 md:py-3 rounded-full text-white font-semibold shadow-lg transition"
  title="Generate complete social media marketing package"
>
  {imgLoading ? "📊 Creating Package..." : "📊 Create Marketing Package"}
</button>

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
    </div>
  );
}

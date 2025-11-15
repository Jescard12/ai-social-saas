'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Swal from 'sweetalert2';

// Wrap the main content in a separate component for Suspense
function PendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const status = searchParams.get('status');
  const message = searchParams.get('message');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/');
        return;
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0f1f] via-[#1a1f3b] to-[#2a0f3f] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1f] via-[#1a1f3b] to-[#2a0f3f] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-yellow-500 rounded-full flex items-center justify-center">
          <span className="text-2xl">⏳</span>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Account Pending</h1>
        
        <div className="bg-white/10 rounded-lg p-4 mb-6">
          <p className="text-lg mb-4">
            Your account is currently under review. This usually takes 24-48 hours.
          </p>
          
          {status && (
            <p className="text-sm text-gray-300 mb-2">
              Status: <span className="font-semibold">{status}</span>
            </p>
          )}
          
          {message && (
            <p className="text-sm text-gray-300">
              Message: <span className="font-semibold">{message}</span>
            </p>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            You'll receive an email when your account is approved.
          </p>
          <p className="text-sm text-gray-400">
            Contact support if you have any questions.
          </p>
        </div>

        <button
          onClick={() => router.push('/profile')}
          className="w-full mt-6 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 py-3 rounded-full font-semibold transition shadow-lg"
        >
          Check Profile
        </button>
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function PendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0a0f1f] via-[#1a1f3b] to-[#2a0f3f] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <PendingContent />
    </Suspense>
  );
}
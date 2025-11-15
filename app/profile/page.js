'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/');
        return;
      }
      setUser(currentUser);
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUpgrade = () => {
    router.push('/billing');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0f1f] via-[#1a1f3b] to-[#2a0f3f] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1f] via-[#1a1f3b] to-[#2a0f3f] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Profile</h1>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl mb-6">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Email:</span>
              <span className="font-semibold">{user?.email}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-300">Plan:</span>
              <span className={`font-semibold ${
                userData?.status === 'approved' ? 'text-green-400' : 
                userData?.status === 'trial' ? 'text-blue-400' : 'text-yellow-400'
              }`}>
                {userData?.status?.toUpperCase() || 'Loading...'}
              </span>
            </div>
            
            {userData?.trialEnd && (
              <div className="flex justify-between">
                <span className="text-gray-300">Trial Ends:</span>
                <span className="font-semibold">
                  {new Date(userData.trialEnd?.toDate?.() || userData.trialEnd).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400 py-3 rounded-full font-semibold transition shadow-lg"
          >
            Upgrade Plan
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 py-3 rounded-full font-semibold transition shadow-lg"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { app } from "../../firebase";
 // make sure firebase.js is set up correctly
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";


export default function AdminPage() {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Only allow admins (add your email here)
  const adminEmails = ["sakoadmin@gmail.com", "secondadmin@gmail.com"];

  // Track logged-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        if (!adminEmails.includes(currentUser.email)) {
          router.push("/"); // not admin → send to landing
        } else {
          fetchPendingUsers();
        }
      } else {
        router.push("/signin"); // not logged in
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch pending users
  const fetchPendingUsers = async () => {
    setLoading(true);
    const q = query(collection(db, "users"), where("status", "==", "pending"));
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((docSnap) => {
      users.push({ id: docSnap.id, ...docSnap.data() });
    });
    setPendingUsers(users);
    setLoading(false);
  };

  // Approve user
  const handleApprove = async (id) => {
    await updateDoc(doc(db, "users", id), { status: "approved" });
    fetchPendingUsers();
  };

  // Deny user
  const handleDeny = async (id) => {
    await updateDoc(doc(db, "users", id), { status: "denied" });
    fetchPendingUsers();
  };

  if (loading) return <div className="p-6">Loading pending users...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Panel – Pending Users</h1>

      {pendingUsers.length === 0 ? (
        <p className="text-gray-500">No pending users 🎉</p>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((u) => (
            <Card key={u.id} className="shadow-md rounded-xl">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{u.email}</p>
                  <p className="text-sm text-gray-500">
                    Reference: {u.paymentReference || "N/A"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleApprove(u.id)} className="bg-green-600 hover:bg-green-700">
                    ✅ Approve
                  </Button>
                  <Button onClick={() => handleDeny(u.id)} className="bg-red-600 hover:bg-red-700">
                    ❌ Deny
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// /firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDAw5zBgF7JlxIOcmBj1vsAjY1sSbVY6DY",
  authDomain: "ai-social-saas-1de62.firebaseapp.com",
  projectId: "ai-social-saas-1de62",
  storageBucket: "ai-social-saas-1de62.appspot.com",
  messagingSenderId: "826184746431",
  appId: "1:826184746431:web:97eb40e0e33bc70161cd0a",
};

// ✅ Prevent multiple app initializations
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✅ Initialize all services once
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app as firebaseApp, auth, db, storage };
export default app;
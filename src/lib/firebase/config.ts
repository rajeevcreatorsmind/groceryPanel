import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase config (use your exact keys)
const firebaseConfig = {
  apiKey: "AIzaSyCC3ocZbmqZyCo003MnBzOm9WDFB_lsLdc",
  authDomain: "creator-mind-9e81d.firebaseapp.com",
  projectId: "creator-mind-9e81d",
  storageBucket: "creator-mind-9e81d.firebasestorage.app",
  messagingSenderId: "634836105720",
  appId: "1:634836105720:web:112c9fbc1d079b44743e0d",
  measurementId: "G-VK4KCX4QGL"
};

// Initialize Firebase only once
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };
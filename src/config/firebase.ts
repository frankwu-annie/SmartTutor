import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
/* const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
}; */

const firebaseConfig = {
  apiKey: "AIzaSyDe1uNf8i9CTiu2wie8SlWQUwBtpRtQ7BY",
  authDomain: "kidslearning-c8106.firebaseapp.com",
  databaseURL: "https://kidslearning-c8106-default-rtdb.firebaseio.com",
  projectId: "kidslearning-c8106",
  storageBucket: "kidslearning-c8106.firebasestorage.app",
  messagingSenderId: "688463689107",
  appId: "1:688463689107:web:5e9af0dd1f4a2cd805e466",
  measurementId: "G-B8MDMBKQFW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;

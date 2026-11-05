import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import type { OPDToken, PrescriptionResult, CitizenProfile } from '../types';

// Default Firebase Configuration (can be overridden via environment variables or UI settings modal)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForVizagArogyaBandhu2026",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "arogya-bandhu-ap.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "arogya-bandhu-ap",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "arogya-bandhu-ap.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1029384756:web:a1b2c3d4e5f6"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let isFirebaseLive = false;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  isFirebaseLive = true;
} catch (err) {
  console.warn("Firebase initialized with local offline fallback mode:", err);
  isFirebaseLive = false;
}

export { app, db, auth, storage, isFirebaseLive };

/**
 * Saves a newly booked OPD pass to Cloud Firestore and local storage backup
 */
export async function saveOPDToken(token: OPDToken): Promise<boolean> {
  // Always save to localStorage first for instant offline reliability for senior citizens
  try {
    const existingStr = localStorage.getItem('arogya_bandhu_booked_tokens');
    const existing: OPDToken[] = existingStr ? JSON.parse(existingStr) : [];
    const updated = [token, ...existing.filter(t => t.id !== token.id)];
    localStorage.setItem('arogya_bandhu_booked_tokens', JSON.stringify(updated));
  } catch (e) {
    console.error("Local storage error:", e);
  }

  // Attempt Cloud Firestore push
  if (db && isFirebaseLive) {
    try {
      const colRef = collection(db, 'opd_tokens');
      await addDoc(colRef, {
        ...token,
        syncedAt: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.warn("Firestore save token note (using local cache):", err);
      return true;
    }
  }
  return true;
}

/**
 * Retrieves booked tokens from Firestore or fallback localStorage
 */
export async function fetchOPDTokens(fallbackTokens: OPDToken[]): Promise<OPDToken[]> {
  const localStr = localStorage.getItem('arogya_bandhu_booked_tokens');
  const localTokens: OPDToken[] = localStr ? JSON.parse(localStr) : [];

  if (db && isFirebaseLive) {
    try {
      const q = query(collection(db, 'opd_tokens'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const firestoreTokens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OPDToken));
      if (firestoreTokens.length > 0) {
        return [...localTokens, ...firestoreTokens.filter(f => !localTokens.some(l => l.tokenNumber === f.tokenNumber))];
      }
    } catch (err) {
      console.warn("Using offline tokens:", err);
    }
  }

  return localTokens.length > 0 ? localTokens : fallbackTokens;
}

/**
 * Saves prescription scan results to Firestore
 */
export async function savePrescriptionRecord(data: PrescriptionResult): Promise<boolean> {
  try {
    const existingStr = localStorage.getItem('arogya_bandhu_recent_prescriptions');
    const existing: PrescriptionResult[] = existingStr ? JSON.parse(existingStr) : [];
    localStorage.setItem('arogya_bandhu_recent_prescriptions', JSON.stringify([data, ...existing.slice(0, 9)]));
  } catch (e) {
    console.error("Local storage prescription error:", e);
  }

  if (db && isFirebaseLive) {
    try {
      const colRef = collection(db, 'prescriptions');
      await addDoc(colRef, {
        ...data,
        createdAt: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.warn("Firestore prescription log note:", err);
    }
  }
  return true;
}

/**
 * Saves citizen profile to Firestore
 */
export async function saveCitizenRecord(profile: CitizenProfile): Promise<boolean> {
  if (db && isFirebaseLive) {
    try {
      const colRef = collection(db, 'citizen_records');
      await addDoc(colRef, {
        ...profile,
        createdAt: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.warn("Firestore citizen record note:", err);
    }
  }
  return true;
}

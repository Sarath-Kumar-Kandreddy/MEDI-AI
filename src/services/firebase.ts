import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import type { OPDToken, PrescriptionResult, CitizenProfile } from '../types';

// Check if a real user-supplied Firebase config exists
const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY || "";
const hasRealFirebaseKey = Boolean(rawApiKey && !rawApiKey.includes("Dummy"));

const firebaseConfig = {
  apiKey: rawApiKey || "AIzaSyDummyKeyForVizagArogyaBandhu2026",
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

if (hasRealFirebaseKey) {
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
} else {
  // Offline local-first mode
  isFirebaseLive = false;
}

export { app, db, auth, storage, isFirebaseLive };

/**
 * Saves a newly booked OPD pass instantly to localStorage and optionally to Firestore
 */
export async function saveOPDToken(token: OPDToken): Promise<boolean> {
  // Always save immediately to localStorage for zero-latency instant booking
  try {
    const existingStr = localStorage.getItem('arogya_bandhu_booked_tokens');
    const existing: OPDToken[] = existingStr ? JSON.parse(existingStr) : [];
    const updated = [token, ...existing.filter(t => t.id !== token.id)];
    localStorage.setItem('arogya_bandhu_booked_tokens', JSON.stringify(updated));
  } catch (e) {
    console.error("Local storage error:", e);
  }

  // Non-blocking Firestore push if live
  if (db && isFirebaseLive) {
    try {
      const colRef = collection(db, 'opd_tokens');
      addDoc(colRef, {
        ...token,
        syncedAt: new Date().toISOString()
      }).catch(err => {
        console.warn("Async Firestore token note:", err);
      });
    } catch (err) {
      console.warn("Firestore save token note:", err);
    }
  }

  return true;
}

/**
 * Retrieves booked tokens from localStorage and merges with Firestore
 */
export async function fetchOPDTokens(fallbackTokens: OPDToken[]): Promise<OPDToken[]> {
  const localStr = localStorage.getItem('arogya_bandhu_booked_tokens');
  const localTokens: OPDToken[] = localStr ? JSON.parse(localStr) : [];

  if (localTokens.length > 0) {
    return localTokens;
  }

  if (db && isFirebaseLive) {
    try {
      const q = query(collection(db, 'opd_tokens'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const firestoreTokens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OPDToken));
      if (firestoreTokens.length > 0) {
        return firestoreTokens;
      }
    } catch (err) {
      console.warn("Using offline tokens:", err);
    }
  }

  return fallbackTokens;
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
      addDoc(colRef, {
        ...data,
        createdAt: new Date().toISOString()
      }).catch(err => console.warn("Async prescription sync note:", err));
    } catch (err) {
      console.warn("Firestore prescription log note:", err);
    }
  }
  return true;
}

/**
 * Saves citizen profile to local storage and Firestore
 */
export async function saveCitizenRecord(profile: CitizenProfile): Promise<boolean> {
  try {
    const existingStr = localStorage.getItem('arogya_bandhu_scanned_citizens');
    const existing: CitizenProfile[] = existingStr ? JSON.parse(existingStr) : [];
    const updated = [profile, ...existing.filter(c => c.id !== profile.id)];
    localStorage.setItem('arogya_bandhu_scanned_citizens', JSON.stringify(updated.slice(0, 25)));
  } catch (e) {
    console.error("Local storage citizen error:", e);
  }

  if (db && isFirebaseLive) {
    try {
      const colRef = collection(db, 'citizen_records');
      addDoc(colRef, {
        ...profile,
        createdAt: new Date().toISOString()
      }).catch(err => console.warn("Async citizen sync note:", err));
    } catch (err) {
      console.warn("Firestore citizen record note:", err);
    }
  }
  return true;
}

/**
 * Retrieves scanned citizen records merged with fallback sample data
 */
export function fetchCitizenRecords(fallback: CitizenProfile[]): CitizenProfile[] {
  try {
    const existingStr = localStorage.getItem('arogya_bandhu_scanned_citizens');
    if (existingStr) {
      const scanned: CitizenProfile[] = JSON.parse(existingStr);
      if (scanned && scanned.length > 0) {
        return [...scanned, ...fallback.filter(f => !scanned.some(s => s.id === f.id))];
      }
    }
  } catch {}
  return fallback;
}

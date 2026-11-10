import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Copie este arquivo para firebase.js e substitua os valores pelos dados
// do seu app Web no Firebase Console.
const firebaseConfig = {
  apiKey: 'SUA_API_KEY',
  authDomain: 'SEU_PROJECT_ID.firebaseapp.com',
  projectId: 'SEU_PROJECT_ID',
  storageBucket: 'SEU_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'SEU_MESSAGING_SENDER_ID',
  appId: 'SEU_APP_ID',
  measurementId: 'SEU_MEASUREMENT_ID',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function initializeFirebaseAuth(firebaseApp) {
  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // Fast Refresh can evaluate this module again while Auth is already initialized.
    if (error?.code === 'auth/already-initialized') return getAuth(firebaseApp);
    throw error;
  }
}

export const auth = initializeFirebaseAuth(app);
export const db = getFirestore(app);

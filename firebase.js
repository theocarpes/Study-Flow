import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCKhXO732JyEQjesTlgDpFNxLuOJXakNjU',
  authDomain: 'studyflow-dc940.firebaseapp.com',
  projectId: 'studyflow-dc940',
  storageBucket: 'studyflow-dc940.firebasestorage.app',
  messagingSenderId: '753253907635',
  appId: '1:753253907635:web:a0a380c8cdd10f7ef744c6',
  measurementId: 'G-X5GCCRE0DW',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

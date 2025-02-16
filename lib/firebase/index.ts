// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyDdf89_5c87Jwa9jllD_QWKRzIV64Gq9f4',
  authDomain: 'nouriva-a0bcb.firebaseapp.com',
  projectId: 'nouriva-a0bcb',
  storageBucket: 'nouriva-a0bcb.firebasestorage.app',
  messagingSenderId: '583331638617',
  appId: '1:583331638617:web:bf6502659562635061f048'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export default app;
const storage = getStorage(app);
export { storage };

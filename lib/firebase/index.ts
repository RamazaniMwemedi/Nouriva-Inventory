// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyCEnJvAeQG6NZ1h8pxakjIRFJbJkNn33xg',
  authDomain: 'reemar-b7944.firebaseapp.com',
  projectId: 'reemar-b7944',
  storageBucket: 'reemar-b7944.appspot.com',
  messagingSenderId: '1085331560748',
  appId: '1:1085331560748:web:2e75a381713f74bec77489',
  measurementId: 'G-TN470FT4R1'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export default app;
const storage = getStorage(app);
export { storage };

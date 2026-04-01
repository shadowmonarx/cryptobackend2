// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";

export const googleProvider = new GoogleAuthProvider();
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC4dqPWodKFK7HjMtsFM7NqEn6hWyIvbD4",
  authDomain: "cryptotrader-8076f.firebaseapp.com",
  projectId: "cryptotrader-8076f",
  storageBucket: "cryptotrader-8076f.firebasestorage.app",
  messagingSenderId: "645390831394",
  appId: "1:645390831394:web:5253f6fd2ec922b9179f7b",
  measurementId: "G-R8QFFK2XJV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export default app;
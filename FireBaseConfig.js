// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWihFRGvYJn07kBOeEeYwh_3sjIpx5nAI",
  authDomain: "pratopronto-32692.firebaseapp.com",
  projectId: "pratopronto-32692",
  storageBucket: "pratopronto-32692.firebasestorage.app",
  messagingSenderId: "888142189550",
  appId: "1:888142189550:web:145eecfcedd5a651b674ff"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const database = getFirestore(app);

export const auth = getAuth(app);
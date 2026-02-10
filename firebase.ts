import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase para Terrua Store
const firebaseConfig = {
  apiKey: "AIzaSyCZsPF_VYAgDe0EHZrj84EUpvmfXcPZCEY",
  authDomain: "hosting-terrua.firebaseapp.com",
  projectId: "hosting-terrua",
  storageBucket: "hosting-terrua.firebasestorage.app",
  messagingSenderId: "852168192442",
  appId: "1:852168192442:web:518b1d855ca2664d586d83",
  measurementId: "G-H8BNCZJPYX"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
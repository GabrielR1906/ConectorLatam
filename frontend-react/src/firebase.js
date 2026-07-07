import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBk1BtHeH2AErnfDFYnuqprIa5FojQwza8",
  authDomain: "conectorlatam.firebaseapp.com",
  projectId: "conectorlatam",
  storageBucket: "conectorlatam.firebasestorage.app",
  messagingSenderId: "278657250368",
  appId: "1:278657250368:web:aefbe0cecb2ee7b7ea9ba5",
  measurementId: "G-52976YFP44"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

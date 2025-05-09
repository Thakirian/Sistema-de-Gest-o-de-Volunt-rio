import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyA4iy8LfUcJLt7N62ZDXtZMEIio7jU9TNg",
    authDomain: "gerenciamento-voluntario.firebaseapp.com",
    projectId: "gerenciamento-voluntario",
    storageBucket: "gerenciamento-voluntario.firebasestorage.app",
    messagingSenderId: "1094500781796",
    appId: "1:1094500781796:web:3fe0b16fbe4d51ecb526f1"
};

const app = initializeApp(firebaseConfig);
export const auth_mod = getAuth(app);
export const db = getFirestore(app);
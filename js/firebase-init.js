// Firebase Configuration v9 (Modular SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserSessionPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, setDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyAmbkPFPnxGa0oUDxLxK7lRHBUXTi1UN-E",
    authDomain: "nexus-82167.firebaseapp.com",
    projectId: "nexus-82167",
    storageBucket: "nexus-82167.firebasestorage.app",
    messagingSenderId: "185491858658",
    appId: "1:185491858658:web:dedb498140e17d9fadaabb",
    measurementId: "G-WWXETYXHG0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export services
export { 
    auth, db, storage, 
    signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserSessionPersistence, browserLocalPersistence,
    collection, getDocs, addDoc, deleteDoc, doc, updateDoc, setDoc, query, where, orderBy,
    ref, uploadBytes, getDownloadURL, deleteObject
};

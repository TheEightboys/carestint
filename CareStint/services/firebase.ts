import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration from environment
const firebaseConfig = {
    apiKey: "AIzaSyDO9_4bqZQkLNoPskwDWbCoWUAwzRPJL_I",
    authDomain: "carestint-web-app-booking.firebaseapp.com",
    projectId: "carestint-web-app-booking",
    storageBucket: "carestint-web-app-booking.appspot.com",
    messagingSenderId: "734704245780",
    appId: "1:734704245780:web:4d80a24936c911cbda5b01",
    measurementId: "G-L79S0ZLF5F"
};

// Initialize Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence for React Native
let auth;
try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
} catch (error) {
    // Auth already initialized
    auth = getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { app, auth, db, storage };

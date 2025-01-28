// Import the necessary Firebase modules
const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAe6_2tymjFcdGvKHcmT_M-obXlAHtJPE8",
    authDomain: "safespeak-21f59.firebaseapp.com",
    projectId: "safespeak-21f59",
    storageBucket: "safespeak-21f59.firebasestorage.app",
    messagingSenderId: "104067999892",
    appId: "1:104067999892:web:7d9b365dd9fd496a92ac81",
    measurementId: "G-X01673MESM"
};

// Initialize Firebase
const apps = initializeApp(firebaseConfig);

// Initialize Firestore and Auth services
const auth = getAuth(apps);
const db = getFirestore(apps);

// Export the initialized Firebase app, auth, and db
module.exports = { apps, auth, db };

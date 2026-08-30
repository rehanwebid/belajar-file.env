// ==================== FIREBASE CONFIG ====================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAJvvJKNLJyFlAjAs_3-3puHW29T6wn4NI",
  authDomain: "anonymous-group-bbdd6.firebaseapp.com",
  databaseURL: "https://anonymous-group-bbdd6-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "anonymous-group-bbdd6",
  storageBucket: "anonymous-group-bbdd6.firebasestorage.app",
  messagingSenderId: "149832195831",
  appId: "1:149832195831:web:8e4ac6584a252b941cfdf2"
};

// ==================== APPS SCRIPT CONFIG ====================
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw4GrZO3CTJL3NHEacAflBhAmqLobIjKKIuWPiBfIjyvhkI_jbd5Cr4SxKgXPv52CSr/exec";

// ==================== ADMIN CONFIG ====================
const ADMIN_USERNAME = 'Admin.env';
const ADMIN_PASSWORD = '129o0p';
const ADMIN_DISPLAY_NAME = 'Admin group';
const ADMIN_PHOTO_URL = 'Admin.webp';

// ==================== SPREADSHEET CONFIG ====================
const SPREADSHEET_ID = '1Nbi5laaRcxEdW3S1ZMq8XcR0cmn8KVi-o_xfZwITxF4';

// ==================== EXPORT ====================
window.APP_CONFIG = {
  firebase: FIREBASE_CONFIG,
  appsScriptUrl: APPS_SCRIPT_URL,
  admin: {
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD,
    displayName: ADMIN_DISPLAY_NAME,
    photoUrl: ADMIN_PHOTO_URL
  },
  spreadsheetId: SPREADSHEET_ID
};

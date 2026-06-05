import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy-api-key-macaustudent-local",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-macaustudent.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-macaustudent"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

console.log("Firebase Init - Hostname:", window.location.hostname);
// Connect to the local Firebase Authentication emulator if hosted locally
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  console.log("Connecting to Auth Emulator at http://127.0.0.1:9099");
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}

export { auth };

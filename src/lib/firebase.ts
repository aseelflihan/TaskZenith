
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

console.log("Firebase Script: Initializing...");

const envConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("Firebase Script: Raw environment config loaded:",
  JSON.parse(JSON.stringify(envConfig))
);

const requiredEnvKeys: (keyof typeof envConfig)[] = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

let allRequiredEnvVarsPresent = true;
for (const key of requiredEnvKeys) {
  if (!envConfig[key]) {
    console.error(
      `FIREBASE CRITICAL ENV ERROR: Missing environment variable NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}. ` +
      `Check your .env.local file and ensure the Next.js development server was restarted after changes.`
    );
    allRequiredEnvVarsPresent = false;
  }
}

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let db: Firestore | undefined = undefined;

if (allRequiredEnvVarsPresent) {
  const firebaseConfig: FirebaseOptions = envConfig as FirebaseOptions;
  try {
    console.log("Firebase Script: Attempting to initialize Firebase app...");
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log("Firebase Script: New Firebase app initialized. Name:", app.name);
    } else {
      app = getApp();
      console.log("Firebase Script: Existing Firebase app retrieved. Name:", app.name);
    }
    console.log("Firebase Script: Initializing Auth and Firestore services...");
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase Script: Auth and Firestore services initialized successfully.");
  } catch (error: any) {
    console.error(
      "Firebase Script: CRITICAL ERROR during Firebase service initialization (initializeApp, getAuth, getFirestore).",
      `Message: ${error.message || error.toString()}`,
      error.code ? `(Code: ${error.code})` : '',
      "Full Error Object:", error
    );
    app = undefined;
    auth = undefined;
    db = undefined;
  }
} else {
  console.error(
    "Firebase Script: Firebase initialization CANCELED due to missing environment variables. " +
    "Application functionality relying on Firebase will likely fail."
  );
}

export { app, auth, db };
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  initializeAuth,
  Auth,
  // @ts-ignore
  getReactNativePersistence,
} from 'firebase/auth';
// import { getReactNativePersistence } from 'firebase/auth/react-native';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../utils/config';

const firebaseConfig = {
  apiKey: config.firebase.apiKey ?? '',
  authDomain: config.firebase.authDomain ?? '',
  projectId: config.firebase.projectId ?? '',
  storageBucket: config.firebase.storageBucket ?? '',
  messagingSenderId: config.firebase.messagingSenderId ?? '',
  appId: config.firebase.appId ?? ''
};

// Инициализация Firebase App (только один раз)
let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // Инициализация Auth с AsyncStorage persistence для React Native
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} else {
  app = getApps()[0];
  auth = getAuth(app);
}

const firestore: Firestore = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, firestore, googleProvider };

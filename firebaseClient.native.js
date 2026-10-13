import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseOptions';
import { opcoesFirebase, conectarAmbienteTeste } from './firebaseAmbiente';
export const app = getApps().find((item) => item.name === '[DEFAULT]') || initializeApp(opcoesFirebase(firebaseConfig));
export const database = getFirestore(app);
let instancia;
try { instancia = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) }); }
catch (erro) { if (erro.code !== 'auth/already-initialized') throw erro; instancia = getAuth(app); }
export const auth = instancia;
auth.languageCode = 'pt-BR';
conectarAmbienteTeste(app, auth, database);

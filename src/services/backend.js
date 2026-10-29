import * as firestore from 'firebase/firestore';
import * as firebaseAuth from 'firebase/auth';
const firebase = () => {
  const cliente = require('../../firebaseClient');
  if (!cliente?.auth || !cliente?.database) throw new Error('Não foi possível iniciar o acesso à conta. Feche e abra o aplicativo.');
  return cliente;
};
export const database = { tipo: 'backend' };
export const auth = { get currentUser() { return firebase().auth.currentUser; } };
const authReal = (instancia) => instancia === auth ? firebase().auth : instancia;
export function collection(_, nome) { return firestore.collection(firebase().database, nome); }
export function doc(_, colecao, id) { return firestore.doc(firebase().database, colecao, id); }
export const where = (...args) => firestore.where(...args);
export const orderBy = (...args) => firestore.orderBy(...args);
export const startAfter = (...args) => firestore.startAfter(...args);
export const documentId = (...args) => firestore.documentId(...args);
export function onAuthStateChanged(instancia, ...args) { return firebaseAuth.onAuthStateChanged(authReal(instancia), ...args); }
export const limit = (...args) => firestore.limit(...args);
export const query = (...args) => firestore.query(...args);
export const onSnapshot = (...args) => firestore.onSnapshot(...args);
export const getDoc = (...args) => firestore.getDoc(...args);
export const getDocFromServer = (...args) => firestore.getDocFromServer(...args);
export const getDocs = (...args) => firestore.getDocs(...args);
export const setDoc = (...args) => firestore.setDoc(...args);
export const updateDoc = (...args) => firestore.updateDoc(...args);
export const deleteDoc = (...args) => firestore.deleteDoc(...args);
export const addDoc = (...args) => firestore.addDoc(...args);
export const serverTimestamp = () => firestore.serverTimestamp();
export function escreverLote(escritas) {
  const lote = firestore.writeBatch(firebase().database);
  escritas.forEach(({ ref, dados }) => lote.set(ref, dados));
  return lote.commit();
}
export function executarTransacao(operacao) { return firestore.runTransaction(firebase().database, operacao); }
export function alterarDoc(ref, transformar) {
  return executarTransacao(async (tx) => { const valor = transformar(await tx.get(ref)); tx.set(ref, valor); return valor; });
}
export function timestampData(data) { return firestore.Timestamp.fromDate(data); }
export function novoId(colecao) { return firestore.doc(collection(database, colecao)).id; }
export function signInWithEmailAndPassword(instancia, ...args) { return firebaseAuth.signInWithEmailAndPassword(authReal(instancia), ...args); }
export function createUserWithEmailAndPassword(instancia, ...args) { return firebaseAuth.createUserWithEmailAndPassword(authReal(instancia), ...args); }
export function signOut(instancia) { return firebaseAuth.signOut(authReal(instancia)); }
export const getAuth = (...args) => firebaseAuth.getAuth(...args);
export const updateProfile = (...args) => firebaseAuth.updateProfile(...args);
export const deleteUser = (...args) => firebaseAuth.deleteUser(...args);
export function sendPasswordResetEmail(instancia, email) { return firebaseAuth.sendPasswordResetEmail(authReal(instancia), email); }
export const sendEmailVerification = (...args) => firebaseAuth.sendEmailVerification(...args);
export const reload = (...args) => firebaseAuth.reload(...args);
export function getIdToken(usuario, force = false) { return firebaseAuth.getIdToken(usuario, force); }
export function reautenticar(usuario, senha) { return firebaseAuth.reauthenticateWithCredential(usuario, firebaseAuth.EmailAuthProvider.credential(usuario.email, senha)); }
export const verifyBeforeUpdateEmail = (...args) => firebaseAuth.verifyBeforeUpdateEmail(...args);
export const updatePassword = (...args) => firebaseAuth.updatePassword(...args);
export async function convidarAdministrador(dados) {
  return chamarFuncao('convidarAdministrador', dados);
}

export async function chamarFuncao(nome, dados = {}) {
  const { getFunctions, httpsCallable, connectFunctionsEmulator } = require('firebase/functions');
  const funcoes = getFunctions(firebase().app, 'southamerica-east1');
  if (process.env.EXPO_PUBLIC_USAR_EMULADORES === '1' && !funcoes.__pratoCertoLocal) {
    connectFunctionsEmulator(funcoes, process.env.EXPO_PUBLIC_EMULADOR_HOST || '127.0.0.1', 5001);
    funcoes.__pratoCertoLocal = true;
  }
  try { return (await httpsCallable(funcoes, nome, { timeout: 180000 })(dados)).data; }
  catch (erro) {
    if (erro.code === 'functions/not-found') throw new Error('A direção precisa publicar as funções atualizadas do aplicativo no Firebase.');
    throw erro;
  }
}
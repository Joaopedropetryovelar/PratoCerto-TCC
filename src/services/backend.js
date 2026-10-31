import * as firestore from 'firebase/firestore';
import * as firebaseAuth from 'firebase/auth';
const firebase = () => {
  const cliente = require('../../firebaseClient');
  if (!cliente?.auth || !cliente?.database)
    throw new Error('Não foi possível iniciar o acesso à conta. Feche e abra o aplicativo.');
  return cliente;
};
export const database = {
  tipo: 'backend',
};
export const auth = {
  get currentUser() {
    return firebase().auth.currentUser;
  },
};
const authReal = (instancia) => (instancia === auth ? firebase().auth : instancia);
export function collection(_, nome) {
  return firestore.collection(firebase().database, nome);
}
export function doc(_, colecao, identificador) {
  return firestore.doc(firebase().database, colecao, identificador);
}
export const where = (...argumentos) => firestore.where(...argumentos);
export const orderBy = (...argumentos) => firestore.orderBy(...argumentos);
export const startAfter = (...argumentos) => firestore.startAfter(...argumentos);
export const documentId = (...argumentos) => firestore.documentId(...argumentos);
export function onAuthStateChanged(instancia, ...argumentos) {
  return firebaseAuth.onAuthStateChanged(authReal(instancia), ...argumentos);
}
export const limit = (...argumentos) => firestore.limit(...argumentos);
export const query = (...argumentos) => firestore.query(...argumentos);
export const onSnapshot = (...argumentos) => firestore.onSnapshot(...argumentos);
export const getDoc = (...argumentos) => firestore.getDoc(...argumentos);
export const getDocFromServer = (...argumentos) => firestore.getDocFromServer(...argumentos);
export const getDocs = (...argumentos) => firestore.getDocs(...argumentos);
export const setDoc = (...argumentos) => firestore.setDoc(...argumentos);
export const updateDoc = (...argumentos) => firestore.updateDoc(...argumentos);
export const deleteDoc = (...argumentos) => firestore.deleteDoc(...argumentos);
export const addDoc = (...argumentos) => firestore.addDoc(...argumentos);
export const serverTimestamp = () => firestore.serverTimestamp();
export function escreverLote(escritas) {
  const lote = firestore.writeBatch(firebase().database);
  escritas.forEach(({ ref: referenciaDocumento, dados }) => lote.set(referenciaDocumento, dados));
  return lote.commit();
}
export function executarTransacao(operacao) {
  return firestore.runTransaction(firebase().database, operacao);
}
export function alterarDoc(referenciaDocumento, transformar) {
  return executarTransacao(async (transacao) => {
    const valor = transformar(await transacao.get(referenciaDocumento));
    transacao.set(referenciaDocumento, valor);
    return valor;
  });
}
export function timestampData(data) {
  return firestore.Timestamp.fromDate(data);
}
export function novoId(colecao) {
  return firestore.doc(collection(database, colecao)).id;
}
export function signInWithEmailAndPassword(instancia, ...argumentos) {
  return firebaseAuth.signInWithEmailAndPassword(authReal(instancia), ...argumentos);
}
export function createUserWithEmailAndPassword(instancia, ...argumentos) {
  return firebaseAuth.createUserWithEmailAndPassword(authReal(instancia), ...argumentos);
}
export function signOut(instancia) {
  return firebaseAuth.signOut(authReal(instancia));
}
export const getAuth = (...argumentos) => firebaseAuth.getAuth(...argumentos);
export const updateProfile = (...argumentos) => firebaseAuth.updateProfile(...argumentos);
export const deleteUser = (...argumentos) => firebaseAuth.deleteUser(...argumentos);
export function sendPasswordResetEmail(instancia, email) {
  return firebaseAuth.sendPasswordResetEmail(authReal(instancia), email);
}
export const sendEmailVerification = (...argumentos) =>
  firebaseAuth.sendEmailVerification(...argumentos);
export const reload = (...argumentos) => firebaseAuth.reload(...argumentos);
export function getIdToken(usuario, force = false) {
  return firebaseAuth.getIdToken(usuario, force);
}
export function reautenticar(usuario, senha) {
  return firebaseAuth.reauthenticateWithCredential(
    usuario,
    firebaseAuth.EmailAuthProvider.credential(usuario.email, senha),
  );
}
export const verifyBeforeUpdateEmail = (...argumentos) =>
  firebaseAuth.verifyBeforeUpdateEmail(...argumentos);
export const updatePassword = (...argumentos) => firebaseAuth.updatePassword(...argumentos);
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
  try {
    return (
      await httpsCallable(funcoes, nome, {
        timeout: 180000,
      })(dados)
    ).data;
  } catch (erro) {
    if (erro.code === 'functions/not-found')
      throw new Error(
        'A direção precisa publicar as funções atualizadas do aplicativo no Firebase.',
      );
    throw erro;
  }
}

import * as firestore from 'firebase/firestore';
import * as firebaseAuth from 'firebase/auth';
import { demoStore, estaEmDemo, sairDemonstracao, usuarioDemonstracao } from './demo';

// Só inicializa o Firebase quando o usuário abre o fluxo de conta real.
const firebase = () => {
  const configuracao = require('../../firebaseClient');
  if (!configuracao?.auth || !configuracao?.database) throw new Error('Não foi possível iniciar o acesso à conta. Feche e abra o aplicativo. Se continuar, procure a equipe.');
  return configuracao;
};
export const database = { tipo: 'backend' };
export const auth = {
  get currentUser() { return estaEmDemo() ? usuarioDemonstracao() : firebase().auth.currentUser; },
};
const authReal = (instancia) => instancia === auth ? firebase().auth : instancia;

export function collection(_, nome) {
  return estaEmDemo() ? { tipo: 'collection', colecao: nome } : firestore.collection(firebase().database, nome);
}
export function doc(_, colecao, id) {
  return estaEmDemo() ? { tipo: 'doc', colecao, id } : firestore.doc(firebase().database, colecao, id);
}
export function where(campo, operador, valor) {
  return estaEmDemo() ? { tipo: 'where', campo, operador, valor } : firestore.where(campo, operador, valor);
}
export function limit(valor) { return estaEmDemo() ? { tipo: 'limit', valor } : firestore.limit(valor); }
export function query(ref, ...filtros) {
  return estaEmDemo() ? { ...ref, filtros } : firestore.query(ref, ...filtros);
}
const local = (ref) => ref.tipo === 'doc' || ref.tipo === 'collection';
export function onSnapshot(ref, sucesso, erro) {
  return local(ref) ? demoStore.escutar(ref, sucesso, erro) : firestore.onSnapshot(ref, sucesso, erro);
}
export function getDoc(ref) { return local(ref) ? demoStore.ler(ref) : firestore.getDoc(ref); }
export function getDocs(ref) { return local(ref) ? demoStore.ler(ref) : firestore.getDocs(ref); }
export function setDoc(ref, dados, opcoes) {
  return local(ref) ? demoStore.escrever(ref, dados, opcoes?.merge) : firestore.setDoc(ref, dados, opcoes);
}
export function escreverLote(escritas) {
  if (estaEmDemo()) return demoStore.transacionar((tx) => escritas.forEach(({ ref, dados }) => tx.set(ref, dados)));
  const lote = firestore.writeBatch(firebase().database);
  escritas.forEach(({ ref, dados }) => lote.set(ref, dados));
  return lote.commit();
}
export function updateDoc(ref, dados) {
  return local(ref) ? demoStore.escrever(ref, dados, true, true) : firestore.updateDoc(ref, dados);
}
export function deleteDoc(ref) { return local(ref) ? demoStore.excluir(ref) : firestore.deleteDoc(ref); }
let contador = 0;
export async function addDoc(ref, dados) {
  if (!local(ref)) return firestore.addDoc(ref, dados);
  contador += 1;
  const documento = { tipo: 'doc', colecao: ref.colecao, id: `local-${Date.now()}-${contador}` };
  await demoStore.escrever(documento, dados);
  return documento;
}
export function serverTimestamp() {
  return estaEmDemo() ? { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } : firestore.serverTimestamp();
}
function exigirContaReal() {
  if (estaEmDemo()) throw new Error('Contas reais não podem ser alteradas na demonstração.');
}
export function signInWithEmailAndPassword(instancia, email, senha) {
  exigirContaReal();
  return firebaseAuth.signInWithEmailAndPassword(authReal(instancia), email, senha);
}
export function createUserWithEmailAndPassword(instancia, email, senha) {
  exigirContaReal();
  return firebaseAuth.createUserWithEmailAndPassword(authReal(instancia), email, senha);
}
export function signOut(instancia) {
  if (instancia === auth && estaEmDemo()) { sairDemonstracao(); return Promise.resolve(); }
  return firebaseAuth.signOut(authReal(instancia));
}
export function getAuth(app) { exigirContaReal(); return firebaseAuth.getAuth(app); }
export function updateProfile(usuario, dados) { exigirContaReal(); return firebaseAuth.updateProfile(usuario, dados); }
export function deleteUser(usuario) { exigirContaReal(); return firebaseAuth.deleteUser(usuario); }

export function executarTransacao(operacao) {
  return estaEmDemo() ? demoStore.transacionar(operacao) : firestore.runTransaction(firebase().database, operacao);
}
export function sendPasswordResetEmail(instancia, email) { exigirContaReal(); return firebaseAuth.sendPasswordResetEmail(authReal(instancia), email); }
export function sendEmailVerification(usuario) { exigirContaReal(); return firebaseAuth.sendEmailVerification(usuario); }
export function reload(usuario) { exigirContaReal(); return firebaseAuth.reload(usuario); }
export function getIdToken(usuario, force = false) { exigirContaReal(); return firebaseAuth.getIdToken(usuario, force); }
export function reautenticar(usuario, senha) { exigirContaReal(); return firebaseAuth.reauthenticateWithCredential(usuario, firebaseAuth.EmailAuthProvider.credential(usuario.email, senha)); }
export function verifyBeforeUpdateEmail(usuario, email) { exigirContaReal(); return firebaseAuth.verifyBeforeUpdateEmail(usuario, email); }
export function updatePassword(usuario, senha) { exigirContaReal(); return firebaseAuth.updatePassword(usuario, senha); }
export async function convidarAdministrador(dados) {
  exigirContaReal();
  const { getFunctions, httpsCallable } = require('firebase/functions');
  return (await httpsCallable(getFunctions(firebase().app, 'southamerica-east1'), 'convidarAdministrador')(dados)).data;
}
export function alterarDoc(ref, transformar) {
  if (local(ref)) return demoStore.alterar(ref, transformar);
  return firestore.runTransaction(firebase().database, async (transacao) => {
    const snapshot = await transacao.get(ref);
    const valor = transformar(snapshot);
    transacao.set(ref, valor);
    return valor;
  });
}

export function timestampData(data) { return estaEmDemo() ? { seconds: Math.floor(data.getTime() / 1000), nanoseconds: (data.getTime() % 1000) * 1000000 } : firestore.Timestamp.fromDate(data); }
export function novoId(colecao) { if (!estaEmDemo()) return firestore.doc(firestore.collection(firebase().database, colecao)).id; contador += 1; return `local-${Date.now()}-${contador}`; }

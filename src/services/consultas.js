import { auth, collection, database, getIdToken, onSnapshot, query, where } from './backend';
import { codigoDados } from '../domain/errosDados';
import { dataValida } from '../domain/refeicoes';
import { moverDia } from '../domain/calendario';

// Alternativa limitada: mantém todos os filtros de acesso e consulta cada dia.
export function consultasPorDia(filtros) {
  const inicio = filtros.find(([campo, op]) => campo === 'data' && op === '>=');
  const fim = filtros.find(([campo, op]) => campo === 'data' && op === '<=');
  const demais = filtros.filter((f) => f !== inicio && f !== fim);
  if (!inicio || !fim || !dataValida(inicio[2]) || !dataValida(fim[2]) || inicio[2] > fim[2] || demais.some(([, op]) => op !== '==')) return null;
  const consultas = [];
  for (let dia = inicio[2]; dia <= fim[2]; dia = moverDia(dia, 1)) {
    if (consultas.length >= 31) return null;
    consultas.push([...demais, ['data', '==', dia]]);
  }
  return consultas;
}
export function escutarConsulta(nome, filtros, sucesso, falha, limpar = () => {}) {
  let ativo = true, geracao = 0, usouAlternativa = false, renovouToken = false;
  const cancelamentos = new Set();
  function cancelar() { cancelamentos.forEach((parar) => parar()); cancelamentos.clear(); }
  function iniciar(grupos) {
    cancelar();
    const atual = ++geracao;
    const resultados = new Map();
    const base = collection(database, nome);
    function erro(ocorrido) {
      if (!ativo || geracao !== atual) return;
      limpar();
      cancelar(); geracao += 1;
      const alternativas = !usouAlternativa && codigoDados(ocorrido) === 'failed-precondition' && /index|índice/i.test(ocorrido.message || '') ? consultasPorDia(filtros) : null;
      if (alternativas) { usouAlternativa = true; iniciar(alternativas); return; }
      if (!renovouToken && codigoDados(ocorrido) === 'permission-denied' && auth.currentUser?.emailVerified) {
        renovouToken = true;
        const espera = geracao;
        Promise.resolve().then(() => getIdToken(auth.currentUser, true)).then(() => { if (ativo && geracao === espera) iniciar(grupos); }).catch((e) => { if (ativo && geracao === espera) falha(e); });
        return;
      }
      falha(ocorrido);
    }
    for (let i = 0; i < grupos.length && ativo && geracao === atual; i += 1) {
      try {
        const ref = grupos[i].length ? query(base, ...grupos[i].map(([campo, op, valor]) => where(campo, op, valor))) : base;
        const parar = onSnapshot(ref, (snapshot) => {
          if (!ativo || geracao !== atual) return;
          resultados.set(i, snapshot.docs.map((item) => ({ ...item.data(), id: item.id })));
          if (resultados.size === grupos.length) sucesso([...new Map([...resultados.values()].flat().map((item) => [item.id, item])).values()]);
        }, erro);
        if (ativo && geracao === atual) cancelamentos.add(parar); else parar();
      } catch (e) { erro(e); }
    }
  }
  try { iniciar([filtros]); } catch (e) { falha(e); }
  return () => { ativo = false; geracao += 1; cancelar(); };
}

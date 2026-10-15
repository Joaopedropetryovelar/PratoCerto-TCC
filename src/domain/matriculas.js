import { chaveEscola } from './escolas.js';
export function chaveMatricula(escola, matricula) {
  if (typeof matricula !== 'string' || !/^[0-9]{5}$/.test(matricula)) throw new Error('Informe uma matrícula com exatamente 5 números.');
  return `${chaveEscola(escola)}_${matricula}`;
}
export function revisaoMatricula(registro) { return Number.isInteger(registro?.revisao) ? registro.revisao : 0; }

export function analisarListaMatriculas(texto) {
  if (typeof texto !== 'string' || texto.length > 20000) throw new Error('Use uma lista de até 500 matrículas por vez.');
  const partes = texto.replace(/^\uFEFF/, '').trim().split(/[\s,;]+/).filter(Boolean);
  if (/^matr[ií]culas?$/i.test(partes[0] || '')) partes.shift();
  const matriculas = [], invalidas = [], vistas = new Set();
  let repetidas = 0;
  for (const item of partes) {
    if (!/^[0-9]{5}$/.test(item)) { invalidas.push(item); continue; }
    if (vistas.has(item)) { repetidas += 1; continue; }
    vistas.add(item); matriculas.push(item);
  }
  if (matriculas.length > 500) throw new Error('Use uma lista de até 500 matrículas por vez.');
  return { matriculas, invalidas, repetidas };
}

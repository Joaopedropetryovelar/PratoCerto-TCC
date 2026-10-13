import test from 'node:test';
import assert from 'node:assert/strict';
import { resumirAvaliacoes, resumirConfirmacoes } from '../src/domain/planejamento.js';
const pratos=[{id:'a',turno:'manha',ativo:true},{id:'b',turno:'tarde',ativo:false}];
test('dashboard mantém só a resposta mais recente do mesmo aluno/refeição',()=>{
 const registros=[{refeicaoId:'a',alunoId:'1',vaiConsumir:true,dataResposta:{seconds:1}},{refeicaoId:'a',alunoId:'1',vaiConsumir:false,dataResposta:{seconds:2}}];
 const r=resumirConfirmacoes(pratos,registros);assert.equal(r.confirmados,0);assert.equal(r.recusados,1);assert.equal(r.total,1);
});
test('respostas de refeições arquivadas e respostas inválidas não entram no planejamento',()=>{
 const r=resumirConfirmacoes(pratos,[{refeicaoId:'b',alunoId:'1',vaiConsumir:true},{refeicaoId:'a',alunoId:'2',vaiConsumir:'sim'}]);assert.equal(r.total,0);assert.equal(r.taxaConfirmacao,null);
});
test('avaliações antigas duplicadas e notas fora da escala não distorcem a média',()=>{
 const r=resumirAvaliacoes([{refeicaoId:'a',alunoId:'1',nota:2,dataResposta:{seconds:1}},{refeicaoId:'a',alunoId:'1',nota:5,dataResposta:{seconds:2}},{refeicaoId:'a',alunoId:'2',nota:99}]);assert.equal(r.lista.length,2);assert.equal(r.notas,1);assert.equal(r.media,5);
});

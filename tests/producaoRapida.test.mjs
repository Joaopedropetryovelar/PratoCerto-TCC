import test from 'node:test';import assert from 'node:assert/strict';
import {validarProducao,registroValido,resumirProducao,gerarCsv,formularioDoRegistro} from '../src/domain/producao.js';
import {validarCadastro} from '../src/domain/contas.js';
const refeicao={id:'r',data:'2026-10-12',turno:'manha'};const agora=new Date('2026-10-12T21:00:00-03:00');
const quick={schemaVersion:2,refeicaoId:'r',refeicaoNome:'Arroz',data:refeicao.data,turno:'manha',servidos:100,sobraTotalG:30000};
test('V4 — rápido exige quantidade inteira e sobra válida, incluindo zero',()=>{
 assert.equal(validarProducao({modo:'rapido',servidos:'0',sobraTotalKg:'0'},refeicao,agora).valido,true);
 for(const f of [{servidos:'1,5',sobraTotalKg:'1'},{servidos:'100',sobraTotalKg:''},{servidos:'1',sobraTotalKg:'-1'}])assert.equal(validarProducao({modo:'rapido',...f},refeicao,agora).valido,false);
 assert.equal(registroValido(quick),true);assert.equal(registroValido({...quick,sobraTotalG:-1}),false);
 assert.equal(formularioDoRegistro(quick).sobraTotalKg,'30,000');
});
test('V4 — misturar rápido e detalhado não dilui descarte por refeição',()=>{
 const detalhado={...quick,schemaVersion:1,preparadoG:10000,sobraLimpaG:1000,sobraDescartadaG:500,restosG:500,servidos:20};delete detalhado.sobraTotalG;
 const resumo=resumirProducao([quick,detalhado]);assert.equal(resumo.servidos,120);assert.equal(resumo.sobrasG,31500);assert.equal(resumo.descarteG,1000);assert.equal(resumo.gramasPorRefeicao,50);assert.equal(resumo.medidos,1);
 assert.equal(resumirProducao([quick]).percentualDescarte,null);assert.equal(resumirProducao([quick]).gramasPorRefeicao,null);
 const linha=gerarCsv([quick]).split('\r\n')[1];assert.ok(!linha.includes('NaN'));assert.match(linha,/"30,000";"Rápido"$/);
});
test('V4 — matrícula tem cinco dígitos e conserva zeros à esquerda',()=>{
 const dados={nome:'Aluno Teste',matricula:'00001',turma:'3',turnos:['manha'],escola:'Satc',email:'a@b.com',senha:'Senha123!',confirmarSenha:'Senha123!',aceitouTermos:true};
 assert.equal(validarCadastro(dados).matricula,undefined);
 for(const matricula of ['1234','123456','12a45',''])assert.ok(validarCadastro({...dados,matricula}).matricula);
});

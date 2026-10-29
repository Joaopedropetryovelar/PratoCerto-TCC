const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const requireFunctions = createRequire(require('node:path').resolve('functions/package.json'));
const { initializeApp, deleteApp } = requireFunctions('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = requireFunctions('firebase-admin/firestore');
const { criarGestao } = require('../functions/gestao');
let env, app, db, gestao, chamadas;
const actor = { uid:'diretor',token:{email_verified:true} };
before(async()=>{
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8080');
  env=await initializeTestEnvironment({projectId:'demo-pratocerto-gestao',firestore:{host:'127.0.0.1',port:8080}});
  app=initializeApp({projectId:'demo-pratocerto-gestao'},'teste-gestao');db=getFirestore(app);
});
after(async()=>{await env?.cleanup();await deleteApp(app);});
beforeEach(async()=>{
  await env.clearFirestore();chamadas=[];
  const auth={updateUser:async(...a)=>chamadas.push(['update',...a]),revokeRefreshTokens:async uid=>chamadas.push(['revoke',uid]),deleteUser:async uid=>chamadas.push(['delete',uid])};
  gestao=criarGestao({db,auth,FieldValue,Timestamp});
  await db.collection('usuarios').doc('diretor').set({nome:'Direção',tipoConta:'admin',escola:'Satc'});
  await db.collection('usuarios').doc('aluno').set({nome:'Nome particular',matricula:'12345',email:'particular@teste.invalid',tipoConta:'aluno',escola:'Satc'});
  await db.collection('restricoesAlimentares').doc('aluno').set({escola:'Satc',situacao:'informadas',itens:['alergia_leite'],nomeResponsavel:'Nome particular'});
  await db.collection('solicitacoesPrivacidade').doc('aluno').set({alunoId:'aluno',alunoNome:'Nome particular',email:'particular@teste.invalid',matricula:'12345',turma:'Turma A',escola:'Satc',tipo:'exclusao_dados',status:'pendente',revisao:1,ciclo:1,versaoPolitica:'2026-10-13',criadoEm:Timestamp.now(),mensagem:'Mensagem pessoal'});
  await db.collection('matriculasAutorizadas').doc('satc_12345').set({alunoId:'aluno',escola:'Satc'});
  for(const nome of ['confirmacoes','feedbacks'])await db.collection(nome).doc('r_aluno').set({alunoId:'aluno',alunoNome:'Nome particular',escola:'Satc',data:'2026-10-29',turno:'manha',turma:'Turma A',refeicaoId:'r',refeicaoNome:'Arroz',vaiConsumir:true,nota:5,comentario:'Meu nome é particular',dataResposta:Timestamp.now()});
});
test('aluno e administrador de outra escola não executam exclusão',async()=>{
  await assert.rejects(gestao.executarExclusao({uid:'aluno',token:{email_verified:true}},{uid:'aluno',revisaoEsperada:1}),e=>e.code==='permission-denied');
  await db.collection('usuarios').doc('outro').set({tipoConta:'admin',escola:'Antônio Guglielmi Sobrinho'});
  await assert.rejects(gestao.executarExclusao({uid:'outro',token:{email_verified:true}},{uid:'aluno',revisaoEsperada:1}),e=>e.code==='permission-denied');
  assert.equal((await db.collection('usuarios').doc('aluno').get()).exists,true);
});
test('exclusão limpa dados pessoais e conserva os números sem vínculo com UID',async()=>{
  await gestao.executarExclusao(actor,{uid:'aluno',revisaoEsperada:1});
  for(const nome of ['usuarios','restricoesAlimentares'])assert.equal((await db.collection(nome).doc('aluno').get()).exists,false);
  assert.equal((await db.collection('matriculasAutorizadas').doc('satc_12345').get()).exists,false);
  const resultado=(await db.collection('feedbacks').get()).docs[0];assert.notEqual(resultado.id,'r_aluno');assert.notEqual(resultado.data().alunoId,'aluno');assert.equal(resultado.data().alunoNome,'');assert.equal(resultado.data().comentario,'');assert.equal(resultado.data().nota,5);
  const pedido=(await db.collection('solicitacoesPrivacidade').doc('aluno').get()).data();assert.equal(pedido.status,'concluida');assert.equal(pedido.email,'');assert.equal(pedido.mensagem,'');assert.equal(pedido.idAnonimo,undefined);assert.ok(chamadas.some(c=>c[0]==='delete'));
});
test('retirada de identificação preserva a conta e a declaração alimentar',async()=>{
  await db.collection('solicitacoesPrivacidade').doc('aluno').update({tipo:'anonimizacao_dados'});
  await gestao.executarExclusao(actor,{uid:'aluno',revisaoEsperada:1});
  assert.equal((await db.collection('usuarios').doc('aluno').get()).data().acessoAtivo,true);
  assert.equal((await db.collection('restricoesAlimentares').doc('aluno').get()).exists,true);
  assert.equal(chamadas.some(c=>c[0]==='delete'),false);
});
test('revisão divergente e exclusão já em andamento são negadas',async()=>{
  await assert.rejects(gestao.executarExclusao(actor,{uid:'aluno',revisaoEsperada:0}),e=>e.code==='failed-precondition');
  await db.collection('solicitacoesPrivacidade').doc('aluno').update({executandoExclusao:true,execucaoIniciadaEm:Timestamp.now()});
  await assert.rejects(gestao.executarExclusao(actor,{uid:'aluno',revisaoEsperada:1}),e=>e.code==='failed-precondition');
});
test('diretor não desativa a própria conta ou uma conta de outra escola',async()=>{
  await assert.rejects(gestao.alterarAcesso(actor,{uid:'diretor',ativo:false}),e=>e.code==='permission-denied');
  await db.collection('usuarios').doc('outro').set({tipoConta:'admin',escola:'Antônio Guglielmi Sobrinho'});
  await assert.rejects(gestao.alterarAcesso(actor,{uid:'outro',ativo:false}),e=>e.code==='permission-denied');
});
test('cópia dos dados contém somente os dados do próprio aluno',async()=>{
  await db.collection('feedbacks').doc('outra').set({alunoId:'outro',escola:'Satc',comentario:'Segredo'});
  const copia=await gestao.obterMeusDados({uid:'aluno',token:{email_verified:true}});
  assert.equal(copia.feedbacks.length,1);assert.equal(copia.feedbacks[0].alunoId,'aluno');
});
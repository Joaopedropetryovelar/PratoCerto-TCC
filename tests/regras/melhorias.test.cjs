const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const sdk = createRequire(require.resolve('@firebase/rules-unit-testing'));
const F = sdk('firebase/firestore');
const { criarRuntime } = require('../runtime.cjs');
let env;
const admin = { uid:'diretor', nome:'Diretor Teste', escola:'Satc', email:'diretor@teste.invalid', tipoConta:'admin' };
const aluno = { uid:'aluno', nome:'Aluno Teste', escola:'Satc', email:'aluno@teste.invalid', tipoConta:'aluno', matricula:'54321', turma:'Turma A', turmaId:'satc_a', turnos:['manha'], turno:'manha' };
const db = (uid='diretor', escola='Satc') => env.authenticatedContext(uid,{email:`${uid}@teste.invalid`,email_verified:true}).firestore();
async function seed(c,id,d) { await env.withSecurityRulesDisabled(x => F.setDoc(F.doc(x.firestore(),c,id),d)); }
function runtime(uid='diretor') { return criarRuntime({firestore:F,configuracao:{auth:{currentUser:{uid,email:`${uid}@teste.invalid`,emailVerified:true}},database:db(uid)}}); }
const baseRuntime = criarRuntime();
const datas = baseRuntime.carregar('src/domain/refeicoes.js'), cal = baseRuntime.carregar('src/domain/calendario.js');
const hoje = datas.dataDaEscola(new Date()), futuro = cal.proximoDiaUtil(cal.moverDia(hoje,1));
const prato = {nome:'Arroz e feijão',descricao:'Refeição de teste'};
async function publicar(patch={}) { return runtime().carregar('src/services/cardapio.js').salvarRefeicao({data:futuro,turno:'manha',prato,horarioLimite:'09:00',horarioFim:'12:30',...patch}); }
before(async()=>{ env=await initializeTestEnvironment({projectId:'demo-pratocerto-melhorias',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync('firestore.rules','utf8')}}); });
after(async()=>{await env?.cleanup();});
beforeEach(async()=>{ await env.clearFirestore(); await seed('usuarios','diretor',admin); await seed('usuarios','aluno',aluno); await seed('turmas','satc_a',{escola:'Satc',nome:'Turma A',ativa:true}); });
test('publicar um prato novo salva catálogo, oferta e revisão juntos',async()=>{
  const r=await publicar(); const snap=await F.getDoc(F.doc(db(),'NomePratos',r.id));assert.equal(snap.data().nome,prato.nome);
  await assertSucceeds(F.getDoc(F.doc(db(),'NomePratos',r.id,'historico','1')));
});
test('edição conjunta de descrição e horários usa o catálogo atualizado',async()=>{
  const r=await publicar(); const atual=await runtime().carregar('src/services/cardapio.js').salvarRefeicao({data:futuro,turno:'manha',id:r.id,revisaoEsperada:1,prato:{...prato,id:r.pratoId,revisaoEsperada:1,descricao:'Descrição nova'},horarioLimite:'10:00',horarioFim:'13:00'});
  assert.equal(atual.revisao,2);assert.equal((await F.getDoc(F.doc(db(),'NomePratos',r.id))).data().descricao,'Descrição nova');
});
test('direção reabre confirmação e preserva resposta existente',async()=>{
  const r=await publicar({data:hoje,horarioLimite:'00:01',horarioFim:'23:30'});
  await seed('confirmacoes',r.id+'_aluno',{alunoId:'aluno',escola:'Satc',refeicaoId:r.id,vaiConsumir:true});
  await runtime().carregar('src/services/cardapio.js').salvarRefeicao({data:hoje,turno:'manha',id:r.id,revisaoEsperada:1,pratoId:r.pratoId,horarioLimite:'23:00',horarioFim:'23:30'});
  assert.equal((await F.getDoc(F.doc(db(),'confirmacoes',r.id+'_aluno'))).data().vaiConsumir,true);
});
test('revisão antiga não sobrescreve alteração mais recente',async()=>{
  const r=await publicar();const s=runtime().carregar('src/services/cardapio.js');
  const dados={data:futuro,turno:'manha',id:r.id,revisaoEsperada:1,pratoId:r.pratoId,horarioLimite:'10:00',horarioFim:'13:00'};
  await s.salvarRefeicao(dados);await assert.rejects(s.salvarRefeicao(dados));
});
test('retirar do cardápio preserva respostas e registra a revisão',async()=>{
  const r=await publicar();await seed('confirmacoes',r.id+'_aluno',{alunoId:'aluno',escola:'Satc',refeicaoId:r.id,vaiConsumir:true});
  await runtime().carregar('src/services/cardapio.js').excluirRefeicao(r);
  assert.equal((await F.getDoc(F.doc(db(),'NomePratos',r.id))).data().ativo,false);
  assert.equal((await F.getDoc(F.doc(db(),'confirmacoes',r.id+'_aluno'))).data().vaiConsumir,true);
  assert.equal((await F.getDoc(F.doc(db(),'NomePratos',r.id,'historico','2'))).data().ativo,false);
});
test('aluno e outra escola não editam a refeição',async()=>{
  const r=await publicar();await seed('usuarios','outra',{...admin,uid:'outra',escola:'Antônio Guglielmi Sobrinho'});
  await assertFails(F.updateDoc(F.doc(db('aluno'),'NomePratos',r.id),{horarioLimite:'10:00'}));
  await assertFails(F.getDoc(F.doc(db('outra'),'NomePratos',r.id)));
});
test('desativação bloqueia uma sessão já autenticada no banco',async()=>{
  const r=await publicar();const cliente=db();await seed('usuarios','diretor',{...admin,acessoAtivo:false});
  await assertFails(F.getDoc(F.doc(cliente,'NomePratos',r.id)));
});
test('turnos válidos podem mudar; escola e tipo de conta não',async()=>{
  const ref=F.doc(db('aluno'),'usuarios','aluno');
  await assertSucceeds(F.updateDoc(ref,{turnos:['manha','tarde'],turno:'manha'}));
  await assertFails(F.updateDoc(ref,{turnos:['manha','manha'],turno:'manha'}));
  await assertFails(F.updateDoc(ref,{tipoConta:'admin'}));
});
test('importação em lote conserva e-mail de matrícula já autorizada',async()=>{
  await seed('matriculasAutorizadas','satc_12345',{escola:'Satc',matricula:'12345',email:'vinculado@teste.invalid',ativa:true,alunoId:'',vinculadoEm:null,revisao:1,criadoEm:F.Timestamp.now(),atualizadoEm:F.Timestamp.now(),atualizadoPorUid:'diretor'});
  await runtime().carregar('src/services/matriculas.js').autorizarMatriculasEmLote('12345');
  assert.equal((await F.getDoc(F.doc(db(),'matriculasAutorizadas','satc_12345'))).data().email,'vinculado@teste.invalid');
});
test('tipos diferentes de pedidos são registrados com histórico coerente',async()=>{
  await runtime('aluno').carregar('src/services/privacidade.js').solicitarExclusaoDados('Quero corrigir meu nome','correcao_dados');
  const pedido=await F.getDoc(F.doc(db('aluno'),'solicitacoesPrivacidade','aluno'));assert.equal(pedido.data().tipo,'correcao_dados');
});
test('configuração institucional é pública; edição é da própria direção',async()=>{
  const dados={escola:'Satc',controlador:'Instituição de teste',contato:'privacidade@teste.invalid',retencao:'Critérios definidos pela instituição para cada categoria.',baseLegal:'Bases e finalidades definidas pela instituição para cada finalidade.',atualizadoEm:F.serverTimestamp(),atualizadoPorUid:'diretor'};
  await assertSucceeds(F.setDoc(F.doc(db(),'configuracoesEscola','satc'),dados));
  await assertSucceeds(F.getDoc(F.doc(env.unauthenticatedContext().firestore(),'configuracoesEscola','satc')));
  await assertFails(F.updateDoc(F.doc(db('aluno'),'configuracoesEscola','satc'),{controlador:'Outra'}));
});
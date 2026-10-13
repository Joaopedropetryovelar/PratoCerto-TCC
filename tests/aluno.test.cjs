const test = require('node:test');
const assert = require('node:assert/strict');
const { criarRuntime, agir, host, porId, texto } = require('./runtime.cjs');
const data = () => '2026-10-12';
const refeicaoId = () => `demo-${data()}-manha`;
async function aluno(arquivo='src/routes/screens/TelaDeConfirmacao.js',props={}) {
  const runtime=criarRuntime(); await runtime.demo().entrarDemonstracao('aluno');
  if (arquivo.includes('FeedbackAluno')) runtime.demo().definirHorarioDemo('21:00');
  const rotas=[];
  const tela=await runtime.render(arquivo,{navigation:{navigate:(...args)=>rotas.push(args)},...props});
  return {runtime,tela,rotas};
}
const fechar = tela=>agir(()=>tela.unmount());
const ref = (b,colecao,id)=>b.doc(b.database,colecao,id);

test('01 — aluno vê seu turno e navega para a refeição escolhida',async()=>{
  const {tela,rotas}=await aluno('src/routes/screens/TelaHomeAluno.js');
  assert.match(texto(tela),/Seus turnos:.*Manhã/);
  const botao=tela.root.findAllByType('TouchableOpacity').find(n=>n.findAllByType('Text').some(t=>t.props.children==='Confirmar esta refeição'));
  await agir(()=>botao.props.onPress());
  assert.equal(rotas[0][0],'Confirmacao');assert.equal(rotas[0][1].refeicao.id,refeicaoId());await fechar(tela);
});
test('02 — confirmação salva UID, nome, turma, escola e refeição atuais',async()=>{
  const {runtime,tela}=await aluno();await agir(()=>porId(tela,'confirmar-sim').props.onPress());
  assert.match(texto(tela),/Refeição confirmada/);
  const b=runtime.backend();const r=(await b.getDoc(ref(b,'confirmacoes',`${refeicaoId()}_demo-aluno-manha`))).data();
  assert.equal(r.alunoId,'demo-aluno-manha');assert.equal(r.turma,'3º Ano do Ensino Médio');assert.equal(r.escola,'Satc');assert.equal(r.vaiConsumir,true);await fechar(tela);
});
test('03 — prazo vencido bloqueia o botão e a gravação mesmo se o handler for invocado',async()=>{
  const {runtime,tela}=await aluno();const b=runtime.backend();
  await agir(()=>b.updateDoc(ref(b,'NomePratos',refeicaoId()),{horarioLimite:'07:00'}));
  assert.equal(porId(tela,'confirmar-sim').props.disabled,true);
  await agir(()=>porId(tela,'confirmar-sim').props.onPress());
  assert.equal((await b.getDoc(ref(b,'confirmacoes',`${refeicaoId()}_demo-aluno-manha`))).exists(),false);
  assert.match(runtime.alertas[0][1],/prazo/);await fechar(tela);
});
test('04 — toque duplo e alteração de resposta mantêm um único registro do aluno',async()=>{
  const {runtime,tela}=await aluno();const salvar=porId(tela,'confirmar-sim').props.onPress;
  await agir(()=>Promise.all([salvar(),salvar()]));assert.equal(runtime.alertas.length,1);
  await agir(()=>porId(tela,'confirmar-nao').props.onPress());
  const b=runtime.backend(),itens=await b.getDocs(b.collection(b.database,'confirmacoes'));
  const meus=itens.docs.filter(n=>n.data().alunoId==='demo-aluno-manha');assert.equal(meus.length,1);assert.equal(meus[0].data().vaiConsumir,false);await fechar(tela);
});
test('05 — avaliação exige escolher uma nota e respeita comentário opcional',async()=>{
  const {tela}=await aluno('src/routes/screens/TelaFeedbackAluno.js');
  assert.equal(porId(tela,'enviar-avaliacao').props.disabled,true);
  await agir(()=>porId(tela,'nota-5').props.onPress());assert.equal(porId(tela,'enviar-avaliacao').props.disabled,false);await fechar(tela);
});
test('06 — enviar, editar e cancelar não criam uma avaliação extra',async()=>{
  const {runtime,tela}=await aluno('src/routes/screens/TelaFeedbackAluno.js');
  await agir(()=>porId(tela,'nota-5').props.onPress());await agir(()=>porId(tela,'comentario').props.onChangeText('Gostei do prato.'));
  await agir(()=>porId(tela,'enviar-avaliacao').props.onPress());assert.match(texto(tela),/Avaliação registrada/);
  await agir(()=>porId(tela,'editar-avaliacao').props.onPress());await agir(()=>porId(tela,'nota-4').props.onPress());await agir(()=>porId(tela,'enviar-avaliacao').props.onPress());
  const b=runtime.backend(),doc=await b.getDoc(ref(b,'feedbacks',`${refeicaoId()}_demo-aluno-manha`));assert.equal(doc.data().nota,4);assert.equal(doc.data().comentario,'Gostei do prato.');await fechar(tela);
});
test('07 — avaliação antiga compatível continua no documento original',async()=>{
  const runtime=criarRuntime();await runtime.demo().entrarDemonstracao('aluno');runtime.demo().definirHorarioDemo('21:00');const b=runtime.backend(),antigo=`${data()}_demo-aluno-manha`;
  await b.setDoc(ref(b,'feedbacks',antigo),{alunoId:'demo-aluno-manha',refeicaoId:refeicaoId(),data:data(),nota:3,emojiValor:'ok',criadoEm:{seconds:100},comentario:'Antigo'});
  const tela=await runtime.render('src/routes/screens/TelaFeedbackAluno.js',{navigation:{navigate(){}}});assert.match(texto(tela),/Antigo/);
  await agir(()=>porId(tela,'editar-avaliacao').props.onPress());await agir(()=>porId(tela,'nota-5').props.onPress());await agir(()=>porId(tela,'enviar-avaliacao').props.onPress());
  assert.equal((await b.getDoc(ref(b,'feedbacks',antigo))).data().nota,5);assert.equal((await b.getDoc(ref(b,'feedbacks',antigo))).data().criadoEm.seconds,100);
  assert.equal((await b.getDoc(ref(b,'feedbacks',`${refeicaoId()}_demo-aluno-manha`))).exists(),false);await fechar(tela);
});
test('08 — outra refeição e dados de navegação não permitem trocar a identidade do aluno',async()=>{
  const outro=`demo-${data()}-noite`;
  const {runtime,tela}=await aluno('src/routes/screens/TelaDeConfirmacao.js',{route:{params:{refeicao:{id:outro},alunoId:'outro-aluno',turno:'noite'}}});
  assert.ok(!host(tela,n=>n.props.testID==='confirmar-sim'));
  await assert.rejects(runtime.carregar('src/services/aluno.js').salvarConfirmacao(outro,true),/turnos/);await fechar(tela);
});
test('09 — erro de leitura em avaliação não é tratado como ausência de resposta',async()=>{
  const runtime=criarRuntime();await runtime.demo().entrarDemonstracao('aluno');const original=runtime.demo().demoStore.escutar;
  runtime.demo().demoStore.escutar=(ref,sucesso,erro)=>ref.colecao==='feedbacks' ? (queueMicrotask(()=>erro(new Error('falha'))),()=>{}) : original(ref,sucesso,erro);
  const tela=await runtime.render('src/routes/screens/TelaFeedbackAluno.js',{navigation:{navigate(){}}});assert.match(texto(tela),/Dados indisponíveis/);assert.ok(!host(tela,n=>n.props.testID==='enviar-avaliacao'));await fechar(tela);
});
test('10 — jornada aluno → equipe atualiza o dashboard com confirmação e pesagens',async()=>{
  const {runtime,tela}=await aluno();await agir(()=>porId(tela,'confirmar-sim').props.onPress());await fechar(tela);
  await runtime.demo().entrarDemonstracao('admin');runtime.demo().definirHorarioDemo('21:00');
  await runtime.carregar('src/services/producao.js').salvarProducao({refeicaoId:refeicaoId(),formulario:{preparadoKg:'15',sobraLimpaKg:'1',sobraDescartadaKg:'0,5',restosKg:'0,5',servidos:'50'}});
  const painel=await runtime.render('src/routes/screens/DashboardAdmin.js',{navigation:{navigate(){}}});
  const indicadores=painel.root.findAll(n=>typeof n.type==='function' && n.type.name==='Indicador');
  assert.equal(indicadores.find(n=>n.props.label==='Refeições confirmadas').props.valor,10);
  assert.equal(indicadores.find(n=>n.props.label==='Refeições servidas').props.valor,50);
  await fechar(painel);
});

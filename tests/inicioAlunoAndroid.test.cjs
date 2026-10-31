const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('node:module').createRequire(require.resolve('react-test-renderer'))('react');
const renderer = require('react-test-renderer');
const { criarRuntime, agir, porId, texto } = require('./runtime.cjs');
const perfil = { nome:'João Pedro',escola:'Satc',tipoConta:'aluno',matricula:'123456',turma:'3º Ano',turnos:['manha','tarde'] };
const agora = new Date('2026-10-29T16:00:00Z'); // 13h na escola.
const refeicao = (id, turno, fim, outros={}) => ({id,turno,horarioFim:fim,horarioLimite:'14:00',data:'2026-10-29',escola:'Satc',nome:'Arroz e feijão',tipo:'Almoço',ativo:true,...outros});
function preparar(lista=[], extras={}) {
  const fontes=[],rotas=[];
  const rt=criarRuntime({largura:390,modulos:{
    '../../hooks/useDados': {usePerfil:()=>({perfil,carregando:false,tentarNovamente(){}}),useColecaoEscola:(nome,p,filtros)=>{fontes.push({nome,filtros});return {dados:nome==='NomePratos'?lista:[],carregando:false,tentarNovamente(){}};}},
    '../../hooks/useAgora':{useAgora:()=>agora},
    '../../services/backend':{auth:{currentUser:{uid:'aluno-1',emailVerified:true}}},...extras,
  }});
  return {rt,fontes,rotas,render:()=>rt.render('src/routes/screens/TelaHomeAluno.js',{navigation:{navigate:(...args)=>rotas.push(args)}})};
}

test('início mostra nome real, próxima refeição e todos os atalhos funcionam',async()=>{
  const c=preparar([refeicao('tarde','tarde','16:00')]),tela=await c.render();
  assert.match(texto(tela),/Olá,\s+João\s*!/);assert.match(texto(tela),/Alimentação de qualidade/);
  for(const id of ['cardapio','refeicoes','feedback'])await agir(()=>porId(tela,`servico-${id}`).props.onPress());
  assert.deepEqual(c.rotas.map(r=>r[0]),['Cardapio','MinhasRefeicoes','Feedback']);
  await agir(()=>porId(tela,'proxima-refeicao').props.onPress());
  assert.deepEqual(c.rotas.at(-1),['Confirmacao',{refeicao:{id:'tarde'}}]);
  await agir(()=>tela.unmount());
});

test('próxima refeição descarta encerradas, arquivadas, outra escola e outro turno',()=>{
  const c=preparar(),fn=c.rt.carregar('src/routes/screens/TelaHomeAluno.js').proximaRefeicao;
  const pratos=[refeicao('vencida','manha','12:30'),refeicao('inativa','tarde','15:00',{ativo:false}),refeicao('outra','tarde','15:00',{escola:'Outra'}),refeicao('noite','noite','20:00'),refeicao('tarde','tarde','16:00'),refeicao('amanha','manha','12:30',{data:'2026-10-30'}),refeicao('invalida','tarde','16:00',{data:'2026-02-30'})];
  assert.equal(fn(pratos,perfil,agora).id,'tarde');
  assert.equal(fn(pratos.slice(0,4),perfil,agora),null);
});

test('matrícula mostra dados reais e fecha pelo voltar do Android',async()=>{
  const c=preparar(),tela=await c.render();
  await agir(()=>porId(tela,'servico-matricula').props.onPress());
  assert.match(texto(tela),/Matrícula:\s+123456/);assert.match(texto(tela),/Turnos:\s+Manhã e Tarde/);
  await agir(()=>tela.root.findByType('Modal').props.onRequestClose());
  assert.equal(tela.root.findByType('Modal').props.visible,false);
  assert.ok(porId(tela,'sem-proxima-refeicao'));
  await agir(()=>tela.unmount());
});

test('falha de consulta não aparece como ausência de refeições',async()=>{
  const c=preparar([],{'../../hooks/useDados':{usePerfil:()=>({perfil,carregando:false,tentarNovamente(){}}),useColecaoEscola:()=>({dados:[],carregando:false,erro:'Sem conexão',tentarNovamente(){}})}}),tela=await c.render();
  assert.match(texto(tela),/Sem conexão/);
  assert.equal(tela.root.findAll(n=>n.type==='View'&&n.props.testID==='sem-proxima-refeicao').length,0);
  await agir(()=>tela.unmount());
});

test('histórico consulta somente o aluno autenticado e mantém período limitado',async()=>{
  const c=preparar(),tela=await c.rt.render('src/routes/screens/TelaMinhasRefeicoes.js',{navigation:{navigate(){}}});
  const consulta=c.fontes.find(f=>f.nome==='confirmacoes');
  assert.deepEqual(consulta.filtros,[['alunoId','==','aluno-1'],['data','>=','2026-09-29'],['data','<=','2026-10-29']]);
  await agir(()=>tela.unmount());
});

async function ciclo(rota='HomeAluno',verificado=true,plataforma='android') {
  let evento,removeu=false;
  const resets=[];
  const auth={currentUser:verificado===null?null:{uid:'teste',emailVerified:verificado}};
  const rt=criarRuntime({plataforma,modulos:{'../services/backend':{auth}}});
  rt.native.AppState={currentState:'active',addEventListener:(nome,fn)=>{assert.equal(nome,'change');evento=fn;return {remove:()=>{removeu=true;}};}};
  const nav={isReady:()=>true,getRootState:()=>({index:0,routes:[{name:rota}]}),resetRoot:s=>resets.push(s)};
  const hook=rt.carregar('src/hooks/useRetornoInicio.js').default;
  function Harness(){hook(nav);return null;}
  let tela;await agir(()=>{tela=renderer.create(React.createElement(Harness));});
  return {resets,auth,emit:estado=>agir(()=>evento?.(estado)),fechar:async()=>{await agir(()=>tela.unmount());return removeu;}};
}

test('Android volta ao início após segundo plano sem apagar a sessão',async()=>{
  for(const rota of ['HomeAluno','Confirmacao','Feedback','HomeAdmin']){
    const c=await ciclo(rota),usuario=c.auth.currentUser;
    await c.emit('background');await c.emit('active');
    assert.equal(c.resets.length,1);
    assert.equal(c.resets[0].routes[0].name,rota==='HomeAdmin'?'HomeAdmin':'HomeAluno');
    assert.equal(c.resets[0].routes[0].state.routes[0].name,rota==='HomeAdmin'?'DashboardAdmin':'InicioAluno');
    assert.equal(c.auth.currentUser,usuario);assert.equal(await c.fechar(),true);
  }
});

test('não reinicia por evento active repetido, inactive, cadastro ou conta não verificada',async()=>{
  const c=await ciclo();
  await c.emit('active');await c.emit('inactive');await c.emit('active');assert.equal(c.resets.length,0);await c.fechar();
  for(const [rota,verificado] of [['Consentimento',true],['VerificarEmail',true],['Login',true],['HomeAluno',false],['HomeAluno',null]]){
    const c=await ciclo(rota,verificado);await c.emit('background');await c.emit('active');assert.equal(c.resets.length,0);await c.fechar();
  }
});
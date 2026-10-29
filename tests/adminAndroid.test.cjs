const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('node:module').createRequire(require.resolve('react-test-renderer'))('react');
const { criarRuntime, agir, porId, texto } = require('./runtime.cjs');

test('calendário Android mantém seis linhas com sete dias e quinta na coluna correta', async () => {
  const rt = criarRuntime({ largura: 320 }), escolhidas = [];
  const tela = await rt.render('src/components/Calendario.js', { label:'Dia da refeição',value:'2026-10-29',max:'2026-10-29',onChange:d => escolhidas.push(d) });
  await agir(() => porId(tela,'calendario-Dia da refeição').props.onPress());
  const linhas = tela.root.findAll(n => n.type === 'View' && /^semana-calendario-/.test(n.props.testID || ''));
  assert.equal(linhas.length,6);
  for (const linha of linhas) assert.equal(linha.findAll(n => n.type === 'TouchableOpacity' && /^dia-/.test(n.props.testID || '')).length,7);
  const semana = linhas.find(linha => linha.findAll(n => n.type === 'TouchableOpacity' && n.props.testID === 'dia-2026-10-29').length);
  const dias = semana.findAll(n => n.type === 'TouchableOpacity');
  assert.equal(dias[3].props.testID,'dia-2026-10-29');
  assert.equal(porId(tela,'dia-2026-10-30').props.disabled,true);
  await agir(() => porId(tela,'dia-2026-10-28').props.onPress());
  assert.deepEqual(escolhidas,['2026-10-28']);
  await agir(() => tela.unmount());
});

test('grade civil não muda com o fuso do aparelho, inclusive ano bissexto', () => {
  const dominio = criarRuntime().carregar('src/domain/calendario.js');
  const anterior = process.env.TZ;
  try {
    let referencia;
    for (const tz of ['UTC','America/Sao_Paulo','America/Los_Angeles','Pacific/Kiritimati']) {
      process.env.TZ = tz;
      const grade = dominio.gradeMes('2026-10-29');
      if (!referencia) referencia = grade;
      assert.deepEqual(grade,referencia);
      assert.equal(grade[0].id,'2026-09-28');
      assert.ok(dominio.gradeMes('2024-02-29').some(d => d.id === '2024-02-29' && d.noMes));
      assert.equal(dominio.moverMes('2026-12-31',1),'2027-01-01');
    }
  } finally { if (anterior === undefined) delete process.env.TZ; else process.env.TZ = anterior; }
});

test('menu nativo fecha pelo voltar do Android e envia o destino escolhido', async () => {
  const rt = criarRuntime({largura:360}), destinos = [];let fechou = 0;
  const tela = await rt.render('src/components/MenuLateralAdmin.js', { aberto:true,rotaAtual:'DashboardAdmin',escola:'Satc',onFechar:() => fechou++,onSelecionar:r => destinos.push(r),onSair:async()=>{} });
  await agir(() => porId(tela,'menu-FeedbackAdmin').props.onPress());
  assert.deepEqual(destinos,['FeedbackAdmin']);
  const modal = tela.root.findByType('Modal');
  await agir(() => modal.props.onRequestClose());
  assert.equal(fechou,1);
  const rotas = rt.carregar('src/components/MenuLateralAdmin.js').SECOES_MENU_ADMIN.flatMap(s => s.itens.map(i => i.rota));
  assert.equal(new Set(rotas).size,rotas.length);
  await agir(() => tela.unmount());
});

function prepararTela(arquivo, patch={}) {
  const fontes = [];
  const perfil = {nome:'Diretor',escola:'Satc',tipoConta:'admin',...patch.perfil};
  const dados = { usePerfil:() => ({perfil,carregando:false}), useColecaoEscola:(nome, p, filtros) => { fontes.push({nome,filtros}); return {dados:[],carregando:false,tentarNovamente(){}}; } };
  const rt = criarRuntime({modulos:{'../../hooks/useDados':dados,'../../hooks/useAgora':{useAgora:patch.agora || (() => new Date('2026-10-29T01:00:00Z'))},...patch.modulos}});
  return {rt,fontes,render:props => rt.render(arquivo,props)};
}

test('painel exibe resumo e não repete atalhos de navegação', async () => {
  const c=prepararTela('src/routes/screens/DashboardAdmin.js');const tela=await c.render();const t=texto(tela);
  assert.match(t,/Visão geral/);assert.match(t,/Confirmadas/);assert.match(t,/Sobras/);
  assert.doesNotMatch(t,/Comentários de hoje|Gestão escolar|Cadastrar refeição|Sair da conta/);
  assert.equal(c.fontes.some(f=>f.nome==='solicitacoesPrivacidade'),false);
  await agir(()=>tela.unmount());
});

test('restrições consultam somente cadastros, sem refeições ou confirmações', async () => {
  const c=prepararTela('src/routes/screens/TelaRestricoesAdmin.js');const tela=await c.render();const t=texto(tela);
  assert.match(t,/cadastrados na escola/);assert.doesNotMatch(t,/Por refeição|Dia da refeição|Confirmaram/);
  assert.deepEqual([...new Set(c.fontes.map(f=>f.nome))].sort(),['restricoesAlimentares','usuarios']);
  await agir(()=>tela.unmount());
});

test('avaliações iniciam no dia da escola e consultam a data selecionada', async () => {
  const c=prepararTela('src/routes/screens/TelaDeFeedbackAdmin.js');const tela=await c.render();
  // UTC já está no dia 29, mas na escola ainda é dia 28.
  assert.match(texto(tela),/28\/10\/2026/);
  await agir(()=>porId(tela,'calendario-Dia da refeição').props.onPress());
  await agir(()=>porId(tela,'dia-2026-10-27').props.onPress());
  assert.deepEqual(c.fontes.at(-1).filtros,[['data','==','2026-10-27']]);
  assert.match(texto(tela),/27\/10\/2026/);
  await agir(()=>tela.unmount());
});

test('convite preserva autorização se o envio falhar e reenviar não recria conta', async () => {
  let criacoes=0,envios=0;
  const usuario={uid:'diretor',emailVerified:true};
  const c=prepararTela('src/routes/screens/CadastroAdmin.js',{modulos:{'../../services/backend':{auth:{currentUser:usuario},convidarAdministrador:async dados=>{criacoes++;assert.equal(dados.email,'novo@teste.com');assert.equal(dados.escola,undefined);return {...dados,uid:'novo',escola:'Satc'};},sendPasswordResetEmail:async()=>{envios++;if(envios===1)throw Error('Rede');}}}});
  const tela=await c.render({navigation:{goBack(){},navigate(){}}});
  await agir(()=>porId(tela,'nome-novo-admin').props.onChangeText('Novo Diretor'));
  await agir(()=>porId(tela,'email-novo-admin').props.onChangeText(' NOVO@Teste.com '));
  await agir(()=>porId(tela,'autorizar-novo-admin').props.onPress());
  assert.match(texto(tela),/acesso já está autorizado/);
  await agir(()=>porId(tela,'reenviar-convite-admin').props.onPress());
  assert.equal(criacoes,1);assert.equal(envios,2);assert.equal(usuario.uid,'diretor');
  assert.match(texto(tela),/Link de senha enviado/);
  await agir(()=>tela.unmount());
});

test('aluno não recebe formulário de autorização administrativa', async()=>{
  const c=prepararTela('src/routes/screens/CadastroAdmin.js',{perfil:{tipoConta:'aluno'},modulos:{'../../services/backend':{auth:{currentUser:{uid:'aluno',emailVerified:true}}}}});
  const tela=await c.render({navigation:{goBack(){}}});
  assert.equal(tela.root.findAll(n=>n.type==='TouchableOpacity'&&n.props.testID==='autorizar-novo-admin').length,0);
  await agir(()=>tela.unmount());
});

test('avaliações seguem a virada do dia quando nenhuma data foi escolhida', async () => {
  let agora = new Date('2026-10-29T02:59:00Z');
  const c = prepararTela('src/routes/screens/TelaDeFeedbackAdmin.js', {agora:() => agora});
  const tela = await c.render();
  assert.match(texto(tela),/28\/10\/2026/);
  agora = new Date('2026-10-29T03:01:00Z');
  const Componente = c.rt.carregar('src/routes/screens/TelaDeFeedbackAdmin.js').default;
  await agir(() => tela.update(React.createElement(Componente)));
  assert.deepEqual(c.fontes.at(-1).filtros,[['data','==','2026-10-29']]);
  assert.match(texto(tela),/29\/10\/2026/);
  await agir(() => tela.unmount());
});
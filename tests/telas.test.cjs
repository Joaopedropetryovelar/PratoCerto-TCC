const test = require('node:test');
const assert = require('node:assert/strict');
const { criarRuntime, agir, host, porId, texto } = require('./runtime.cjs');
const data = () => '2026-10-12';
const idHoje = () => `demo-${data()}-manha`;
async function preparar(arquivo = 'src/routes/screens/TelaProducao.js') {
  const runtime = criarRuntime();
  await runtime.demo().entrarDemonstracao('admin');runtime.demo().definirHorarioDemo('21:00');
  const rotas = [];
  const tela = await runtime.render(arquivo, { navigation: { navigate: (rota) => rotas.push(rota) } });
  return { runtime, tela, rotas };
}
async function abrir(tela) { await agir(() => porId(tela, `abrir-${idHoje()}`).props.onPress()); }
async function preencher(tela) {
  await agir(() => host(tela,n => n.props.accessibilityLabel === 'Pesagem detalhada').props.onPress());
  for (const [id, valor] of [['preparadoKg','10'],['sobraLimpaKg','1'],['sobraDescartadaKg','0,5'],['restosKg','0,5'],['servidos','30']]) await agir(() => porId(tela,id).props.onChangeText(valor));
}
async function fechar(tela) { await agir(() => tela.unmount()); }

test('01 — produção carrega refeições e distingue pesagens ainda não registradas', async () => {
  const { tela } = await preparar();
  assert.match(texto(tela), /Quantidades ainda não registradas/);
  assert.doesNotMatch(texto(tela), /Carregando dados/);
  await fechar(tela);
});
test('02 — formulário vazio não grava e mostra erros nos campos', async () => {
  const { tela, runtime } = await preparar(); await abrir(tela);
  await agir(() => porId(tela,'salvar-producao').props.onPress());
  assert.match(texto(tela), /Informe um peso/);
  const b = runtime.backend();
  assert.equal((await b.getDoc(b.doc(b.database,'producao',idHoje()))).exists(), false);
  await fechar(tela);
});
test('03 — prévia e gravação exibem o descarte correto e atualizam a lista', async () => {
  const { tela, runtime } = await preparar(); await abrir(tela); await preencher(tela);
  assert.match(texto(tela), /Descarte total:\s+1,000\s+kg/);
  assert.match(texto(tela), /Taxa de descarte:\s+10,0\s*%/);
  await agir(() => porId(tela,'salvar-producao').props.onPress());
  assert.match(texto(tela), /30 refeições servidas/);
  assert.equal(runtime.alertas[0][0], 'Produção registrada');
  await fechar(tela);
});
test('04 — dois toques imediatos no salvar produzem uma única gravação', async () => {
  const { tela, runtime } = await preparar(); await abrir(tela); await preencher(tela);
  const salvar = porId(tela,'salvar-producao').props.onPress;
  await agir(() => Promise.all([salvar(), salvar()]));
  assert.equal(runtime.alertas.filter((item) => item[0] === 'Produção registrada').length, 1);
  await fechar(tela);
});
test('05 — conflito de revisão preserva o texto digitado e oferece recarregar', async () => {
  const { tela, runtime } = await preparar(); await abrir(tela); await preencher(tela);
  const s = runtime.carregar('src/services/producao.js');
  await agir(() => s.salvarProducao({ refeicaoId:idHoje(), formulario:{preparadoKg:'12',sobraLimpaKg:'0',sobraDescartadaKg:'0',restosKg:'0',servidos:'35'} }));
  await agir(() => porId(tela,'salvar-producao').props.onPress());
  assert.match(texto(tela), /registro foi atualizado/);
  assert.equal(porId(tela,'preparadoKg').props.value,'10');
  assert.match(texto(tela), /Recarregar registro/);
  await fechar(tela);
});
test('06 — data futura no filtro não consulta nem muda a data aplicada', async () => {
  const { tela } = await preparar();
  await agir(()=>porId(tela,'calendario-Data da refeição').props.onPress());
  assert.equal(porId(tela,'dia-2026-10-13').props.disabled,true);
  assert.equal(porId(tela,'dia-2026-10-12').props.accessibilityState.selected,true);
  assert.ok(porId(tela,`abrir-${idHoje()}`));
  await fechar(tela);
});
test('07 — dashboard conserva indicadores e leva ao relatório sem blocos de pesagens', async () => {
  const { tela, runtime, rotas } = await preparar('src/routes/screens/DashboardAdmin.js');
  assert.match(texto(tela), /Painel da equipe/);
  assert.match(texto(tela), /Refeições servidas/);assert.doesNotMatch(texto(tela), /Descarte por dia|Resultado das pesagens/);
  assert.doesNotMatch(texto(tela), /NaN|Infinity/);
  const registrar = tela.root.findAllByType('TouchableOpacity').find(item=>item.findAllByType('Text').some(t=>t.props.children==='Abrir relatórios'));
  await agir(()=>registrar.props.onPress());
  assert.deepEqual(rotas,['Relatorios']);
  assert.equal(runtime.alertas.length,0);
  await fechar(tela);
});
test('08 — relatório filtra turno e compartilha o CSV dos registros exibidos', async () => {
  const { tela, runtime } = await preparar('src/routes/screens/TelaRelatorios.js');
  const tarde=host(tela,item=>item.type==='TouchableOpacity' && item.props.accessibilityLabel==='Tarde');
  await agir(()=>tarde.props.onPress());
  await agir(()=>porId(tela,'exportar').props.onPress());
  assert.equal(runtime.compartilhamentos.length,1);
  const csv=runtime.compartilhamentos[0].message;
  assert.ok(csv.includes('"tarde"')); assert.ok(!csv.includes('"manha"')); assert.ok(!csv.includes('"noite"'));
  assert.match(texto(tela), /dados fictícios/);
  await fechar(tela);
});
test('09 — falha de leitura mostra erro e tentativa novamente, sem falso resultado vazio', async () => {
  const runtime=criarRuntime(); await runtime.demo().entrarDemonstracao('admin');
  const original=runtime.demo().demoStore.escutar;
  runtime.demo().demoStore.escutar=(ref, sucesso,erro)=>ref.colecao==='producao' ? (queueMicrotask(()=>erro(new Error('falha simulada'))), ()=>{}) : original(ref,sucesso,erro);
  const tela=await runtime.render('src/routes/screens/DashboardAdmin.js',{navigation:{navigate(){}}});
  assert.match(texto(tela),/Dados indisponíveis/); assert.doesNotMatch(texto(tela),/Descarte medido/);
  runtime.demo().demoStore.escutar=original;
  const tentar=tela.root.findAllByType('TouchableOpacity').find(item=>item.findAllByType('Text').some(t=>t.props.children==='Tentar novamente'));
  await agir(()=>tentar.props.onPress());
  assert.match(texto(tela),/Refeições servidas/);
  await fechar(tela);
});
test('10 — gráfico com descarte zero não gera alturas inválidas', async () => {
  const runtime=criarRuntime(); await runtime.demo().entrarDemonstracao('admin');
  const item={refeicaoId:'prato',data:data(),turno:'manha',preparadoG:1000,sobraLimpaG:0,sobraDescartadaG:0,restosG:0,servidos:10};
  const tela=await runtime.render('src/components/GraficoDescarte.js',{registros:[item]});
  tela.root.findAllByType('View').forEach(item=>{ if(typeof item.props.style?.height==='number')assert.ok(Number.isFinite(item.props.style.height)); });
  assert.match(texto(tela),/0,00/); await fechar(tela);
});

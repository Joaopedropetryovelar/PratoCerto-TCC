const {test}=require('node:test');const assert=require('node:assert/strict');const React=require('react');
const {criarRuntime,agir,host,porId,texto}=require('./runtime.cjs');
async function preparar(tipo='admin') {const r=criarRuntime();await r.demo().entrarDemonstracao(tipo,'multi');r.demo().definirHorarioDemo('21:00');return r;}
const nav={navigate(){}};const fechar=t=>agir(()=>t.unmount());
test('V4 — 300 avaliações ficam em páginas de seis e busca aceita acentos',async()=>{
 const r=await preparar(),b=r.backend();
 for(let i=0;i<300;i+=1)await b.setDoc(b.doc(b.database,'feedbacks',`extra-${i}`),{escola:'Satc',alunoId:`extra-${i}`,alunoNome:`Aluno ${String(i).padStart(3,'0')}`,refeicaoId:'demo-2026-10-12-manha',refeicaoNome:'Arroz',data:'2026-10-12',turno:'manha',nota: i%2?2:5,comentario:`Comentário exclusivo ${i}`,etiquetas:[],dataResposta:{seconds:10000000000+i}});
 const t=await r.render('src/routes/screens/TelaDeFeedbackAdmin.js',{navigation:nav});
 const cards=()=>t.root.findAll(n=>typeof n.type==='function'&&n.type.name==='CartaoRefeicao');
 assert.equal(cards().length,6);assert.match(texto(t),/Página 1 de 51/);
 await agir(()=>porId(t,'avaliacoes-seguinte').props.onPress());assert.match(texto(t),/Página 2 de 51/);assert.equal(cards().length,6);
 await agir(()=>porId(t,'buscar-avaliacao').props.onChangeText('comentario exclusivo 299'));assert.equal(cards().length,1);assert.match(texto(t),/Página 1 de 1/);
 await agir(()=>host(t,n=>n.props.accessibilityLabel==='5 / 5').props.onPress());assert.match(texto(t),/Nenhuma avaliação/);await fechar(t);
});
test('V4 — registros de um mês são agrupados por dia e exportação mantém todos',async()=>{
 const r=await preparar(),b=r.backend();
 for(let i=1;i<=9;i+=1)await b.setDoc(b.doc(b.database,'producao',`quick-${i}`),{schemaVersion:2,escola:'Satc',refeicaoId:`quick-${i}`,refeicaoNome:`Prato rápido ${i}`,data:`2026-10-${String(i).padStart(2,'0')}`,turno:'manha',servidos:20,sobraTotalG:1000,observacao:'',exemplo:true});
 const t=await r.render('src/routes/screens/TelaRelatorios.js',{navigation:nav});
 await agir(()=>host(t,n=>n.props.accessibilityLabel==='Últimos 30 dias').props.onPress());
 assert.ok(!host(t,n=>n.props.testID==='registros-seguinte'));
 await agir(()=>porId(t,'ver-registros').props.onPress());assert.match(texto(t),/Página 1 de/);
 const numero=t.root.findAll(n=>typeof n.type==='function'&&n.type.name==='Indicador').find(n=>n.props.label==='Refeições servidas').props.valor;
 await agir(()=>porId(t,'registros-seguinte').props.onPress());
 assert.equal(t.root.findAll(n=>typeof n.type==='function'&&n.type.name==='DiaResultado').length,4);
 await agir(()=>porId(t,'buscar-registros').props.onChangeText('inexistente'));assert.match(texto(t),/Nenhum registro encontrado/);
 assert.equal(t.root.findAll(n=>typeof n.type==='function'&&n.type.name==='Indicador').find(n=>n.props.label==='Refeições servidas').props.valor,numero);
 await agir(()=>porId(t,'exportar').props.onPress());assert.match(r.compartilhamentos[0].message,/Prato rápido 1/);assert.match(r.compartilhamentos[0].message,/Prato rápido 9/);await fechar(t);
});
test('V4 — produção rápida grava duas quantidades sem inventar descarte',async()=>{
 const r=await preparar(),b=r.backend(),id='demo-2026-10-12-manha';const t=await r.render('src/routes/screens/TelaProducao.js',{navigation:nav});
 await agir(()=>porId(t,`abrir-${id}`).props.onPress());assert.ok(!host(t,n=>n.props.testID==='preparadoKg'));
 await agir(()=>porId(t,'servidos').props.onChangeText('100'));await agir(()=>porId(t,'sobraTotalKg').props.onChangeText('30'));await agir(()=>porId(t,'salvar-producao').props.onPress());
 const p=(await b.getDoc(b.doc(b.database,'producao',id))).data();assert.equal(p.schemaVersion,2);assert.equal(p.sobraTotalG,30000);assert.equal(p.servidos,100);assert.equal(p.sobraDescartadaG,undefined);await fechar(t);
});
test('V4 — confirmação marca a escolha depois da gravação e mantém ao reabrir',async()=>{
 const r=await preparar('aluno');r.demo().definirHorarioDemo('08:00');const props={navigation:nav,route:{params:{refeicao:{id:'demo-2026-10-12-manha'}}}};
 let t=await r.render('src/routes/screens/TelaDeConfirmacao.js',props);assert.equal(porId(t,'confirmar-sim').props.accessibilityState.selected,false);
 await agir(()=>porId(t,'confirmar-sim').props.onPress());assert.equal(porId(t,'confirmar-sim').props.accessibilityState.selected,true);assert.ok(porId(t,'resposta-salva'));await fechar(t);
 t=await r.render('src/routes/screens/TelaDeConfirmacao.js',props);assert.equal(porId(t,'confirmar-sim').props.accessibilityState.selected,true);
 await agir(()=>porId(t,'confirmar-nao').props.onPress());assert.equal(porId(t,'confirmar-sim').props.accessibilityState.selected,false);assert.equal(porId(t,'confirmar-nao').props.accessibilityState.selected,true);await fechar(t);
});
test('V4 — paginação limita e reinicia quando o filtro muda',async()=>{
 const r=criarRuntime(),arquivo='src/components/ListaPaginada.js';let props={itens:Array.from({length:20},(_,i)=>i),tamanho:5,chave:'a',renderItem:i=>React.createElement('Text',{key:i},`Item ${i}`)};
 const t=await r.render(arquivo,props);await agir(()=>porId(t,'lista-seguinte').props.onPress());assert.match(texto(t),/Item 5/);assert.doesNotMatch(texto(t),/Item 0/);
 props={...props,chave:'b',itens:[0,1]};await agir(()=>t.update(React.createElement(r.carregar(arquivo).default,props)));assert.match(texto(t),/Página 1 de 1/);assert.ok(!host(t,n=>n.props.testID==='lista-seguinte'));await fechar(t);
});

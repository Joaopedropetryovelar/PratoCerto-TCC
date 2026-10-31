const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('node:module').createRequire(require.resolve('react-test-renderer'))('react');
const renderer = require('react-test-renderer');
const { criarRuntime, agir, host, porId, texto } = require('./runtime.cjs');

const turma = { id: 'satc_3a', escola: 'Satc', nome: '3º ano A', ativa: true };
const cadastro = { nome: 'Aluno Teste', matricula: '12345', escola: 'Satc', turma: turma.nome, turmaId: turma.id,
  turnos: ['manha'], email: 'aluno@exemplo.invalid', senha: 'Aluno123!', confirmarSenha: 'Aluno123!', aceitouTermos: true, cientePrivacidade: true };

function servicoCadastro(opcoes = {}) {
  const chamadas = [], perfis = [];
  const auth = { currentUser: null };
  const usuario = { uid: 'novo-aluno', emailVerified: false };
  const backend = {
    auth, database: {}, doc: (_, colecao, id) => ({ colecao, id }), serverTimestamp: () => 123,
    getDoc: async () => ({ exists: () => true, id: turma.id, data: () => ({ ...turma, ...opcoes.turma }) }),
    createUserWithEmailAndPassword: async () => { chamadas.push('criar'); auth.currentUser = usuario; return { user: usuario }; },
    updateProfile: async () => { chamadas.push('nome'); },
    sendEmailVerification: async () => { chamadas.push('email'); if (opcoes.falhaEmail) throw Error('Envio indisponível'); },
    signOut: async () => { chamadas.push('sair'); auth.currentUser = null; },
    deleteUser: async () => { chamadas.push('excluir'); auth.currentUser = null; },
    getDocFromServer: async () => {
      if (opcoes.falhaConferencia) throw Error('Sem conexão');
      return { exists: () => false };
    },
  };
  const rt = criarRuntime({ modulos: {
    './backend': backend,
    './matriculas': { vincularMatricula: async perfil => { chamadas.push('matricula'); if (opcoes.falhaMatricula) throw Error('Matrícula não autorizada'); perfis.push(perfil); } },
  } });
  return { auth, chamadas, perfis, cadastrar: rt.carregar('src/services/contas.js').cadastrarAluno };
}

test('cadastro envia o e-mail e encerra a sessão sem apagar o perfil criado', async () => {
  const c = servicoCadastro();
  assert.deepEqual(await c.cadastrar(cadastro), { emailEnviado: true });
  assert.equal(c.auth.currentUser, null);
  assert.deepEqual(c.chamadas, ['criar', 'nome', 'matricula', 'email', 'sair']);
  assert.equal(c.perfis[0].turmaId, turma.id);
  assert.equal(c.perfis[0].tipoConta, 'aluno');
});

test('falha no envio do e-mail preserva o cadastro e também encerra a sessão', async () => {
  const c = servicoCadastro({ falhaEmail: true });
  assert.deepEqual(await c.cadastrar(cadastro), { emailEnviado: false });
  assert.equal(c.auth.currentUser, null);
  assert.equal(c.perfis.length, 1);
  assert.equal(c.chamadas.includes('excluir'), false);
});

test('turma desativada impede criar uma conta', async () => {
  const c = servicoCadastro({ turma: { ativa: false } });
  await assert.rejects(c.cadastrar(cadastro), /turma não está disponível/);
  assert.equal(c.chamadas.includes('criar'), false);
});

test('matrícula recusada desfaz a conta; falha de conferência preserva a conta sem deixá-la conectada', async () => {
  const recusada = servicoCadastro({ falhaMatricula: true });
  await assert.rejects(recusada.cadastrar(cadastro), /Matrícula não autorizada/);
  assert.equal(recusada.auth.currentUser, null);
  assert.ok(recusada.chamadas.includes('excluir'));
  const incerta = servicoCadastro({ falhaMatricula: true, falhaConferencia: true });
  await assert.rejects(incerta.cadastrar(cadastro), /conta foi preservada/);
  assert.equal(incerta.auth.currentUser, null);
  assert.equal(incerta.chamadas.includes('excluir'), false);
});

async function sessaoInicial(usuario, falha = false) {
  let observar, encerrou = 0, cancelou = false;
  const auth = { currentUser: usuario };
  const estados = [];
  const rt = criarRuntime({ modulos: { '../services/backend': {
    auth,
    onAuthStateChanged: (_, fn) => { observar = fn; queueMicrotask(() => { if (!cancelou) fn(auth.currentUser); }); return () => { cancelou = true; }; },
    signOut: async () => { encerrou++; if (falha) throw Error('Falha local'); auth.currentUser = null; observar(null); },
  } } });
  const { ProvedorSessao, useSessao } = rt.carregar('src/hooks/useSessao.js');
  function Observador() { const estado = useSessao(); estados.push(estado); return React.createElement('Text', null, estado.usuario?.uid || estado.erro || 'acesso público'); }
  let tela;
  await agir(() => { tela = renderer.create(React.createElement(ProvedorSessao, null, React.createElement(Observador))); });
  return { tela, estados, get encerrou() { return encerrou; }, entrar: user => agir(() => { auth.currentUser = user; observar(user); }) };
}

test('sessão salva é encerrada na abertura e login manual posterior é aceito', async () => {
  const c = await sessaoInicial({ uid: 'sessao-salva', emailVerified: true });
  assert.equal(c.encerrou, 1);
  assert.equal(c.estados.some(e => e.usuario), false);
  assert.match(texto(c.tela), /acesso público/);
  await c.entrar({ uid: 'login-manual', emailVerified: true });
  assert.match(texto(c.tela), /login-manual/);
  assert.equal(c.encerrou, 1);
  await agir(() => c.tela.unmount());
});

test('abertura sem sessão não força logout; falha ao limpar sessão não libera o usuário salvo', async () => {
  const publica = await sessaoInicial(null);
  assert.equal(publica.encerrou, 0);
  assert.equal(publica.estados.at(-1).carregando, false);
  await agir(() => publica.tela.unmount());
  const falha = await sessaoInicial({ uid: 'salvo', emailVerified: true }, true);
  assert.equal(falha.estados.at(-1).usuario, null);
  assert.match(texto(falha.tela), /Não foi possível preparar o acesso/);
  await agir(() => falha.tela.unmount());
});

function turmasPublicas(extras = {}) {
  const consultas = [], cadastros = [], rotas = [];
  const auth = { currentUser: null };
  const fontes = [turma, { id: 'satc_10', escola: 'Satc', nome: '10º ano', ativa: true },
    { id: 'ags_3', escola: 'Antônio Guglielmi Sobrinho', nome: '3º ano B', ativa: true },
    { id: 'inativa', escola: 'Satc', nome: 'Turma antiga', ativa: false }];
  const rt = criarRuntime({ largura: 390, configuracao: { auth, database: {} }, firestore: {
    collection: (_, nome) => ({ nome }), where: (campo, op, valor) => ({ campo, op, valor }), query: (ref, ...filtros) => ({ ...ref, filtros }),
    onSnapshot: (ref, sucesso) => {
      consultas.push(ref);
      queueMicrotask(() => sucesso({ docs: fontes.filter(t => ref.filtros.every(f => t[f.campo] === f.valor)).map(t => ({ id: t.id, data: () => t })) }));
      return () => {};
    },
  }, modulos: { '../../services/contas': { cadastrarAluno: async dados => { cadastros.push({ ...dados }); return { emailEnviado: true }; } }, ...extras } });
  const navigation = { navigate() {}, goBack() {}, getParent: () => ({ reset: estado => rotas.push(estado) }) };
  return { rt, consultas, cadastros, rotas, navigation };
}

test('aluno sem login abre, busca e seleciona uma turma ativa da própria escola', async () => {
  const c = turmasPublicas(), escolhidas = [];
  const tela = await c.rt.render('src/components/ListaTurmas.js', { escola: 'Satc', valor: '', onChange: t => escolhidas.push(t) });
  assert.deepEqual(c.consultas[0].filtros, [{ campo: 'escola', op: '==', valor: 'Satc' }, { campo: 'ativa', op: '==', valor: true }]);
  assert.equal(porId(tela, 'selecionar-turma').props.disabled, false);
  await agir(() => porId(tela, 'selecionar-turma').props.onPress());
  assert.equal(porId(tela, 'modal-turmas').props.visible, true);
  assert.doesNotMatch(texto(tela), /Turma antiga|3º ano B/);
  await agir(() => porId(tela, 'buscar-turma').props.onChangeText('3º'));
  assert.equal(host(tela, n => n.props.testID === 'turma-satc_10'), undefined);
  await agir(() => porId(tela, `turma-${turma.id}`).props.onPress());
  assert.equal(escolhidas[0].id, turma.id);
  assert.equal(porId(tela, 'modal-turmas').props.visible, false);
  await agir(() => tela.unmount());
});

test('troca de escola fecha a lista e elimina a seleção da escola anterior', async () => {
  const c = turmasPublicas();
  const props = { escola: 'Satc', valor: turma.id, onChange() {} };
  const tela = await c.rt.render('src/components/ListaTurmas.js', props);
  await agir(() => porId(tela, 'selecionar-turma').props.onPress());
  await agir(() => tela.update(React.createElement(c.rt.carregar('src/components/ListaTurmas.js').default, { ...props, escola: 'Antônio Guglielmi Sobrinho', valor: '' })));
  assert.equal(porId(tela, 'modal-turmas').props.visible, false);
  assert.equal(porId(tela, 'selecionar-turma').props.accessibilityLabel, 'Selecionar turma');
  assert.equal(host(tela, n => n.props.testID === `turma-${turma.id}`), undefined);
  await agir(() => tela.unmount());
});

test('cadastro completo exige turma e retorna ao login com e-mail e escola, sem enviar senha na navegação', async () => {
  const c = turmasPublicas();
  const tela = await c.rt.render('src/routes/screens/CadastroScreen.js', { navigation: c.navigation });
  await agir(() => porId(tela, 'nome').props.onChangeText(cadastro.nome));
  await agir(() => porId(tela, 'matricula').props.onChangeText(cadastro.matricula));
  await agir(() => host(tela, n => n.props.accessibilityLabel === 'Satc').props.onPress());
  await agir(() => porId(tela, 'continuar-cadastro').props.onPress());
  assert.match(texto(tela), /Selecione uma turma/);
  await agir(() => porId(tela, 'selecionar-turma').props.onPress());
  await agir(() => porId(tela, `turma-${turma.id}`).props.onPress());
  await agir(() => host(tela, n => n.props.accessibilityRole === 'checkbox' && n.props.accessibilityLabel === 'Manhã').props.onPress());
  await agir(() => porId(tela, 'continuar-cadastro').props.onPress());
  for (const [label, valor] of [['E-mail', cadastro.email], ['Senha', cadastro.senha], ['Confirmar senha', cadastro.senha]]) {
    await agir(() => host(tela, n => n.type === 'TextInput' && n.props.accessibilityLabel === label).props.onChangeText(valor));
  }
  for (const checkbox of tela.root.findAll(n => n.type === 'TouchableOpacity' && n.props.accessibilityRole === 'checkbox')) await agir(() => checkbox.props.onPress());
  await agir(() => porId(tela, 'cadastrar-aluno').props.onPress());
  assert.equal(c.cadastros[0].turmaId, turma.id);
  assert.equal(c.rotas.at(-1).routes[0].name, 'Login');
  const params = c.rotas.at(-1).routes[0].params;
  assert.equal(params.email, cadastro.email);
  assert.equal(params.escola, 'Satc');
  assert.equal(params.cadastroConcluido, true);
  assert.equal(Object.hasOwn(params, 'senha'), false);
  await agir(() => tela.unmount());
});

test('login após cadastro mostra aviso e só abre a área privada quando o aluno pressiona Entrar', async () => {
  const rotas = [], chamadas = [];
  const rt = criarRuntime({ modulos: { '../../services/contas': { entrarConta: async dados => { chamadas.push(dados); return { perfil: { tipoConta: 'aluno' }, verificado: true }; } } } });
  const tela = await rt.render('src/routes/screens/TelaLogin.js', { route: { params: { cadastroConcluido: true, emailEnviado: true, email: cadastro.email, escola: 'Satc' } }, navigation: { reset: estado => rotas.push(estado) } });
  assert.match(texto(tela), /Conta criada!/);
  assert.equal(porId(tela, 'email').props.value, cadastro.email);
  assert.equal(porId(tela, 'senha').props.value, '');
  assert.equal(chamadas.length, 0);
  assert.equal(rotas.length, 0);
  await agir(() => porId(tela, 'senha').props.onChangeText(cadastro.senha));
  await agir(() => porId(tela, 'entrar-conta').props.onPress());
  assert.equal(chamadas[0].escola, 'Satc');
  assert.equal(rotas[0].routes[0].name, 'HomeAluno');
  await agir(() => tela.unmount());
});

test('login sem e-mail confirmado conserva a etapa de verificação', async () => {
  const rotas = [];
  const rt = criarRuntime({ modulos: { '../../services/contas': { entrarConta: async () => ({ perfil: { tipoConta: 'aluno' }, verificado: false }) } } });
  const tela = await rt.render('src/routes/screens/TelaLogin.js', { navigation: { reset: estado => rotas.push(estado) } });
  await agir(() => porId(tela, 'entrar-conta').props.onPress());
  assert.equal(rotas[0].routes[0].name, 'VerificarEmail');
  await agir(() => tela.unmount());
});

test('ícones e ilustração renderizam como imagens locais mesmo sem o componente SVG nativo', async () => {
  const rt = criarRuntime();
  for (const nome of ['menu', 'calendario', 'seta', 'sino', 'folha', 'inicio', 'cardapio', 'confirmar', 'feedback', 'perfil', 'matriculas', 'producao', 'relatorios', 'desconhecido']) {
    const tela = await rt.render('src/components/Icone.js', { nome, cor: '#FFFFFF', tamanho: 32 });
    const imagem = tela.root.findByType('Image');
    assert.match(imagem.props.source.uri, /assets\/icones\/.+\.png$/);
    assert.equal(imagem.props.style.tintColor, '#FFFFFF');
    assert.equal(imagem.props.style.width, 32);
    await agir(() => tela.unmount());
  }
  const prato = await rt.render('src/components/PratoIlustrado.js');
  assert.match(prato.root.findByType('Image').props.source.uri, /prato-ilustrado\.png$/);
  await agir(() => prato.unmount());
});
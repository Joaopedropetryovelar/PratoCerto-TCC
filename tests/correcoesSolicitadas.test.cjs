const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { criarRuntime, agir, porId, texto } = require('./runtime.cjs');
const { editarMatricula } = require('../functions/matriculas');

function criarBanco(registros = {}) {
  const documentos = new Map(Object.entries(registros));
  function referencia(caminho) {
    return { path: caminho, id: caminho.split('/').at(-1) };
  }
  function snapshot(ref) {
    return {
      id: ref.id,
      ref,
      exists: documentos.has(ref.path),
      data: () => documentos.get(ref.path),
    };
  }
  function colecao(nome, filtros = [], limite = Infinity) {
    return {
      nome,
      filtros,
      limite,
      doc: (id) => referencia(`${nome}/${id}`),
      where: (campo, operador, valor) => colecao(nome, [...filtros, [campo, valor]], limite),
      limit: (valor) => colecao(nome, filtros, valor),
    };
  }
  async function ler(ref) {
    if (ref.path) return snapshot(ref);
    const docs = [...documentos.entries()]
      .filter(
        ([chave, valor]) =>
          chave.startsWith(`${ref.nome}/`) &&
          ref.filtros.every(([campo, esperado]) => valor[campo] === esperado),
      )
      .slice(0, ref.limite)
      .map(([chave]) => snapshot(referencia(chave)));
    return { docs, size: docs.length };
  }
  async function transacao(operacao, cliente = false) {
    const escritas = [];
    const resultado = await operacao({
      get: async (ref) => {
        assert.equal(escritas.length, 0, 'As leituras devem acontecer antes das escritas.');
        const documento = await ler(ref);
        return cliente ? { ...documento, exists: () => documento.exists } : documento;
      },
      set: (ref, dados) => escritas.push(() => documentos.set(ref.path, dados)),
      update: (ref, dados) =>
        escritas.push(() => documentos.set(ref.path, { ...documentos.get(ref.path), ...dados })),
      delete: (ref) => escritas.push(() => documentos.delete(ref.path)),
    });
    escritas.forEach((escrever) => escrever());
    return resultado;
  }
  return {
    documentos,
    referencia,
    ler,
    collection: colecao,
    runTransaction: (operacao) => transacao(operacao),
    transacaoCliente: (operacao) => transacao(operacao, true),
  };
}

function contextoMatricula(extras = {}) {
  const banco = criarBanco({
    'usuarios/diretor': { tipoConta: 'admin', escola: 'Satc' },
    'usuarios/aluno': {
      uid: 'aluno',
      tipoConta: 'aluno',
      escola: 'Satc',
      matricula: '00001',
      nome: 'Aluno Teste',
    },
    'matriculasAutorizadas/satc_00001': {
      escola: 'Satc',
      matricula: '00001',
      alunoId: 'aluno',
      email: '',
      ativa: true,
      revisao: 2,
      criadoEm: 10,
      vinculadoEm: 20,
    },
    'confirmacoes/refeicao_aluno': { alunoId: 'aluno', vaiConsumir: true },
    ...extras,
  });
  return {
    banco,
    db: banco,
    actor: { uid: 'diretor', token: { email_verified: true } },
    dados: { matriculaAtual: '00001', novaMatricula: '00002', revisaoEsperada: 2 },
    FieldValue: { serverTimestamp: () => 123 },
  };
}

test('matrícula vinculada muda junto com a autorização e preserva UID e histórico', async () => {
  const contexto = contextoMatricula();
  const resultado = await editarMatricula(contexto);
  assert.equal(resultado.matricula, '00002');
  assert.equal(contexto.banco.documentos.get('usuarios/aluno').matricula, '00002');
  assert.equal(contexto.banco.documentos.get('usuarios/aluno').uid, 'aluno');
  assert.equal(contexto.banco.documentos.has('matriculasAutorizadas/satc_00001'), false);
  assert.equal(contexto.banco.documentos.get('matriculasAutorizadas/satc_00002').alunoId, 'aluno');
  assert.equal(contexto.banco.documentos.get('confirmacoes/refeicao_aluno').vaiConsumir, true);
});

test('autorização pendente permite corrigir número e e-mail e reativar', async () => {
  const contexto = contextoMatricula();
  contexto.banco.documentos.delete('usuarios/aluno');
  contexto.banco.documentos.set('matriculasAutorizadas/satc_00001', {
    escola: 'Satc',
    matricula: '00001',
    alunoId: '',
    ativa: false,
    revisao: 2,
    criadoEm: 10,
  });
  contexto.dados.email = ' Novo@Exemplo.com ';
  await editarMatricula(contexto);
  const autorizacao = contexto.banco.documentos.get('matriculasAutorizadas/satc_00002');
  assert.equal(autorizacao.email, 'novo@exemplo.com');
  assert.equal(autorizacao.ativa, true);
  assert.equal(autorizacao.alunoId, '');
});

test('aluno, direção desativada, e-mail não confirmado e outra escola não corrigem matrícula', async () => {
  for (const alteracao of [
    { 'usuarios/diretor': { tipoConta: 'aluno', escola: 'Satc' } },
    { 'usuarios/diretor': { tipoConta: 'admin', escola: 'Satc', acessoAtivo: false } },
    { 'usuarios/diretor': { tipoConta: 'admin', escola: 'Antônio Guglielmi Sobrinho' } },
  ]) {
    const contexto = contextoMatricula(alteracao);
    await assert.rejects(editarMatricula(contexto));
    assert.equal(contexto.banco.documentos.get('usuarios/aluno').matricula, '00001');
  }
  const contexto = contextoMatricula();
  contexto.actor.token.email_verified = false;
  await assert.rejects(editarMatricula(contexto), (erro) => erro.code === 'permission-denied');
});

test('destino autorizado ou ocupado por cadastro legado é recusado sem alteração parcial', async () => {
  for (const destino of [
    { 'matriculasAutorizadas/satc_00002': { escola: 'Satc', matricula: '00002', alunoId: '' } },
    { 'usuarios/outro': { tipoConta: 'aluno', escola: 'Satc', matricula: '00002' } },
  ]) {
    const contexto = contextoMatricula(destino);
    await assert.rejects(editarMatricula(contexto), (erro) => erro.code === 'already-exists');
    assert.equal(contexto.banco.documentos.get('usuarios/aluno').matricula, '00001');
    assert.equal(contexto.banco.documentos.has('matriculasAutorizadas/satc_00001'), true);
  }
});

test('revisão antiga, formato inválido e vínculo divergente são recusados', async () => {
  for (const dados of [
    { revisaoEsperada: 1 },
    { novaMatricula: '1234' },
    { novaMatricula: '12a45' },
    { email: 'outro@exemplo.com' },
  ]) {
    const contexto = contextoMatricula();
    Object.assign(contexto.dados, dados);
    await assert.rejects(editarMatricula(contexto));
    assert.equal(contexto.banco.documentos.get('usuarios/aluno').matricula, '00001');
  }
  const contexto = contextoMatricula({
    'usuarios/aluno': {
      tipoConta: 'aluno',
      escola: 'Antônio Guglielmi Sobrinho',
      matricula: '00001',
    },
  });
  await assert.rejects(editarMatricula(contexto));
});

test('salvar sem mudar o número atualiza a revisão, sem excluir a autorização', async () => {
  const contexto = contextoMatricula();
  contexto.dados.novaMatricula = '00001';
  await editarMatricula(contexto);
  assert.equal(contexto.banco.documentos.get('matriculasAutorizadas/satc_00001').revisao, 3);
  assert.equal(contexto.banco.documentos.get('usuarios/aluno').matricula, '00001');
});

test('a entrada das funções carrega todos os módulos locais e expõe o cadastro de administradores', () => {
  const diretorio = path.resolve(__dirname, '../functions');
  const autenticacao = {};
  const banco = {};
  const dependencias = {
    'firebase-functions/v2/https': { onCall: (opcoes, executar) => executar, HttpsError: Error },
    'firebase-admin/app': { initializeApp() {} },
    'firebase-admin/auth': { getAuth: () => autenticacao },
    'firebase-admin/firestore': { getFirestore: () => banco, FieldValue: {}, Timestamp: {} },
  };
  const exportacoes = {};
  vm.runInNewContext(fs.readFileSync(path.join(diretorio, 'index.js'), 'utf8'), {
    exports: exportacoes,
    require: (nome) =>
      dependencias[nome] || require(nome.startsWith('.') ? path.resolve(diretorio, nome) : nome),
  });
  assert.equal(typeof exportacoes.convidarAdministrador, 'function');
  assert.equal(typeof exportacoes.editarMatricula, 'function');
  assert.equal(typeof exportacoes.executarExclusaoDados, 'function');
});

function servicoCardapio() {
  const banco = criarBanco({
    'usuarios/diretor': { tipoConta: 'admin', escola: 'Satc' },
    'pratos/satc_arroz': {
      nome: 'Arroz e feijão',
      descricao: 'Com salada',
      escola: 'Satc',
      revisao: 1,
      servidos: 90,
      sobraTotalG: 4000,
      refeicaoId: 'antiga',
    },
  });
  let sequencia = 0;
  const backend = {
    auth: { currentUser: { uid: 'diretor' } },
    database: {},
    doc: (_, nome, id) => banco.referencia(`${nome}/${id}`),
    getDoc: async (ref) => {
      const documento = await banco.ler(ref);
      return { ...documento, exists: () => documento.exists };
    },
    executarTransacao: banco.transacaoCliente,
    serverTimestamp: () => 123,
    timestampData: (data) => data,
    novoId: () => `refeicao-nova-${++sequencia}`,
  };
  const runtime = criarRuntime({
    modulos: {
      './backend': backend,
      './relogio': { agoraAplicativo: () => new Date('2026-11-05T08:00:00-03:00') },
    },
  });
  return { banco, servico: runtime.carregar('src/services/cardapio.js') };
}

test('reutilizar o mesmo catálogo em outro dia cria novo ID sem produção, sobras ou respostas antigas', async () => {
  const { banco, servico } = servicoCardapio();
  const pedido = {
    data: '2026-11-05',
    turno: 'manha',
    pratoId: 'satc_arroz',
    horarioLimite: '09:00',
    horarioFim: '12:30',
  };
  const primeira = await servico.salvarRefeicao(pedido);
  banco.documentos.set(`producao/${primeira.id}`, {
    refeicaoId: primeira.id,
    data: primeira.data,
    turno: 'manha',
    escola: 'Satc',
    servidos: 90,
    sobraTotalG: 4000,
  });
  const segunda = await servico.salvarRefeicao({ ...pedido, data: '2026-11-06' });
  assert.notEqual(segunda.id, primeira.id);
  assert.equal(segunda.nome, primeira.nome);
  for (const campo of ['servidos', 'sobraTotalG', 'refeicaoId', 'confirmacoes', 'feedbacks'])
    assert.equal(Object.hasOwn(segunda, campo), false);
  assert.equal(banco.documentos.has(`producao/${segunda.id}`), false);
  assert.equal(banco.documentos.get(`producao/${primeira.id}`).servidos, 90);
});

test('quantidades só são recuperadas para a mesma refeição, escola, data e turno', () => {
  const dominio = criarRuntime().carregar('src/domain/producao.js');
  const refeicao = { id: 'nova', escola: 'Satc', data: '2026-11-05', turno: 'manha' };
  const registro = {
    refeicaoId: 'nova',
    escola: 'Satc',
    data: '2026-11-05',
    turno: 'manha',
    schemaVersion: 2,
    servidos: 80,
    sobraTotalG: 2000,
  };
  for (const alteracao of [
    { refeicaoId: 'antiga' },
    { escola: 'Outra' },
    { data: '2026-11-04' },
    { turno: 'tarde' },
  ]) {
    assert.equal(dominio.registroDaRefeicao([{ ...registro, ...alteracao }], refeicao), null);
  }
  assert.equal(dominio.registroDaRefeicao([registro], refeicao), registro);
  assert.equal(dominio.formularioDoRegistro(null).servidos, '');
  assert.equal(dominio.formularioDoRegistro(null).sobraTotalKg, '');
});

test('restrições usam a declaração mais recente e distinguem alunos de tipos declarados', () => {
  const dominio = criarRuntime().carregar('src/domain/restricoes.js');
  const alunos = ['a', 'b', 'c'].map((uid) => ({
    uid,
    tipoConta: 'aluno',
    escola: 'Satc',
    turnos: ['manha'],
  }));
  const declaracao = {
    alunoId: 'a',
    escola: 'Satc',
    situacao: 'informadas',
    autorizou: true,
    versaoAviso: dominio.VERSAO_AVISO_RESTRICOES,
    atualizadoEm: { seconds: 20 },
    itens: ['alergia_leite', 'intolerancia_lactose', 'alergia_leite'],
  };
  const antiga = { ...declaracao, atualizadoEm: { seconds: 10 }, itens: ['alergia_ovo'] };
  const semRestricoes = { ...declaracao, alunoId: 'b', situacao: 'nenhuma', itens: [] };
  const estrangeira = { ...declaracao, escola: 'Outra', atualizadoEm: { seconds: 30 } };
  for (const registros of [
    [declaracao, antiga, estrangeira, semRestricoes],
    [antiga, semRestricoes, declaracao, estrangeira],
  ]) {
    const resumo = dominio.estatisticasRestricoes(alunos, registros);
    assert.equal(resumo.total, 3);
    assert.equal(resumo.comRestricoes, 1);
    assert.equal(resumo.totalRestricoes, 2);
    assert.equal(resumo.semRestricoes, 1);
    assert.equal(resumo.naoInformado, 1);
    assert.equal(resumo.grupos.find((grupo) => grupo.id === 'alergia_ovo').quantidade, 0);
    assert.equal(
      resumo.grupos.reduce((soma, grupo) => soma + grupo.quantidade, 0),
      2,
    );
  }
});

test('uma declaração recente sem autorização não reativa uma declaração antiga', () => {
  const dominio = criarRuntime().carregar('src/domain/restricoes.js');
  const aluno = { uid: 'a', tipoConta: 'aluno', escola: 'Satc', turnos: ['manha'] };
  const antiga = {
    alunoId: 'a',
    escola: 'Satc',
    situacao: 'informadas',
    itens: ['alergia_ovo'],
    autorizou: true,
    versaoAviso: dominio.VERSAO_AVISO_RESTRICOES,
    atualizadoEm: 10,
  };
  const resumo = dominio.estatisticasRestricoes(
    [aluno],
    [{ ...antiga, atualizadoEm: 20, autorizou: false }, antiga],
  );
  assert.equal(resumo.comRestricoes, 0);
  assert.equal(resumo.totalRestricoes, 0);
  assert.equal(resumo.naoInformado, 1);
});

function hooksEquipe(colecoes = {}) {
  const resposta = (dados) => ({ dados, carregando: false, erro: null, tentarNovamente() {} });
  return {
    usePerfil: () => ({ perfil: { tipoConta: 'admin', escola: 'Satc' }, carregando: false }),
    useColecaoEscola: (nome) => resposta(colecoes[nome] || []),
  };
}

test('direção consegue abrir e editar o número de uma matrícula já vinculada', async () => {
  const matricula = {
    id: 'satc_00001',
    matricula: '00001',
    alunoId: 'aluno',
    revisao: 2,
    ativa: true,
  };
  const pedidos = [];
  const runtime = criarRuntime({
    modulos: {
      '../../hooks/useDados': hooksEquipe({ matriculasAutorizadas: [matricula] }),
      '../../services/matriculas': { editarMatricula: async (dados) => pedidos.push(dados) },
    },
  });
  const tela = await runtime.render('src/routes/screens/TelaMatriculasAdmin.js', {
    navigation: { goBack() {} },
  });
  await agir(() => porId(tela, 'editar-matricula-satc_00001').props.onPress());
  assert.equal(porId(tela, 'matricula-autorizada').props.editable, true);
  await agir(() => porId(tela, 'matricula-autorizada').props.onChangeText('00002'));
  await agir(() => porId(tela, 'autorizar-matricula').props.onPress());
  assert.deepEqual(pedidos[0], {
    matriculaAtual: '00001',
    novaMatricula: '00002',
    revisaoEsperada: 2,
  });
  await agir(() => tela.unmount());
});

test('catálogo abre nova publicação com apenas a referência do prato', async () => {
  const navegacoes = [];
  const runtime = criarRuntime({
    modulos: {
      '../../hooks/useDados': hooksEquipe(),
      '../../hooks/usePaginaEscola': {
        usePaginaEscola: () => ({
          dados: [
            { id: 'satc_arroz', nome: 'Arroz e feijão', descricao: 'Com salada', servidos: 90 },
          ],
          pagina: 1,
        }),
      },
    },
  });
  const tela = await runtime.render('src/routes/screens/TelaCatalogoAdmin.js', {
    navigation: { navigate: (...argumentos) => navegacoes.push(argumentos), goBack() {} },
  });
  await agir(() => porId(tela, 'usar-catalogo-satc_arroz').props.onPress());
  assert.deepEqual(navegacoes[0], [
    'RefeicaoDiaAdmin',
    {
      pratoId: 'satc_arroz',
      refeicaoId: null,
      data: null,
      turno: 'manha',
    },
  ]);
  assert.match(texto(tela), /Adicionar refeição/);
  await agir(() => tela.unmount());
});

test('total de alunos e categorias de restrição usam os mesmos cadastros e filtro de turno', async () => {
  const dominio = criarRuntime().carregar('src/domain/restricoes.js');
  const runtime = criarRuntime({
    modulos: {
      '../../hooks/useDados': hooksEquipe({
        usuarios: [
          { uid: 'aluno', tipoConta: 'aluno', escola: 'Satc', turnos: ['manha', 'tarde'] },
        ],
        restricoesAlimentares: [
          {
            alunoId: 'aluno',
            escola: 'Satc',
            situacao: 'informadas',
            itens: ['alergia_leite', 'alergia_ovo'],
            autorizou: true,
            versaoAviso: dominio.VERSAO_AVISO_RESTRICOES,
          },
        ],
      }),
    },
  });
  const tela = await runtime.render('src/routes/screens/TelaRestricoesAdmin.js', {
    navigation: { goBack() {} },
  });
  const totalComRestricoes = () =>
    tela.root.findAll(
      (item) =>
        typeof item.type === 'function' &&
        item.type.name === 'Indicador' &&
        item.props.label === 'Com restrições declaradas',
    )[0].props.valor;
  assert.equal(totalComRestricoes(), 1);
  assert.match(texto(tela).replace(/\s+/g, ' '), /1 aluno\(s\).*2 restrição\(ões\)/);
  const filtroNoite = tela.root.findAll(
    (item) => item.type === 'TouchableOpacity' && item.props.accessibilityLabel === 'Noite',
  )[0];
  await agir(() => filtroNoite.props.onPress());
  assert.equal(totalComRestricoes(), 0);
  assert.match(texto(tela), /Nenhum aluno cadastrado/);
  await agir(() => tela.unmount());
});

test('trocar da edição para nova publicação limpa ID e revisão da refeição anterior', async () => {
  const refeicao = {
    id: 'antiga',
    pratoId: 'satc_arroz',
    data: '2026-11-05',
    turno: 'manha',
    nome: 'Arroz e feijão',
    descricao: '',
    horarioLimite: '09:00',
    horarioFim: '12:30',
    ativo: true,
    revisao: 5,
  };
  const pedidos = [];
  const runtime = criarRuntime({
    modulos: {
      '../../hooks/useDados': hooksEquipe({
        NomePratos: [refeicao],
        pratos: [{ id: 'satc_arroz', nome: 'Arroz e feijão', revisao: 1 }],
      }),
      '../../hooks/useAgora': { useAgora: () => new Date('2026-11-05T08:00:00-03:00') },
      '../../services/cardapio': {
        salvarRefeicao: async (dados) => {
          pedidos.push(dados);
          return { ...dados, id: 'nova', nome: 'Arroz e feijão' };
        },
      },
    },
  });
  const componente = runtime.carregar('src/routes/screens/TelaRefeicaoDiaAdmin.js').default;
  const navigation = { navigate() {}, goBack() {} };
  const tela = await runtime.render('src/routes/screens/TelaRefeicaoDiaAdmin.js', {
    navigation,
    route: { params: { refeicaoId: 'antiga', data: refeicao.data, turno: 'manha' } },
  });
  await agir(() =>
    tela.update(
      React.createElement(componente, {
        navigation,
        route: {
          params: { refeicaoId: null, data: '2026-11-06', pratoId: 'satc_arroz', turno: 'manha' },
        },
      }),
    ),
  );
  await agir(() => porId(tela, 'publicar-refeicao-dia').props.onPress());
  assert.equal(pedidos[0].id, undefined);
  assert.equal(pedidos[0].revisaoEsperada, 0);
  assert.equal(pedidos[0].pratoId, 'satc_arroz');
  await agir(() => tela.unmount());
});

test('convite renova o token da direção e mantém a conta atual conectada', async () => {
  const chamadas = [];
  const usuario = { uid: 'diretor', emailVerified: true };
  const autenticacao = { currentUser: usuario };
  const aplicativo = {};
  const runtime = criarRuntime({
    configuracao: { auth: autenticacao, app: aplicativo, database: {} },
    firebaseAuth: {
      getIdToken: async (conta, renovar) => {
        assert.equal(conta, usuario);
        assert.equal(renovar, true);
        chamadas.push('renovar-token');
        return 'token';
      },
    },
    modulos: {
      'firebase/functions': {
        getFunctions: (app, regiao) => {
          assert.equal(app, aplicativo);
          assert.equal(regiao, 'southamerica-east1');
          return {};
        },
        httpsCallable: (_, nome) => async (dados) => {
          chamadas.push(nome);
          return { data: { ...dados, uid: 'novo', escola: 'Satc' } };
        },
      },
    },
  });
  const resultado = await runtime
    .backend()
    .convidarAdministrador({ nome: 'Novo Diretor', email: 'novo@exemplo.com' });
  assert.deepEqual(chamadas, ['renovar-token', 'convidarAdministrador']);
  assert.equal(resultado.uid, 'novo');
  assert.equal(autenticacao.currentUser, usuario);
});

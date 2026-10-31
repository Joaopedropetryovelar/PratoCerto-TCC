const sistemaArquivos = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const semver = require('semver');
function arquivos(diretorio) {
  return sistemaArquivos
    .readdirSync(diretorio, {
      withFileTypes: true,
    })
    .flatMap((entradaDiretorio) =>
      entradaDiretorio.isDirectory()
        ? arquivos(path.join(diretorio, entradaDiretorio.name))
        : [path.join(diretorio, entradaDiretorio.name)],
    );
}
const fontes = [
  'App.js',
  'index.js',
  'firebaseClient.js',
  'firebaseClient.native.js',
  'firebaseOptions.js',
  'firebaseAmbiente.js',
  ...arquivos('functions').filter(
    (caminhoArquivo) => caminhoArquivo.endsWith('.js') && !caminhoArquivo.includes('node_modules'),
  ),
  ...arquivos('src').filter((caminhoArquivo) => caminhoArquivo.endsWith('.js')),
];
const asts = fontes.map((caminhoArquivo) => [
  caminhoArquivo,
  parser.parse(sistemaArquivos.readFileSync(caminhoArquivo, 'utf8'), {
    sourceType: 'module',
    plugins: ['jsx'],
  }),
]);
console.log('01. Sintaxe: ' + fontes.length + ' arquivos JavaScript válidos.');
for (const [arquivo, arvoreSintatica] of asts)
  traverse(arvoreSintatica, {
    ImportDeclaration({ node }) {
      const nome = node.source.value;
      if (!nome.startsWith('.')) return;
      const completo = path.resolve(path.dirname(arquivo), nome);
      if (
        ![completo, completo + '.js', path.join(completo, 'index.js')].some((caminhoCandidato) =>
          sistemaArquivos.existsSync(caminhoCandidato),
        )
      )
        throw Error(`Import inexistente em ${arquivo}: ${nome}`);
    },
  });
console.log('02. Todos os imports relativos apontam para arquivos existentes.');
const configuracaoPacote = JSON.parse(sistemaArquivos.readFileSync('package.json'));
const lock = JSON.parse(sistemaArquivos.readFileSync('package-lock.json')).packages[''];
for (const grupo of ['dependencies', 'devDependencies'])
  if (JSON.stringify(configuracaoPacote[grupo]) !== JSON.stringify(lock[grupo]))
    throw Error('Lock incompatível: ' + grupo);
console.log('03. package.json e package-lock.json concordam.');
for (const [nome, versao] of Object.entries({
  ...configuracaoPacote.dependencies,
  ...configuracaoPacote.devDependencies,
})) {
  const instalado = JSON.parse(
    sistemaArquivos.readFileSync(path.join('node_modules', nome, 'package.json'), 'utf8'),
  ).version;
  if (!semver.satisfies(instalado, versao)) throw Error('Versão instalada incompatível: ' + nome);
}
const compatibilidade = JSON.parse(
  sistemaArquivos.readFileSync('node_modules/expo/bundledNativeModules.json', 'utf8'),
);
for (const nome of Object.keys(configuracaoPacote.dependencies)) {
  const esperada = compatibilidade[nome];
  if (!esperada) continue;
  const instalada = JSON.parse(
    sistemaArquivos.readFileSync(path.join('node_modules', nome, 'package.json'), 'utf8'),
  ).version;
  if (!semver.satisfies(instalada, esperada))
    throw Error(`Incompatível com este SDK Expo: ${nome} ${instalada}, esperado ${esperada}`);
}
console.log('04. Dependências diretas e módulos nativos compatíveis com o SDK Expo instalado.');
const rotas = new Set();
for (const [, arvoreSintatica] of asts)
  traverse(arvoreSintatica, {
    JSXOpeningElement({ node }) {
      const nome = node.name;
      if (nome.type !== 'JSXMemberExpression' || nome.property.name !== 'Screen') return;
      const atributo = node.attributes.find(
        (atributoDaLista) => atributoDaLista.name?.name === 'name',
      );
      if (atributo?.value?.type === 'StringLiteral') rotas.add(atributo.value.value);
    },
  });
for (const [arquivo, arvoreSintatica] of asts)
  traverse(arvoreSintatica, {
    CallExpression({ node }) {
      if (
        node.callee.type === 'MemberExpression' &&
        node.callee.property.name === 'navigate' &&
        node.arguments[0]?.type === 'StringLiteral' &&
        !rotas.has(node.arguments[0].value)
      )
        throw Error(`Rota inexistente em ${arquivo}: ${node.arguments[0].value}`);
    },
  });
console.log('05. Destinos literais de navegação correspondem a rotas registradas.');
for (const nome of [
  'Producao',
  'Relatorios',
  'DashboardAdmin',
  'CardapioAdmin',
  'FeedbackAdmin',
  'Cardapio',
  'Confirmacao',
  'Feedback',
  'PerfilAluno',
  'RestricoesAdmin',
])
  if (!rotas.has(nome)) throw Error('Rota principal ausente: ' + nome);
console.log('06. Novas áreas e fluxos de aluno estão registrados.');
for (const [arquivo, arvoreSintatica] of asts)
  traverse(arvoreSintatica, {
    ImportDeclaration({ node }) {
      const nome = node.source.value;
      if (
        arquivo.startsWith('src') &&
        nome === 'firebase/firestore' &&
        arquivo !== path.join('src', 'services', 'backend.js')
      )
        throw Error('Acesso ao Firestore fora da camada de dados: ' + arquivo);
    },
  });
console.log('07. Acesso ao Firestore nas telas passa pela camada de dados.');
const configuracaoExpo = JSON.parse(sistemaArquivos.readFileSync('app.json')).expo;
for (const item of [
  configuracaoExpo.icon,
  configuracaoExpo.web.favicon,
  ...Object.values(configuracaoExpo.android.adaptiveIcon).filter((caminhoImagem) =>
    caminhoImagem.startsWith('./'),
  ),
])
  if (!sistemaArquivos.existsSync(item)) throw Error('Asset ausente: ' + item);
console.log('08. Ícones e assets configurados existem.');
if (!configuracaoPacote.dependencies['@react-native-async-storage/async-storage'])
  throw Error('Persistência não declarada');
for (const item of [
  'react-test-renderer',
  '@babel/core',
  '@babel/plugin-transform-react-jsx',
  '@babel/plugin-transform-modules-commonjs',
])
  if (!configuracaoPacote.devDependencies[item])
    throw Error('Dependência de teste não declarada: ' + item);
console.log('09. Persistência e ferramentas de teste estão declaradas explicitamente.');
for (const arquivo of [
  'README.md',
  'FIREBASE_SETUP.md',
  'firebase.json',
  'firestore.rules',
  'firestore.indexes.json',
  'functions/package-lock.json',
])
  if (!sistemaArquivos.existsSync(arquivo)) throw Error('Documentação ausente: ' + arquivo);
console.log('10. Guias e evidências de revisão acompanham o projeto.');

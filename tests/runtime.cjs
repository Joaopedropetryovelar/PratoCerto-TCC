const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const babel = require('@babel/core');
// O renderizador e os componentes devem compartilhar a mesma instância de React.
const React = require('node:module').createRequire(require.resolve('react-test-renderer'))('react');
const renderer = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;

function criarRuntime(opcoes = {}) {
  const cache = new Map();
  const alertas = [], compartilhamentos = [];
  const armazenamento = new Map();
  const native = {
    Platform: { OS: opcoes.plataforma || 'android' }, useWindowDimensions: () => ({ width: opcoes.largura || 1024, height: 800 }), StyleSheet: { create: (valor) => valor },
    Alert: { alert: (...args) => alertas.push(args) },
    Share: { share: async (valor) => { compartilhamentos.push(valor); return { action: 'sharedAction' }; } },
    BackHandler: { addEventListener: () => ({ remove() {} }) },
    StatusBar: 'StatusBar', SafeAreaView: 'SafeAreaView', ScrollView: 'ScrollView', View: 'View', Text: 'Text', TouchableOpacity: 'TouchableOpacity', ActivityIndicator: 'ActivityIndicator', TextInput: 'TextInput', Modal: 'Modal', KeyboardAvoidingView: 'KeyboardAvoidingView', Switch: 'Switch',
  };
  function carregar(arquivo) {
    const completo = path.resolve(__dirname, '..', arquivo);
    if (cache.has(completo)) return cache.get(completo).exports;
    const modulo = new Module(completo, module);
    cache.set(completo, modulo);
    modulo.filename = completo;
    modulo.paths = module.paths;
    modulo.require = (nome) => {
      if (nome === 'react') return React;
      if (nome === 'react-native-svg') return {__esModule: true, default: 'Svg', Path: 'Path', Circle: 'Circle'};
      if (nome === 'react-native') return native;
      if (opcoes.modulos && Object.hasOwn(opcoes.modulos, nome)) return opcoes.modulos[nome];
      if (nome === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView', SafeAreaProvider: 'SafeAreaProvider' };
      if (nome === '@react-navigation/native') return { useIsFocused: () => true };
      if (nome === '@react-native-async-storage/async-storage') return { getItem: async (chave) => armazenamento.get(chave) ?? null, setItem: async (chave, valor) => { armazenamento.set(chave, valor); }, removeItem: async (chave) => { armazenamento.delete(chave); } };
      if (nome === 'firebase/firestore') return opcoes.firestore || {};
      if (nome === 'firebase/auth') return opcoes.firebaseAuth || {};
      if (nome.includes('firebaseClient') && opcoes.configuracao) return opcoes.configuracao;
      if (nome.startsWith('.')) {
        let proximo = path.resolve(path.dirname(completo), nome);
        if (!path.extname(proximo)) proximo += opcoes.resolverNativo && fs.existsSync(proximo + '.native.js') ? '.native.js' : '.js';
        return carregar(path.relative(path.resolve(__dirname, '..'), proximo));
      }
      return require(nome);
    };
    const codigo = babel.transformSync(fs.readFileSync(completo, 'utf8'), { filename: completo, babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'] }).code;
    modulo._compile(codigo, completo);
    return modulo.exports;
  }
  return {
    carregar, native, alertas, compartilhamentos,
    demo: () => {
      const demo = carregar('src/services/demo.js');
      if (!demo._clockTest) {
        const original = demo.entrarDemonstracao; let inicializado = false;
        demo.entrarDemonstracao = async (tipo, turno, escola, referencia = new Date('2026-10-12T08:00:00-03:00')) => {
          if (!inicializado) { await demo.demoStore.restaurar(referencia); inicializado = true; }
          return original(tipo, turno, escola, referencia);
        }; demo._clockTest = true;
      }
      return demo;
    },
    backend: () => carregar('src/services/backend.js'),
    async render(arquivo, props = {}) {
      const componente = carregar(arquivo).default;
      let tela;
      await renderer.act(async () => { tela = renderer.create(React.createElement(componente, props)); await new Promise((r) => setImmediate(r)); });
      return tela;
    },
  };
}
async function agir(fn) { await renderer.act(async () => { await fn(); await new Promise((r) => setImmediate(r)); }); }
function host(tela, teste) { return tela.root.findAll((item) => typeof item.type === 'string' && teste(item))[0]; }
function porId(tela, id) { const resultado = host(tela, (item) => item.props.testID === id); if (!resultado) throw new Error(`Controle ausente: ${id}`); return resultado; }
function texto(tela) {
  function unir(valor) { if (valor == null) return ''; if (typeof valor === 'string' || typeof valor === 'number') return String(valor); if (Array.isArray(valor)) return valor.map(unir).join(' '); return unir(valor.children); }
  return unir(tela.toJSON());
}
module.exports = { criarRuntime, agir, host, porId, texto };
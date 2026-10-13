const copiar = (valor) => JSON.parse(JSON.stringify(valor));

// A mesma coleção alimenta as telas de aluno e equipe nesta instalação.
export function criarDemoStore(armazenamento, gerarDados) {
  const chave = 'pratocerto:demonstracao:v4.4';
  let dados;
  let carregamento;
  let fila = Promise.resolve();
  const ouvintes = new Set();

  async function carregar() {
    if (!carregamento) {
      carregamento = (async () => {
        const texto = await armazenamento.getItem(chave);
        dados = texto ? JSON.parse(texto) : gerarDados();
        if (!dados || typeof dados !== 'object' || !dados.usuarios || !dados.NomePratos) {
          throw new Error('Dados da demonstração inválidos. Restaure os exemplos na tela de demonstração.');
        }
        return dados;
      })();
      carregamento.catch(() => { carregamento = null; });
    }
    return carregamento;
  }

  function snapshot(ref) {
    const documento = (id, valor) => ({ id, exists: () => valor !== undefined, data: () => valor === undefined ? undefined : copiar(valor) });
    if (ref.tipo === 'doc') return documento(ref.id, dados[ref.colecao]?.[ref.id]);
    let lista = Object.entries(dados[ref.colecao] || {}).filter(([, valor]) => (ref.filtros || []).every((f) => {
      if (f.tipo === 'limit') return true;
      const campo = valor[f.campo];
      if (f.operador === '==') return campo === f.valor;
      if (f.operador === '>=') return campo >= f.valor;
      if (f.operador === '<=') return campo <= f.valor;
      throw new Error(`Filtro local não suportado: ${f.operador}`);
    }));
    const limite = ref.filtros?.find((f) => f.tipo === 'limit');
    if (limite) lista = lista.slice(0, limite.valor);
    const docs = lista.map(([id, valor]) => documento(id, valor));
    return { docs, empty: docs.length === 0, size: docs.length, forEach: (callback) => docs.forEach(callback) };
  }

  function notificar() {
    ouvintes.forEach((ouvinte) => {
      try { ouvinte.sucesso(snapshot(ouvinte.ref)); } catch (erro) { ouvinte.erro?.(erro); }
    });
  }

  function enfileirar(operacao) {
    const resultado = fila.then(operacao);
    fila = resultado.catch(() => {});
    return resultado;
  }

  return {
    carregar,
    async ler(ref) { await carregar(); await fila; return snapshot(ref); },
    escutar(ref, sucesso, erro) {
      const ouvinte = { ref, sucesso, erro };
      ouvintes.add(ouvinte);
      carregar().then(() => {
        if (ouvintes.has(ouvinte)) sucesso(snapshot(ref));
      }).catch((falha) => { if (ouvintes.has(ouvinte)) erro?.(falha); });
      return () => ouvintes.delete(ouvinte);
    },
    escrever(ref, valor, mesclar = false, atualizar = false) {
      return enfileirar(async () => {
        await carregar();
        if (atualizar && !dados[ref.colecao]?.[ref.id]) throw new Error('Registro não encontrado.');
        const proximo = copiar(dados);
        proximo[ref.colecao] = proximo[ref.colecao] || {};
        proximo[ref.colecao][ref.id] = mesclar ? { ...proximo[ref.colecao][ref.id], ...copiar(valor) } : copiar(valor);
        await armazenamento.setItem(chave, JSON.stringify(proximo));
        dados = proximo;
        notificar();
      });
    },
    alterar(ref, transformar) {
      return enfileirar(async () => {
        await carregar();
        const valor = transformar(snapshot(ref));
        if (!valor || typeof valor !== 'object' || typeof valor.then === 'function') throw new Error('Atualização local inválida.');
        const proximo = copiar(dados);
        proximo[ref.colecao] = proximo[ref.colecao] || {};
        proximo[ref.colecao][ref.id] = copiar(valor);
        await armazenamento.setItem(chave, JSON.stringify(proximo));
        dados = proximo;
        notificar();
        return copiar(valor);
      });
    },
    transacionar(operacao) {
      return enfileirar(async () => {
        await carregar();
        const proximo = copiar(dados);
        let gravou = false;
        const retorno = await operacao({
          get: async (ref) => snapshot(ref),
          set: (ref, valor) => { proximo[ref.colecao] ||= {}; proximo[ref.colecao][ref.id] = copiar(valor); gravou = true; },
        });
        if (gravou) { await armazenamento.setItem(chave, JSON.stringify(proximo)); dados = proximo; notificar(); }
        return retorno;
      });
    },
    excluir(ref) {
      return enfileirar(async () => {
        await carregar();
        const proximo = copiar(dados);
        delete (proximo[ref.colecao] || {})[ref.id];
        await armazenamento.setItem(chave, JSON.stringify(proximo));
        dados = proximo;
        notificar();
      });
    },
    restaurar(referencia) {
      return enfileirar(async () => {
        const proximo = gerarDados(referencia);
        await armazenamento.setItem(chave, JSON.stringify(proximo));
        dados = proximo;
        carregamento = Promise.resolve(dados);
        notificar();
      });
    },
  };
}

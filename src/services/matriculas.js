import {
  auth,
  database,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  limit,
  executarTransacao,
  serverTimestamp,
} from './backend';
import { emailNormalizado, emailValido } from '../domain/contas';
import { analisarListaMatriculas, chaveMatricula, revisaoMatricula } from '../domain/matriculas';
async function equipe() {
  const usuario = auth.currentUser;
  if (!usuario?.emailVerified)
    throw new Error('Entre com uma conta de equipe e confirme seu e-mail.');
  const documentoConsultado = await getDoc(doc(database, 'usuarios', usuario.uid));
  if (!documentoConsultado.exists() || documentoConsultado.data().tipoConta !== 'admin')
    throw new Error('Somente a equipe pode autorizar matrículas.');
  return {
    ...documentoConsultado.data(),
    uid: usuario.uid,
  };
}
async function autorizar(perfil, matricula, revisaoEsperada, lote = false, email = '') {
  const identificadorMatricula = chaveMatricula(perfil.escola, matricula);
  const antigos = await getDocs(
    query(
      collection(database, 'usuarios'),
      where('escola', '==', perfil.escola),
      where('matricula', '==', matricula),
      limit(2),
    ),
  );
  if (antigos.docs.length > 1)
    throw new Error(
      'Esta matrícula já possui cadastros duplicados. A equipe responsável pelo Firebase precisa regularizá-los.',
    );
  const antigo = antigos.docs[0];
  if (antigo && antigo.data().tipoConta !== 'aluno')
    throw new Error('Esta matrícula pertence a um perfil que precisa ser conferido pela equipe.');
  const referenciaDocumento = doc(database, 'matriculasAutorizadas', identificadorMatricula);
  return executarTransacao(async (transacao) => {
    const atual = await transacao.get(referenciaDocumento);
    const legado = antigo ? await transacao.get(doc(database, 'usuarios', antigo.id)) : null;
    const anterior = atual.exists() ? atual.data() : null;
    if (anterior && anterior.escola !== perfil.escola)
      throw new Error('Esta autorização pertence a outra escola.');
    if (anterior?.alunoId) {
      if (lote)
        return {
          id: identificadorMatricula,
          matricula,
          status: 'vinculada',
        };
      throw new Error(
        'Esta matrícula já está vinculada a uma conta e não pode ser transferida por esta tela.',
      );
    }
    if (lote && anterior?.ativa === false)
      return {
        id: identificadorMatricula,
        matricula,
        status: 'inativa',
      };
    if (!lote && revisaoMatricula(anterior) !== revisaoEsperada)
      throw new Error('A matrícula foi atualizada. Recarregue a lista antes de continuar.');
    if (
      antigo &&
      (!legado.exists() ||
        legado.data().tipoConta !== 'aluno' ||
        legado.data().escola !== perfil.escola ||
        legado.data().matricula !== matricula)
    )
      throw new Error('O cadastro existente mudou. Recarregue a lista.');
    if (lote && anterior?.ativa && !antigo)
      return {
        id: identificadorMatricula,
        matricula,
        status: 'existente',
      };
    const dados = {
      escola: perfil.escola,
      matricula,
      email: lote ? anterior?.email || '' : email,
      ativa: true,
      alunoId: antigo?.id || '',
      vinculadoEm: antigo ? serverTimestamp() : null,
      revisao: revisaoMatricula(anterior) + 1,
      criadoEm: anterior ? anterior.criadoEm : serverTimestamp(),
      atualizadoEm: serverTimestamp(),
      atualizadoPorUid: perfil.uid,
    };
    transacao.set(referenciaDocumento, dados);
    return {
      ...dados,
      id: identificadorMatricula,
      status: antigo ? 'vinculada' : anterior ? 'atualizada' : 'autorizada',
    };
  });
}
export async function autorizarMatricula({ matricula, revisaoEsperada = 0, email = '' }) {
  if (!Number.isSafeInteger(revisaoEsperada) || revisaoEsperada < 0)
    throw new Error('Recarregue a lista de matrículas.');
  const vinculo = emailNormalizado(email);
  if (vinculo && !emailValido(vinculo))
    throw new Error('Informe um e-mail válido ou deixe o vínculo vazio.');
  return autorizar(await equipe(), String(matricula).trim(), revisaoEsperada, false, vinculo);
}
export async function autorizarMatriculasEmLote(texto, aoProgredir = () => {}) {
  const lista = analisarListaMatriculas(texto);
  if (!lista.matriculas.length || lista.invalidas.length)
    throw new Error('Corrija a lista: cada matrícula deve ter exatamente cinco números.');
  const perfil = await equipe(),
    resultados = new Array(lista.matriculas.length);
  let proximo = 0,
    concluidas = 0;
  async function executar() {
    while (proximo < lista.matriculas.length) {
      const indice = proximo;
      proximo += 1;
      const matricula = lista.matriculas[indice];
      try {
        resultados[indice] = await autorizar(perfil, matricula, null, true);
      } catch (erroCapturado) {
        resultados[indice] = {
          matricula,
          status: 'erro',
          mensagem: erroCapturado.message || 'Não foi possível autorizar. Tente novamente.',
        };
      }
      concluidas += 1;
      aoProgredir({
        concluidas,
        total: lista.matriculas.length,
      });
    }
  }
  await Promise.all(
    Array.from(
      {
        length: Math.min(3, lista.matriculas.length),
      },
      executar,
    ),
  );
  return resultados;
}
export async function desativarAutorizacao(matricula, revisaoEsperada) {
  const perfil = await equipe(),
    referenciaDocumento = doc(
      database,
      'matriculasAutorizadas',
      chaveMatricula(perfil.escola, matricula),
    );
  return executarTransacao(async (transacao) => {
    const documentoConsultado = await transacao.get(referenciaDocumento);
    if (
      !documentoConsultado.exists() ||
      documentoConsultado.data().escola !== perfil.escola ||
      documentoConsultado.data().revisao !== revisaoEsperada
    )
      throw new Error('A autorização mudou. Recarregue a lista.');
    if (documentoConsultado.data().alunoId)
      throw new Error(
        'A matrícula já está vinculada. Esta ação se destina apenas a autorizações de cadastro pendentes.',
      );
    transacao.set(referenciaDocumento, {
      ...documentoConsultado.data(),
      ativa: false,
      revisao: revisaoEsperada + 1,
      atualizadoEm: serverTimestamp(),
      atualizadoPorUid: perfil.uid,
    });
  });
}
export async function vincularMatricula(perfil, restricoes) {
  const referenciaDocumento = doc(
    database,
    'matriculasAutorizadas',
    chaveMatricula(perfil.escola, perfil.matricula),
  );
  return executarTransacao(async (transacao) => {
    let documentoConsultado;
    try {
      documentoConsultado = await transacao.get(referenciaDocumento);
    } catch (erroCapturado) {
      if (erroCapturado.code === 'permission-denied')
        throw new Error(
          'A matrícula precisa estar autorizada pela escola. Se a autorização for antiga, peça à equipe para liberá-la sem e-mail.',
        );
      throw erroCapturado;
    }
    const dados = documentoConsultado.exists() ? documentoConsultado.data() : null;
    if (
      !dados ||
      dados.escola !== perfil.escola ||
      dados.matricula !== perfil.matricula ||
      dados.ativa !== true ||
      (dados.email && dados.email !== perfil.email)
    )
      throw new Error(
        'A matrícula precisa estar autorizada pela escola. Confira os dados com a equipe.',
      );
    if (dados.alunoId)
      throw new Error(
        'Esta matrícula já está vinculada a uma conta. Entre na conta existente ou procure a equipe.',
      );
    transacao.set(doc(database, 'usuarios', perfil.uid), perfil);
    if (restricoes) transacao.set(doc(database, 'restricoesAlimentares', perfil.uid), restricoes);
    transacao.set(referenciaDocumento, {
      ...dados,
      alunoId: perfil.uid,
      vinculadoEm: serverTimestamp(),
      revisao: dados.revisao + 1,
      atualizadoEm: serverTimestamp(),
      atualizadoPorUid: perfil.uid,
    });
  });
}

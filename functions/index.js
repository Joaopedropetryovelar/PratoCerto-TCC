const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { randomBytes } = require('node:crypto');
const { autorizarAdministrador } = require('./convites');
const { criarGestao } = require('./gestao');
const { editarMatricula } = require('./matriculas');

initializeApp();

const bancoDados = getFirestore();
const autenticacao = getAuth();
const gestao = criarGestao({ db: bancoDados, auth: autenticacao, FieldValue, Timestamp });
const codigosConhecidos = new Set([
  'permission-denied',
  'unauthenticated',
  'invalid-argument',
  'already-exists',
  'not-found',
  'failed-precondition',
  'resource-exhausted',
  'aborted',
]);

function publicarOperacao(operacao) {
  return onCall(
    { region: 'southamerica-east1', maxInstances: 3, timeoutSeconds: 180 },
    async (pedido) => {
      try {
        return await operacao(pedido.auth, pedido.data);
      } catch (erro) {
        if (codigosConhecidos.has(erro.code)) throw new HttpsError(erro.code, erro.message);
        throw new HttpsError(
          'internal',
          erro.code === 'internal'
            ? erro.message
            : 'Não foi possível concluir. Recarregue e tente novamente.',
        );
      }
    },
  );
}

exports.convidarAdministrador = publicarOperacao((actor, dados) =>
  autorizarAdministrador({
    actor,
    dados,
    db: bancoDados,
    auth: autenticacao,
    senhaAleatoria: () => `${randomBytes(32).toString('base64url')}A1!`,
    agora: () => FieldValue.serverTimestamp(),
  }),
);
exports.editarMatricula = publicarOperacao((actor, dados) =>
  editarMatricula({ actor, dados, db: bancoDados, FieldValue }),
);
exports.alterarAcessoEquipe = publicarOperacao(gestao.alterarAcesso);
exports.obterMeusDados = publicarOperacao(gestao.obterMeusDados);
exports.executarExclusaoDados = publicarOperacao(gestao.executarExclusao);

const { onCall, HttpsError }=require('firebase-functions/v2/https');
const { initializeApp }=require('firebase-admin/app');
const { getAuth }=require('firebase-admin/auth');
const { getFirestore, FieldValue, Timestamp }=require('firebase-admin/firestore');
const { randomBytes }=require('node:crypto');
const { autorizarAdministrador }=require('./convites');
initializeApp();
exports.convidarAdministrador=onCall({region:'southamerica-east1',maxInstances:3},async(request)=>{
  try{return await autorizarAdministrador({actor:request.auth,dados:request.data,db:getFirestore(),auth:getAuth(),senhaAleatoria:()=>randomBytes(32).toString('base64url')+'A1!',agora:()=>FieldValue.serverTimestamp()});}
  catch(erro){if(['permission-denied','invalid-argument','already-exists'].includes(erro.code))throw new HttpsError(erro.code,erro.message);throw new HttpsError('internal',erro.code==='internal'?erro.message:'Não foi possível autorizar a conta. Tente novamente.');}
});

const { criarGestao } = require('gestao');
const gestao = criarGestao({ db: getFirestore(), auth: getAuth(), FieldValue, Timestamp });
for (const [nome, executar] of Object.entries({ alterarAcessoEquipe: gestao.alterarAcesso, obterMeusDados: gestao.obterMeusDados, executarExclusaoDados: gestao.executarExclusao })) {
  exports[nome] = onCall({ region: 'southamerica-east1', maxInstances: 3, timeoutSeconds: 180 }, async request => {
    try { return await executar(request.auth, request.data); }
    catch (erro) {
      if (['permission-denied','invalid-argument','failed-precondition','resource-exhausted','aborted'].includes(erro.code)) throw new HttpsError(erro.code, erro.message);
      throw new HttpsError('internal', 'Não foi possível concluir. Recarregue e tente novamente.');
    }
  });
}
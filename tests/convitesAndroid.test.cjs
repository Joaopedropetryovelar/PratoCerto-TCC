const {test}=require('node:test');
const assert=require('node:assert/strict');
const {autorizarAdministrador}=require('../functions/convites');

function contexto(alvo,patch={}) {
  let consultas=0,criacoes=0;
  const diretor={tipoConta:'admin',escola:'Satc',...patch.diretor};
  return {
    actor:{uid:'diretor',token:{email_verified:true}},dados:{nome:'Novo Diretor',email:'novo@teste.com',escola:'Outra'},
    db:{collection:()=>({doc:uid=>({get:async()=>{consultas++;return {exists:true,data:()=>uid==='diretor'?diretor:alvo};}})})},
    auth:{createUser:async()=>{criacoes++;throw Object.assign(Error('Existente'),{code:'auth/email-already-exists'});},getUserByEmail:async()=>({uid:'existente',disabled:patch.desativado===true})},
    senhaAleatoria:()=> 'Aleatoria123!',agora:()=>123,contador:()=>({consultas,criacoes}),
  };
}
test('repetir convite de administrador da mesma escola recupera a conta',async()=>{
  const c=contexto({tipoConta:'admin',escola:'Satc',nome:'Diretor existente'});const r=await autorizarAdministrador(c);
  assert.equal(r.uid,'existente');assert.equal(r.jaExistia,true);assert.equal(r.escola,'Satc');assert.equal(r.nome,'Diretor existente');assert.equal('password' in r,false);
});
test('e-mail existente de aluno nunca é promovido',async()=>{
  const c=contexto({tipoConta:'aluno',escola:'Satc'});await assert.rejects(autorizarAdministrador(c),e=>e.code==='already-exists');
});
test('administrador de outra escola não é reassociado',async()=>{
  const c=contexto({tipoConta:'admin',escola:'Antônio Guglielmi Sobrinho'});await assert.rejects(autorizarAdministrador(c),e=>e.code==='already-exists');
});
test('convite não reativa administrador desativado',async()=>{
  for(const patch of [{desativado:true},{}]){
    const c=contexto({tipoConta:'admin',escola:'Satc',acessoAtivo:patch.desativado?true:false},patch);
    await assert.rejects(autorizarAdministrador(c),e=>e.code==='already-exists');
  }
});
test('diretor desativado não cria ou recupera convites',async()=>{
  const c=contexto({tipoConta:'admin',escola:'Satc'},{diretor:{acessoAtivo:false}});
  await assert.rejects(autorizarAdministrador(c),e=>e.code==='permission-denied');assert.equal(c.contador().criacoes,0);
});
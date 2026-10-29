const ESCOLAS=['Satc','Antônio Guglielmi Sobrinho'];
class FalhaConvite extends Error { constructor(code,message){super(message);this.code=code;} }
async function autorizarAdministrador({actor,dados,db,auth,senhaAleatoria,agora}) {
  if(!actor?.uid || actor.token?.email_verified!==true)throw new FalhaConvite('permission-denied','Entre com uma conta de equipe e confirme seu e-mail.');
  const nome=String(dados?.nome||'').trim(), email=String(dados?.email||'').trim().toLowerCase();
  if(nome.length<3||nome.length>100||email.length>254||! /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email))throw new FalhaConvite('invalid-argument','Confira o nome e o e-mail.');
  const perfil=await db.collection('usuarios').doc(actor.uid).get();
  if(!perfil.exists||perfil.data().tipoConta!=='admin'||!ESCOLAS.includes(perfil.data().escola)||perfil.data().acessoAtivo===false)throw new FalhaConvite('permission-denied','Somente a equipe autorizada pode criar administradores.');
  let novo;
  try{
    // The school comes from the authorized actor, never the submitted payload.
    novo=await auth.createUser({email,displayName:nome,password:senhaAleatoria(),emailVerified:false});
    await db.collection('usuarios').doc(novo.uid).create({uid:novo.uid,nome,email,escola:perfil.data().escola,tipoConta:'admin',criadoPorUid:actor.uid,dataCadastro:agora()});
    return {uid:novo.uid,nome,email,escola:perfil.data().escola,jaExistia:false};
  }catch(erro){
    if(novo){try{await auth.deleteUser(novo.uid);}catch{throw new FalhaConvite('internal','A conta ficou incompleta. A equipe responsável pelo Firebase precisa regularizá-la antes de tentar novamente.');}}
    if(erro.code==='auth/email-already-exists') {
      // Repetir um convite nunca promove uma conta existente de aluno ou de outra escola.
      if(typeof auth.getUserByEmail==='function') {
        const existente=await auth.getUserByEmail(email);
        const atual=await db.collection('usuarios').doc(existente.uid).get();
        if(atual.exists && atual.data().tipoConta==='admin' && atual.data().escola===perfil.data().escola && atual.data().acessoAtivo!==false && existente.disabled!==true) {
          return {uid:existente.uid,nome:atual.data().nome||nome,email,escola:perfil.data().escola,jaExistia:true};
        }
      }
      throw new FalhaConvite('already-exists','Este e-mail já possui uma conta. Nenhuma permissão foi alterada.');
    }
    throw erro;
  }
}
module.exports={autorizarAdministrador,FalhaConvite};
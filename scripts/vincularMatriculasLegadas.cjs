const escolas={'Satc':'satc','Antônio Guglielmi Sobrinho':'ags'};
function planejarVinculos(perfis,autorizacoes={}){
  const grupos=new Map(),pendencias=[],plano=[];
  for(const p of perfis){
    if(p.tipoConta!=='aluno')continue;
    if(!escolas[p.escola]||p.uid!==p.id||typeof p.matricula!=='string'||!/^\d{5}$/.test(p.matricula)||typeof p.email!=='string'||p.email!==p.email.trim().toLowerCase()||!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(p.email)){pendencias.push({id:p.id,motivo:'Perfil exige revisão de escola, uid, matrícula ou e-mail.'});continue;}
    const chave=`${escolas[p.escola]}_${p.matricula}`;const lista=grupos.get(chave)||[];lista.push(p);grupos.set(chave,lista);
  }
  for(const [chave,lista] of grupos){
    if(lista.length!==1){pendencias.push({chave,motivo:'Matrícula duplicada na escola.',ids:lista.map(p=>p.id)});continue;}
    const p=lista[0],atual=autorizacoes[chave];
    if(atual?.alunoId===p.id&&atual.escola===p.escola&&atual.matricula===p.matricula)continue;
    if(atual&&(atual.alunoId||atual.escola!==p.escola||atual.matricula!==p.matricula||(atual.email&&atual.email!==p.email))){pendencias.push({chave,motivo:'Autorização existente diverge do perfil.'});continue;}
    plano.push({chave,uid:p.id,escola:p.escola,matricula:p.matricula,email:p.email});
  }
  return {plano,pendencias};
}
async function executar(){
  const args=process.argv.slice(2),i=args.indexOf('--project'),projectId=args[i+1];
  if(i<0||!projectId||projectId.startsWith('--'))throw Error('Uso: node scripts/vincularMatriculasLegadas.cjs --project ID [--aplicar]');
  const {createRequire}=require('node:module'),path=require('node:path'),dasFuncoes=createRequire(path.resolve(__dirname,'../functions/package.json'));
  const {initializeApp,applicationDefault,deleteApp}=dasFuncoes('firebase-admin/app'),{getFirestore,FieldValue}=dasFuncoes('firebase-admin/firestore');
  const app=initializeApp({credential:applicationDefault(),projectId});
  try{
    const db=getFirestore(app),[usuarios,registros]=await Promise.all([db.collection('usuarios').get(),db.collection('matriculasAutorizadas').get()]);
    const {plano,pendencias}=planejarVinculos(usuarios.docs.map(d=>({...d.data(),id:d.id})),Object.fromEntries(registros.docs.map(d=>[d.id,d.data()])));
    console.log(JSON.stringify({projectId,vinculosPrevistos:plano.length,pendencias,modo:args.includes('--aplicar')?'aplicar':'somente conferência'},null,2));
    if(pendencias.length){process.exitCode=1;console.log('Nenhum vínculo foi aplicado. Revise as pendências antes de executar novamente.');return;}
    if(!args.includes('--aplicar')){console.log('Nenhum documento alterado. Revise os perfis e faça backup antes de usar --aplicar.');return;}
    let aplicados=0;
    try{
      for(const item of plano){
        const ref=db.collection('matriculasAutorizadas').doc(item.chave),perfilRef=db.collection('usuarios').doc(item.uid);
        await db.runTransaction(async tx=>{
          const [p,a]=await Promise.all([tx.get(perfilRef),tx.get(ref)]),dados=p.data();
          if(!p.exists||dados.uid!==item.uid||dados.tipoConta!=='aluno'||dados.escola!==item.escola||dados.matricula!==item.matricula||dados.email!==item.email)throw Error('Um perfil mudou durante a execução. Execute novamente a conferência.');
          if(a.exists){const d=a.data();if(d.alunoId===item.uid&&d.escola===item.escola&&d.matricula===item.matricula)return;if(d.alunoId||d.escola!==item.escola||d.matricula!==item.matricula||(d.email&&d.email!==item.email))throw Error('Uma autorização mudou durante a execução.');}
          tx.set(ref,{escola:item.escola,matricula:item.matricula,email:'',ativa:true,alunoId:item.uid,vinculadoEm:FieldValue.serverTimestamp(),revisao:a.exists?a.data().revisao+1:1,criadoEm:a.exists?a.data().criadoEm:FieldValue.serverTimestamp(),atualizadoEm:FieldValue.serverTimestamp(),atualizadoPorUid:'migracao_responsavel_firebase'});
        });aplicados+=1;
      }
      console.log(`${aplicados} vínculo(s) conferido(s). Perfis, contas, respostas e dados alimentares foram preservados.`);
    }catch(e){console.error(`${aplicados} vínculo(s) já conferido(s) foram preservados. A execução pode ser repetida após corrigir o problema.`);throw e;}
  }finally{await deleteApp(app);}
}
if(require.main===module)executar().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={planejarVinculos};

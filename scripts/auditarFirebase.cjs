// Read-only audit. Requires credentials supplied locally by the project owner.
const fs=require('node:fs');const path=require('node:path');const {createRequire}=require('node:module');
const fromFunctions=createRequire(path.resolve('functions/package.json'));
const {initializeApp,applicationDefault}=fromFunctions('firebase-admin/app');const {getFirestore}=fromFunctions('firebase-admin/firestore');
const args=process.argv.slice(2);const option=name=>{const i=args.indexOf(name);return i>=0&&args[i+1]&&!args[i+1].startsWith('--')?args[i+1]:null;};
if(!args.includes('--project')||!args.includes('--out')||!option('--project')||!option('--out')){console.error('Uso: node scripts/auditarFirebase.cjs --project ID_DO_PROJETO --out backups/antes-v3.json');process.exit(1);}
const projectId=option('--project'),saida=path.resolve(option('--out'));if(fs.existsSync(saida)){console.error('O arquivo de saída já existe. Escolha outro caminho para preservar o backup.');process.exit(1);}
const escolas=['Satc','Antônio Guglielmi Sobrinho'];
(async()=>{
 const app=initializeApp({credential:applicationDefault(),projectId}),db=getFirestore(app);
 const backup={projectId,geradoEm:new Date().toISOString(),colecoes:{}};const pendencias={semEscola:[],escolaDesconhecida:[],perfisSemTurnos:[],perfisComIdDivergente:[],refeicoesComDadosInvalidos:[],respostasComVinculoInconsistente:[],duplicadosAtivos:[]};
 const nomes=['usuarios','NomePratos','pratos','agenda','confirmacoes','feedbacks','producao'];
 for(const nome of nomes){const snapshot=await db.collection(nome).get();backup.colecoes[nome]={};for(const doc of snapshot.docs){const d=doc.data();backup.colecoes[nome][doc.id]=d;if(!d.escola)pendencias.semEscola.push({colecao:nome,id:doc.id});else if(!escolas.includes(d.escola))pendencias.escolaDesconhecida.push({colecao:nome,id:doc.id});}}
 const grupos=new Map();
 for(const [id,p] of Object.entries(backup.colecoes.usuarios)){if(p.uid&&p.uid!==id)pendencias.perfisComIdDivergente.push(id);if(p.tipoConta==='aluno'&&!Array.isArray(p.turnos))pendencias.perfisSemTurnos.push(id);}
 for(const [id,r] of Object.entries(backup.colecoes.NomePratos)){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(r.data||'')||!['manha','tarde','noite'].includes(r.turno)||!r.slotId||!r.limiteConfirmacao||!r.inicioAvaliacao||!r.limiteAvaliacao||!Number.isInteger(r.revisao))pendencias.refeicoesComDadosInvalidos.push(id);
  if(r.ativo!==false&&escolas.includes(r.escola)){const chave=[r.escola,r.data,r.turno].join('|');const ids=grupos.get(chave)||[];ids.push(id);grupos.set(chave,ids);}
 }
 for(const [chave,ids] of grupos)if(ids.length>1)pendencias.duplicadosAtivos.push({chave,ids});
 for(const nome of ['confirmacoes','feedbacks','producao'])for(const [id,d] of Object.entries(backup.colecoes[nome])){const r=backup.colecoes.NomePratos[d.refeicaoId],p=d.alunoId&&backup.colecoes.usuarios[d.alunoId];if(!r||d.escola!==r.escola||(nome!=='producao'&&(!p||p.escola!==d.escola)))pendencias.respostasComVinculoInconsistente.push({colecao:nome,id});}
 fs.mkdirSync(path.dirname(saida),{recursive:true});fs.writeFileSync(saida,JSON.stringify({...backup,pendencias},null,2),{flag:'wx',mode:0o600});
 console.log(JSON.stringify({projectId,backup:saida,quantidades:Object.fromEntries(nomes.map(nome=>[nome,Object.keys(backup.colecoes[nome]).length])),pendencias:Object.fromEntries(Object.entries(pendencias).map(([nome,itens])=>[nome,itens.length])),observacao:'Nenhum documento foi escrito ou excluído no Firebase.'},null,2));
 await app.delete();
})().catch(e=>{console.error('Auditoria não concluída:',e.code||'erro',e.message);process.exitCode=1;});

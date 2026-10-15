const fs=require('node:fs');
const path=require('node:path');
const proibidos=['CONTAS_PRONTAS','entrarContaPronta','criarDemoStore','adm@pratocerto.local','aluno@pratocerto.local','EquipeTeste123!','AlunoTeste123!','demo-aluno','Testar sem conta'];
function arquivos(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(p=>p.isDirectory()?arquivos(path.join(dir,p.name)):[path.join(dir,p.name)]);}
const bundles=arquivos('dist').filter(f=>/\.(js|hbc)$/.test(f));
if(bundles.length<3)throw Error('Exporte web, Android e iOS antes de conferir os bundles.');
for(const f of bundles){const conteudo=fs.readFileSync(f);for(const texto of proibidos)if(conteudo.includes(Buffer.from(texto)))throw Error(`Conteúdo de demonstração no build: ${f} (${texto})`);}
console.log(`${bundles.length} bundles conferidos: sem contas prontas, credenciais locais ou módulo de demonstração.`);

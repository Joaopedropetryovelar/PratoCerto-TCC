import { VERSAO_AVISO_RESTRICOES } from '../domain/restricoes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dataLocal, dataDaEscola, instanteEscola, diasDaSemana } from '../domain/refeicoes';
import { proximoDiaUtil, limiteAvaliacao } from '../domain/calendario';
import { ESCOLAS, chaveEscola } from '../domain/escolas';
import { criarDemoStore } from './demoStore';
let modoDemo = false, usuarioDemo = null, relogioDemo = null;
const ouvintesRelogio = new Set();
export function estaEmDemo() { return modoDemo; }
export function usuarioDemonstracao() { return usuarioDemo; }
export function agoraAplicativo() { return modoDemo ? new Date(relogioDemo) : new Date(); }
export function observarRelogio(callback) { ouvintesRelogio.add(callback); return () => ouvintesRelogio.delete(callback); }
export function definirHorarioDemo(hora) { if (!modoDemo || !['08:00','21:00'].includes(hora)) throw new Error('Horário de demonstração inválido.'); relogioDemo = instanteEscola(dataDaEscola(relogioDemo), hora); ouvintesRelogio.forEach((f) => f()); }
export function usarFirebase() { modoDemo = false; usuarioDemo = null; }
export function sairDemonstracao() { usuarioDemo = null; }
const stamp = (date) => ({ seconds: Math.floor(date.getTime()/1000), nanoseconds: date.getMilliseconds()*1000000 });
export const CONTAS_PRONTAS = {
  admin: { email: 'adm@pratocerto.local', senha: 'Admin123!', escola: ESCOLAS[0], tipoConta: 'admin', turno: 'multi' },
  aluno: { email: 'aluno@pratocerto.local', senha: 'Aluno123!', escola: ESCOLAS[0], tipoConta: 'aluno', turno: 'multi' },
};
export async function entrarContaPronta({ email, senha, escola, apenasAdmin = false }) {
  const normalizado = String(email || '').trim().toLowerCase();
  const conta = Object.values(CONTAS_PRONTAS).find((item) => item.email === normalizado);
  if (!conta) return null;
  if (senha !== conta.senha || escola !== conta.escola) throw new Error('E-mail ou senha incorretos.');
  if (apenasAdmin && conta.tipoConta !== 'admin') throw new Error('Sua conta não tem permissão para esta área.');
  const perfil = await entrarDemonstracao(conta.tipoConta, conta.turno, conta.escola);
  return { perfil, verificado: true };
}
export function gerarExemplos(agora = new Date()) {
  const civil = dataDaEscola(agora);
  const diaUtil = [0,6].includes(new Date(`${civil}T12:00:00`).getDay()) ? proximoDiaUtil(civil) : civil;
  const hoje = new Date(`${diaUtil}T12:00:00`);
  const dados = { usuarios: {}, NomePratos: {}, confirmacoes: {}, feedbacks: {}, producao: {}, pratos: {}, agenda: {}, restricoesAlimentares: {}, solicitacoesPrivacidade: {} };
  const turnos = ['manha','tarde','noite'];
  const nomes = ['Arroz, feijão e frango', 'Macarrão com legumes', 'Sopa de legumes e pão', 'Arroz, feijão e omelete', 'Frango com batata'];
  ESCOLAS.forEach((escola, ei) => {
    const prefixo = ei ? `demo-${chaveEscola(escola)}` : 'demo';
    turnos.forEach((turno) => { const uid=`${prefixo}-aluno-${turno}`; dados.usuarios[uid]={uid,nome:`Aluno de exemplo (${turno})`,email:`${uid}@exemplo.invalid`,matricula:String(turnos.indexOf(turno)+1).padStart(5,'0'),turma:'3º Ano do Ensino Médio',turno,turnos:[turno],escola,tipoConta:'aluno'}; });
    const multi=`${prefixo}-aluno-multi`; dados.usuarios[multi]={...dados.usuarios[`${prefixo}-aluno-manha`],uid:multi,email:`${multi}@exemplo.invalid`,nome:'Aluno de dois turnos',matricula:'00004',turnos:['manha','tarde']};
    for (const [sufixo, itens] of [['manha',['intolerancia_lactose']],['tarde',[]],['multi',['alergia_leite','alergia_ovo']]]) {
      const alunoId = `${prefixo}-aluno-${sufixo}`;
      dados.restricoesAlimentares[alunoId] = { alunoId, escola, situacao: itens.length ? 'informadas' : 'nenhuma', itens, outra: '', declarante: 'responsavel', nomeResponsavel: 'Responsável fictício', autorizou: true, versaoAviso: VERSAO_AVISO_RESTRICOES, atualizadoEm: stamp(hoje) };
    }
    dados.usuarios[`${prefixo}-admin`]={uid:`${prefixo}-admin`,nome:'Equipe de exemplo',email:`${prefixo}-equipe@exemplo.invalid`,escola,tipoConta:'admin'};
    nomes.forEach((nome,pi)=>{dados.pratos[`${chaveEscola(escola)}-prato-${pi}`]={nome,descricao:'Cardápio fictício para testes.',escola,revisao:1,criadoEm:stamp(hoje),atualizadoPorUid:`${prefixo}-admin`};});
    // Current and next school weeks, plus recent history; no Saturday/Sunday menus.
    const datas=new Set([...diasDaSemana(hoje),...diasDaSemana(new Date(`${proximoDiaUtil(diasDaSemana(hoje)[4].id)}T12:00:00`))].map((d)=>d.id));
    for(let i=1;i<=10;i+=1){const dia=new Date(hoje);dia.setDate(hoje.getDate()-i);if(![0,6].includes(dia.getDay()))datas.add(dataLocal(dia));}
    [...datas].sort().forEach((data,di)=>turnos.forEach((turno,ti)=>{
      const id=`${prefixo}-${data}-${turno}`;const slot=`${chaveEscola(escola)}_${data}_${turno}`;const pratoId=`${chaveEscola(escola)}-prato-${di%nomes.length}`;
      const horarioLimite={manha:'09:00',tarde:'14:00',noite:'18:00'}[turno],horarioFim={manha:'12:30',tarde:'16:00',noite:'20:00'}[turno];
      const refeicao={escola,nome:dados.pratos[pratoId].nome,descricao:dados.pratos[pratoId].descricao,pratoId,data,turno,tipo:`Refeição da ${turno==='manha'?'manhã':turno}`,horarioLimite,horarioFim,ativo:true,revisao:1,slotId:slot,criadoEm:stamp(hoje)};
      refeicao.limiteConfirmacao=stamp(instanteEscola(data, horarioLimite));refeicao.inicioAvaliacao=stamp(instanteEscola(data, horarioFim));refeicao.limiteAvaliacao=stamp(limiteAvaliacao(refeicao));
      dados.NomePratos[id]=refeicao;dados.agenda[slot]={escola,data,turno,refeicaoId:id,ativo:true};
      for(let i=1;i<=4;i+=1){const alunoId=`${prefixo}-exemplo-${turno}-${i}`,base={escola,alunoId,alunoNome:`Aluno fictício ${i}`,turma:'3º Ano do Ensino Médio',turno,refeicaoId:id,refeicaoNome:refeicao.nome,data,dataResposta:stamp(hoje)};dados.confirmacoes[`${id}_${alunoId}`]={...base,vaiConsumir:i!==4};if(i<=2&&data<=dataLocal(hoje))dados.feedbacks[`${id}_${alunoId}`]={...base,nota:i===1?5:4,emojiValor:i===1?'amei':'gostei',comentario:i===1?'Gostei da refeição de exemplo.':'Poderia ter mais legumes.',etiquetas:[]};}
      if(data<dataLocal(hoje))dados.producao[id]={schemaVersion:1,escola,refeicaoId:id,refeicaoNome:refeicao.nome,data,turno,preparadoG:12000+ti*2000,sobraLimpaG:500,sobraDescartadaG:300,restosG:300+ti*100,servidos:35+ti*5,observacao:'Pesagens fictícias.',revisao:1,criadoPorUid:`${prefixo}-admin`,atualizadoPorUid:`${prefixo}-admin`,criadoEm:stamp(hoje),exemplo:true};
    }));
  });
  return dados;
}
export const demoStore=criarDemoStore(AsyncStorage,gerarExemplos);
export async function entrarDemonstracao(tipoConta, turno='manha', escola=ESCOLAS[0], referencia=new Date()) {
  if(!['aluno','admin'].includes(tipoConta)||!['manha','tarde','noite','multi'].includes(turno)||!ESCOLAS.includes(escola))throw new Error('Perfil de demonstração inválido.');
  await demoStore.carregar();const prefixo=escola===ESCOLAS[0]?'demo':`demo-${chaveEscola(escola)}`;const uid=tipoConta==='admin'?`${prefixo}-admin`:`${prefixo}-aluno-${turno}`;
  const snap=await demoStore.ler({tipo:'doc',colecao:'usuarios',id:uid});if(!snap.exists())throw new Error('Restaure os exemplos antes de continuar.');
  const perfil=snap.data();usuarioDemo={uid,displayName:perfil.nome,email:perfil.email,emailVerified:true};const civil=dataDaEscola(referencia);const diaUtil=[0,6].includes(new Date(`${civil}T12:00:00`).getDay())?proximoDiaUtil(civil):civil;relogioDemo=instanteEscola(diaUtil, '08:00');modoDemo=true;return perfil;
}

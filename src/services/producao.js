import { auth, database, doc, getDoc, alterarDoc, serverTimestamp } from './backend';
import { agoraAplicativo, estaEmDemo } from './demo';
import { horarioValido, instanteEscola } from '../domain/refeicoes';
import { validarProducao } from '../domain/producao';

export async function salvarProducao({ refeicaoId, formulario, revisaoEsperada = 0 }) {
  if (!Number.isSafeInteger(revisaoEsperada) || revisaoEsperada < 0) throw new Error('A revisão do registro é inválida.');
  const usuario = auth.currentUser;
  if (!usuario) throw new Error('Entre novamente para registrar a produção.');
  const perfilSnapshot = await getDoc(doc(database, 'usuarios', usuario.uid));
  const perfil = perfilSnapshot.data();
  if (!perfilSnapshot.exists() || perfil.tipoConta !== 'admin') throw new Error('Somente a equipe pode registrar a produção.');
  if (!String(perfil.escola || '').trim()) throw new Error('A escola da equipe precisa estar cadastrada.');
  const refeicaoSnapshot = await getDoc(doc(database, 'NomePratos', refeicaoId));
  if (!refeicaoSnapshot.exists()) throw new Error('A refeição não foi encontrada.');
  const refeicao = { ...refeicaoSnapshot.data(), id: refeicaoSnapshot.id };
  if (!['manha', 'tarde', 'noite'].includes(refeicao.turno)) throw new Error('O turno da refeição precisa ser corrigido no cardápio.');
  if (refeicao.escola !== perfil.escola) throw new Error('A refeição pertence a outra escola.');
  const resultado = validarProducao(formulario, refeicao, agoraAplicativo());
  if (!resultado.valido) throw new Error(Object.values(resultado.erros)[0]);
  if (!horarioValido(refeicao.horarioFim) || agoraAplicativo() < instanteEscola(refeicao.data, refeicao.horarioFim)) throw new Error('Registre o resultado após o término da refeição.');
  const referencia = doc(database, 'producao', refeicao.id);
  return alterarDoc(referencia, (snapshot) => {
    const anterior = snapshot.exists() ? snapshot.data() : null;
    if ((anterior?.revisao || 0) !== revisaoEsperada) {
      throw new Error('Este registro foi atualizado. Reabra a refeição para carregar os valores mais recentes.');
    }
    if (anterior && anterior.escola !== perfil.escola) throw new Error('O registro pertence a outra escola.');
    if (refeicao.ativo === false && !anterior) throw new Error('Esta refeição foi removida do cardápio.');
    return { ...resultado.dados, schemaVersion: formulario.modo === 'rapido' ? 2 : 1, refeicaoId: refeicao.id, refeicaoNome: refeicao.nome || 'Refeição', data: refeicao.data,
      turno: refeicao.turno, escola: perfil.escola || '', revisao: revisaoEsperada + 1,
      criadoPorUid: anterior?.criadoPorUid || usuario.uid, criadoEm: anterior?.criadoEm || serverTimestamp(),
      atualizadoPorUid: usuario.uid, atualizadoEm: serverTimestamp(), exemplo: estaEmDemo() };
  });
}

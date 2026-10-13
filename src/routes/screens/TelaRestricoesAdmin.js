import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Botao, Carregando, Falha, Filtros, Indicador, Pagina, ui } from '../../components/Interface';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import { TURNOS_ALUNO } from '../../domain/escolas';
import { estatisticasRestricoes } from '../../domain/restricoes';

export default function TelaRestricoesAdmin({ navigation }) {
  const perfil = usePerfil(), [turno, setTurno] = useState('todos');
  const habilitado = perfil.perfil?.tipoConta === 'admin';
  const alunos = useColecaoEscola('usuarios', perfil.perfil, [['tipoConta', '==', 'aluno']], habilitado);
  const restricoes = useColecaoEscola('restricoesAlimentares', perfil.perfil, [], habilitado);
  const fontes = [perfil, alunos, restricoes];
  const resumo = estatisticasRestricoes(alunos.dados, restricoes.dados, turno);
  return <Pagina titulo="Restrições alimentares" subtitulo={`${perfil.perfil?.escola || 'Sua escola'} · Informações declaradas para a alimentação escolar`}>
    {fontes.some((f) => f.carregando) ? <Carregando /> : fontes.some((f) => f.erro) ? <Falha mensagem={fontes.find((f) => f.erro)?.erro} tentarNovamente={() => fontes.forEach((f) => f.tentarNovamente())} /> : !habilitado ? <Text style={ui.erro}>Esta área é exclusiva da equipe autorizada.</Text> : <>
      <Filtros label="Turno dos alunos" opcoes={[{ id: 'todos', nome: 'Todos' }, ...TURNOS_ALUNO]} valor={turno} onChange={setTurno} />
      <View style={ui.linha}><Indicador label="Alunos cadastrados" valor={resumo.total} /><Indicador label="Com restrições declaradas" valor={resumo.comRestricoes} /></View>
      <View style={ui.linha}><Indicador label="Sem restrições declaradas" valor={resumo.semRestricoes} /><Indicador label="Ainda não informaram" valor={resumo.naoInformado} ajuda="Ausência de informação não significa ausência de restrição." /></View>
      <View style={[ui.card, ui.aviso]}><Text style={ui.texto}>{resumo.informados} de {resumo.total} alunos informaram sua situação nesta seleção.</Text><Text style={ui.pequeno}>Os dados são autodeclarados e precisam ser conferidos pela escola. Um aluno pode aparecer em mais de um grupo. Os percentuais abaixo usam todos os alunos cadastrados nesta seleção.</Text></View>
      <View style={ui.card}><Text style={ui.secao}>Impacto na produção</Text><Text style={ui.texto}>{resumo.impacto.porcoesAtencao ? `${resumo.impacto.porcoesAtencao} aluno(s) podem exigir porção alternativa, preparo separado ou conferência de ingredientes neste turno.` : 'Nenhuma restrição declarada exige ajuste de produção nesta seleção.'}</Text><View style={ui.linha}><Indicador label="Porções com atenção" valor={resumo.impacto.porcoesAtencao} ajuda={`${resumo.impacto.percentualAtencao.toFixed(1).replace('.', ',')}% dos alunos cadastrados nesta seleção.`} /><Indicador label="Leite ou lactose" valor={resumo.impacto.semLeiteOuLactose} ajuda="Ajuda a prever opções sem leite/lactose." /></View><View style={ui.linha}><Indicador label="Glúten ou trigo" valor={resumo.impacto.semGlutenOuTrigo} ajuda="Ajuda a separar ingredientes e utensílios quando necessário." /><Indicador label="Alergias críticas" valor={resumo.impacto.alergiasCriticas} ajuda="Ovo, amendoim, castanhas, soja, peixe ou frutos do mar." /></View><Text style={ui.pequeno}>Use esses totais antes de fechar compras, porcionamento e preparo. O app mostra estatísticas internas; a escola ainda precisa validar cada caso antes de mudar a alimentação.</Text></View>
      <View style={ui.card}><Text style={ui.secao}>Quantidade por restrição</Text>{resumo.total ? resumo.grupos.map((grupo) => <View key={grupo.id} testID={`estatistica-${grupo.id}`} style={{ gap: 6 }}>
        <View style={[ui.linha, { justifyContent: 'space-between' }]}><Text style={[ui.texto, { flex: 1 }]}>{grupo.nome}</Text><Text style={ui.label}>{grupo.quantidade} · {grupo.percentual.toFixed(1).replace('.', ',')}%</Text></View>
        <View style={{ height: 10, borderRadius: 5, backgroundColor: '#EAF0EA', overflow: 'hidden' }}><View style={{ height: 10, backgroundColor: '#427B61', width: `${grupo.percentual}%` }} /></View>
      </View>) : <Text style={ui.texto}>Nenhum aluno cadastrado nesta seleção.</Text>}</View>
      <Text style={ui.pequeno}>Esta tela apresenta totais, sem nomes, laudos ou comentários de saúde dos alunos. Compartilhe somente com pessoas autorizadas pela instituição.</Text>
    </>}
    <Botao secundario onPress={() => navigation.goBack()}>Voltar ao painel</Botao>
  </Pagina>;
}

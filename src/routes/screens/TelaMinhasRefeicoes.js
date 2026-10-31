import React from 'react';
import { Text, View } from 'react-native';
import { Botao, Carregando, Falha, Pagina, ui } from '../../components/Interface';
import ListaPaginada from '../../components/ListaPaginada';
import RefeicaoDiaAluno from '../../components/RefeicaoDiaAluno';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import { useAgora } from '../../hooks/useAgora';
import { auth } from '../../services/backend';
import { dataDaEscola } from '../../domain/refeicoes';
import { moverDia } from '../../domain/calendario';
import { podeConsumir, TURNOS_ALUNO } from '../../domain/escolas';
export default function TelaMinhasRefeicoes({ navigation }) {
  const perfil = usePerfil(),
    agora = useAgora(),
    hoje = dataDaEscola(agora);
  const refeicoes = useColecaoEscola('NomePratos', perfil.perfil, [['data', '==', hoje]]);
  // Nunca consulta respostas de outros alunos. Janela de 31 dias permite o fallback por dia.
  const respostas = useColecaoEscola(
    'confirmacoes',
    perfil.perfil,
    [
      ['alunoId', '==', auth.currentUser?.uid || ''],
      ['data', '>=', moverDia(hoje, -30)],
      ['data', '<=', hoje],
    ],
    Boolean(auth.currentUser?.uid),
  );
  const deHoje = refeicoes.dados
    .filter((refeicao) => refeicao.ativo !== false && podeConsumir(refeicao, perfil.perfil))
    .sort((primeiroRegistro, segundoRegistro) =>
      (primeiroRegistro.horarioFim || '').localeCompare(segundoRegistro.horarioFim || ''),
    );
  const historico = respostas.dados
    .filter((item) => item.data < hoje)
    .sort(
      (primeiroRegistro, segundoRegistro) =>
        segundoRegistro.data.localeCompare(primeiroRegistro.data) ||
        primeiroRegistro.id.localeCompare(segundoRegistro.id),
    );
  return (
    <Pagina
      titulo="Minhas refeições"
      subtitulo="Confirme sua participação e consulte suas respostas recentes."
    >
      {perfil.carregando ? (
        <Carregando />
      ) : perfil.erro ? (
        <Falha mensagem={perfil.erro} tentarNovamente={perfil.tentarNovamente} />
      ) : (
        <>
          <Text style={ui.secao}>Hoje</Text>
          {refeicoes.carregando ? (
            <Carregando />
          ) : refeicoes.erro ? (
            <Falha mensagem={refeicoes.erro} tentarNovamente={refeicoes.tentarNovamente} />
          ) : deHoje.length ? (
            deHoje.map((item) => (
              <RefeicaoDiaAluno
                key={item.id}
                refeicao={item}
                perfil={perfil.perfil}
                agora={agora}
                navigation={navigation}
              />
            ))
          ) : (
            <View style={ui.card}>
              <Text style={ui.texto}>Nenhuma refeição publicada para seus turnos hoje.</Text>
              <Botao secundario onPress={() => navigation.navigate('Cardapio')}>
                Ver cardápio
              </Botao>
            </View>
          )}
          <Text style={ui.secao}>Histórico dos últimos 30 dias</Text>
          {respostas.carregando ? (
            <Carregando />
          ) : respostas.erro ? (
            <Falha mensagem={respostas.erro} tentarNovamente={respostas.tentarNovamente} />
          ) : historico.length ? (
            <ListaPaginada
              itens={historico}
              chave={hoje}
              prefixo="historico-refeicoes"
              renderItem={(respostaAluno) => (
                <View key={respostaAluno.id} style={ui.card}>
                  <Text style={ui.selo}>
                    {respostaAluno.data.split('-').reverse().join('/')} ·{' '}
                    {TURNOS_ALUNO.find((turno) => turno.id === respostaAluno.turno)?.nome ||
                      respostaAluno.turno}
                  </Text>
                  <Text style={ui.secao}>{respostaAluno.refeicaoNome || 'Refeição'}</Text>
                  <Text style={ui.texto}>
                    {respostaAluno.vaiConsumir
                      ? 'Você confirmou que iria comer'
                      : 'Você informou que não iria comer'}
                  </Text>
                </View>
              )}
            />
          ) : (
            <Text style={ui.texto}>Suas respostas dos dias anteriores aparecerão aqui.</Text>
          )}
        </>
      )}
    </Pagina>
  );
}

import RefeicaoDiaAluno from '../../components/RefeicaoDiaAluno';
import CartaoRefeicao from '../../components/CartaoRefeicao';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Botao, Carregando, Falha, Filtros, Pagina, ui } from '../../components/Interface';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import { useAgora } from '../../hooks/useAgora';
import { dataDaEscola, erroConfirmacao } from '../../domain/refeicoes';
import { erroAvaliacao, semanaVisivel } from '../../domain/calendario';
import { podeConsumir, turnosDoPerfil, TURNOS_ALUNO } from '../../domain/escolas';
export default function TelaCardapioAluno({ navigation }) {
  const agora = useAgora();
  const hoje = dataDaEscola(agora);
  const perfil = usePerfil();
  // Include Friday schedules when deciding whether the school week has finished.
  const candidatos = useColecaoEscola('NomePratos', perfil.perfil, [
    ['data', '>=', hoje],
    [
      'data',
      '<=',
      new Date(agora.getTime() + 14 * 86400000).toLocaleDateString('sv-SE', {
        timeZone: 'America/Sao_Paulo',
      }),
    ],
  ]);
  const dias = semanaVisivel(agora, candidatos.dados);
  const datasAtuais = dias.map((dados) => dados.id);
  const chave = datasAtuais.join(',');
  const [data, setData] = useState(null);
  const [turno, setTurno] = useState('todos');
  const selecionada =
    data && datasAtuais.includes(data) && data >= hoje
      ? data
      : dias.find((dados) => dados.id >= hoje)?.id || dias[0].id;
  useEffect(() => {
    setData(dias.find((dados) => dados.id >= hoje)?.id || dias[0].id);
  }, [chave, hoje]);
  const pratos = candidatos.dados
    .filter(
      (refeicao) =>
        refeicao.ativo !== false &&
        refeicao.data === selecionada &&
        (turno === 'todos' || refeicao.turno === turno),
    )
    .sort(
      (primeiroRegistro, segundoRegistro) =>
        ['manha', 'tarde', 'noite'].indexOf(primeiroRegistro.turno) -
        ['manha', 'tarde', 'noite'].indexOf(segundoRegistro.turno),
    );
  const deHoje = candidatos.dados
    .filter(
      (refeicao) =>
        refeicao.ativo !== false && refeicao.data === hoje && podeConsumir(refeicao, perfil.perfil),
    )
    .sort(
      (primeiroRegistro, segundoRegistro) =>
        ['manha', 'tarde', 'noite'].indexOf(primeiroRegistro.turno) -
        ['manha', 'tarde', 'noite'].indexOf(segundoRegistro.turno),
    );
  const meus = turnosDoPerfil(perfil.perfil)
    .map(
      (identificador) =>
        TURNOS_ALUNO.find((turnoDaLista) => turnoDaLista.id === identificador)?.nome,
    )
    .join(' e ');
  return (
    <Pagina titulo="Cardápio" subtitulo="Consulte a semana e confirme sua refeição.">
      {perfil.carregando || candidatos.carregando ? (
        <Carregando />
      ) : perfil.erro || candidatos.erro ? (
        <Falha
          mensagem={perfil.erro || candidatos.erro}
          tentarNovamente={() => {
            perfil.tentarNovamente();
            candidatos.tentarNovamente();
          }}
        />
      ) : (
        <>
          <Text style={ui.secao}>Refeição de hoje</Text>
          <Text style={ui.pequeno}>
            Seus turnos: {meus || 'procure a equipe para regularizar'}. Confirme abaixo se vai
            comer.
          </Text>
          {deHoje.length ? (
            deHoje.map((refeicao) => (
              <RefeicaoDiaAluno
                key={refeicao.id}
                refeicao={refeicao}
                perfil={perfil.perfil}
                agora={agora}
                navigation={navigation}
              />
            ))
          ) : (
            <View testID="sem-refeicao-hoje" style={ui.card}>
              <Text style={ui.secao}>Nenhuma refeição publicada para seus turnos hoje</Text>
              <Text style={ui.texto}>
                Quando a equipe publicar o cardápio de hoje, ele aparecerá aqui. Você também pode
                consultar os próximos dias.
              </Text>
            </View>
          )}
          <Text style={ui.secao}>Cardápio da semana</Text>
          <Filtros
            label="Dia da refeição"
            opcoes={dias.map((dados) => ({
              id: dados.id,
              nome: `${dados.nome} ${dados.numero}`,
              disabled: dados.id < hoje,
            }))}
            valor={selecionada}
            onChange={setData}
          />
          <Filtros
            label="Ver turnos"
            opcoes={[
              {
                id: 'todos',
                nome: 'Todos',
              },
              ...TURNOS_ALUNO,
            ]}
            valor={turno}
            onChange={setTurno}
          />
          <Text style={ui.pequeno}>
            Seus turnos: {meus || 'procure a equipe para regularizar'}. Você pode consultar todos os
            turnos; as respostas ficam disponíveis para os seus.
          </Text>
          {!pratos.length ? (
            <View style={ui.card}>
              <Text style={ui.secao}>Cardápio ainda não publicado</Text>
              <Text style={ui.texto}>
                A equipe ainda não publicou uma refeição nesta seleção. Consulte outro dia.
              </Text>
            </View>
          ) : (
            pratos.map((refeicao) => {
              const autorizado = podeConsumir(refeicao, perfil.perfil);
              const fechada = erroConfirmacao(refeicao, turnosDoPerfil(perfil.perfil), agora);
              const avaliacao = erroAvaliacao(refeicao, agora);
              return (
                <CartaoRefeicao key={refeicao.id} nome={refeicao.nome}>
                  <Text style={ui.selo}>
                    {TURNOS_ALUNO.find((turnoDaLista) => turnoDaLista.id === refeicao.turno)?.nome}{' '}
                    · {selecionada.split('-').reverse().join('/')}
                  </Text>
                  <Text style={ui.secao}>{refeicao.nome}</Text>
                  {refeicao.descricao ? <Text style={ui.texto}>{refeicao.descricao}</Text> : null}
                  {autorizado && !fechada ? (
                    <Botao
                      testID={`confirmar-${refeicao.id}`}
                      onPress={() =>
                        navigation.navigate('Confirmacao', {
                          refeicao,
                        })
                      }
                    >
                      Confirmar esta refeição
                    </Botao>
                  ) : (
                    <Text style={ui.pequeno}>
                      {autorizado
                        ? 'Confirmação encerrada.'
                        : 'Consulta do cardápio de outro turno.'}
                    </Text>
                  )}
                  {autorizado && !avaliacao ? (
                    <Botao
                      secundario
                      onPress={() =>
                        navigation.navigate('Feedback', {
                          refeicao,
                        })
                      }
                    >
                      Avaliar esta refeição
                    </Botao>
                  ) : null}
                  {autorizado && selecionada === hoje && avaliacao ? (
                    <Text style={ui.pequeno}>{avaliacao}</Text>
                  ) : null}
                </CartaoRefeicao>
              );
            })
          )}
          <Text style={ui.pequeno}>
            Após a última refeição da sexta-feira, o cardápio avança para a próxima semana. Seu
            histórico fica preservado.
          </Text>
        </>
      )}
    </Pagina>
  );
}

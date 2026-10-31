import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Alert } from '../../components/Alerta';
import { Botao, Carregando, Pagina, ui } from '../../components/Interface';
import AvisoCardapio from '../../components/AvisoCardapio';
import Calendario from '../../components/Calendario';
import CartaoRefeicao from '../../components/CartaoRefeicao';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import { useAgora } from '../../hooks/useAgora';
import { dataDaEscola, dataValida } from '../../domain/refeicoes';
import { moverDia, parseData, proximoDiaUtil } from '../../domain/calendario';
import { organizarRefeicoesPorTurno, podeEditarRefeicao } from '../../domain/cardapio';
import { excluirRefeicao } from '../../services/cardapio';
export default function AdminCardapio({ navigation, route }) {
  const agora = useAgora(),
    hoje = dataDaEscola(agora),
    perfil = usePerfil();
  const [data, setData] = useState(
    [0, 6].includes(parseData(hoje).getDay()) ? proximoDiaUtil(hoje) : hoje,
  );
  const [erro, setErro] = useState(null),
    [ocupado, setOcupado] = useState(false);
  const trava = useRef(false),
    habilitado = perfil.perfil?.tipoConta === 'admin';
  // Um único dia evita a consulta de intervalo que exige índice composto.
  const cardapio = useColecaoEscola(
    'NomePratos',
    perfil.perfil,
    [['data', '==', data]],
    habilitado,
  );
  const turnos = organizarRefeicoesPorTurno(cardapio.dados, data);
  useEffect(() => {
    const selecionada = route?.params?.data;
    if (dataValida(selecionada) && selecionada >= hoje && selecionada <= moverDia(hoje, 365))
      setData(selecionada);
  }, [route?.params?.data, route?.params?.atualizadoEm, hoje]);
  function cadastrar(turno = 'manha') {
    navigation.navigate('RefeicaoDiaAdmin', {
      data,
      turno,
      refeicaoId: null,
    });
  }
  async function remover(refeicao) {
    if (trava.current) return;
    trava.current = true;
    setOcupado(true);
    setErro(null);
    try {
      await excluirRefeicao(refeicao);
    } catch (erroCapturado) {
      setErro(erroCapturado.message || 'Não foi possível excluir a refeição. Tente novamente.');
    } finally {
      trava.current = false;
      setOcupado(false);
    }
  }
  function confirmarExclusao(refeicao, turno) {
    Alert.alert(
      'Excluir refeição do dia?',
      `${refeicao.nome} · ${data.split('-').reverse().join('/')} · ${turno}. A refeição sairá do cardápio dos alunos. O histórico de confirmações, avaliações e produção será preservado.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir refeição',
          style: 'destructive',
          onPress: () => remover(refeicao),
        },
      ],
    );
  }
  return (
    <Pagina
      titulo="Cardápio e alimentos"
      subtitulo={`${perfil.perfil?.escola || 'Sua escola'} · Consulte as refeições de cada turno e gerencie o cardápio.`}
    >
      {perfil.carregando ? (
        <Carregando />
      ) : perfil.erro ? (
        <AvisoCardapio mensagem={perfil.erro} tentarNovamente={perfil.tentarNovamente} />
      ) : !habilitado ? (
        <Text style={ui.erro}>Esta área é exclusiva da equipe.</Text>
      ) : (
        <>
          <Botao testID="abrir-refeicao-dia" disabled={ocupado} onPress={() => cadastrar()}>
            Cadastrar alimento ou refeição
          </Botao>
          <Calendario
            label="Dia do cardápio"
            value={data}
            onChange={(novoValor) => {
              if (!trava.current) {
                setData(novoValor);
                setErro(null);
              }
            }}
            min={hoje}
            max={moverDia(hoje, 365)}
            somenteUteis
          />
          {erro ? (
            <Text accessibilityRole="alert" style={ui.erro}>
              {erro}
            </Text>
          ) : null}
          {cardapio.carregando ? (
            <Carregando />
          ) : cardapio.erro ? (
            <AvisoCardapio mensagem={cardapio.erro} tentarNovamente={cardapio.tentarNovamente} />
          ) : (
            turnos.map((turno) => (
              <View key={turno.id} testID={`refeicoes-turno-${turno.id}`} style={ui.card}>
                <Text style={ui.secao}>{turno.nome}</Text>
                {turno.refeicoes.length ? (
                  turno.refeicoes.map((refeicao) => (
                    <CartaoRefeicao
                      key={refeicao.id}
                      testID={`refeicao-${refeicao.id}`}
                      nome={refeicao.nome}
                    >
                      <Text style={ui.label}>{refeicao.nome}</Text>
                      {refeicao.descricao ? (
                        <Text style={ui.texto}>{refeicao.descricao}</Text>
                      ) : null}
                      <Text style={ui.pequeno}>
                        Confirmar até {refeicao.horarioLimite} · Término {refeicao.horarioFim}
                      </Text>
                      <View style={ui.linha}>
                        <Botao
                          testID={`editar-refeicao-${refeicao.id}`}
                          secundario
                          disabled={ocupado || !podeEditarRefeicao(refeicao, agora)}
                          onPress={() =>
                            navigation.navigate('RefeicaoDiaAdmin', {
                              data: refeicao.data,
                              turno: refeicao.turno,
                              refeicaoId: refeicao.id,
                            })
                          }
                        >
                          Editar refeição
                        </Botao>
                        <Botao
                          testID={`excluir-refeicao-${refeicao.id}`}
                          secundario
                          disabled={ocupado}
                          onPress={() => confirmarExclusao(refeicao, turno.nome)}
                        >
                          Excluir refeição
                        </Botao>
                      </View>
                      {!podeEditarRefeicao(refeicao, agora) ? (
                        <Text style={ui.pequeno}>
                          A edição está disponível para refeições de hoje ou de datas futuras.
                        </Text>
                      ) : null}
                    </CartaoRefeicao>
                  ))
                ) : (
                  <>
                    <Text style={ui.texto}>Nenhuma refeição cadastrada para este turno.</Text>
                    <Botao
                      testID={`adicionar-refeicao-${turno.id}`}
                      secundario
                      disabled={ocupado}
                      onPress={() => cadastrar(turno.id)}
                    >
                      Cadastrar refeição da {turno.nome.toLocaleLowerCase('pt-BR')}
                    </Botao>
                  </>
                )}
              </View>
            ))
          )}
        </>
      )}
    </Pagina>
  );
}

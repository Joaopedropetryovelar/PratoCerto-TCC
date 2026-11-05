import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Botao,
  Carregando,
  Falha,
  Filtros,
  Indicador,
  Pagina,
  ui,
} from '../../components/Interface';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import { TURNOS_ALUNO } from '../../domain/escolas';
import { estatisticasRestricoes } from '../../domain/restricoes';

export default function TelaRestricoesAdmin({ navigation }) {
  const dadosPerfil = usePerfil();
  const [turnoSelecionado, setTurnoSelecionado] = useState('todos');
  const administradorAutorizado = dadosPerfil.perfil?.tipoConta === 'admin';
  const alunosCadastrados = useColecaoEscola(
    'usuarios',
    dadosPerfil.perfil,
    [['tipoConta', '==', 'aluno']],
    administradorAutorizado,
  );
  const declaracoesRestricoes = useColecaoEscola(
    'restricoesAlimentares',
    dadosPerfil.perfil,
    [],
    administradorAutorizado,
  );
  const fontesDados = [dadosPerfil, alunosCadastrados, declaracoesRestricoes];
  const estatisticas = estatisticasRestricoes(
    alunosCadastrados.dados.filter((aluno) => aluno.escola === dadosPerfil.perfil?.escola),
    declaracoesRestricoes.dados,
    turnoSelecionado,
  );

  return (
    <Pagina
      titulo="Restrições alimentares"
      subtitulo={`${dadosPerfil.perfil?.escola || 'Sua escola'} · Alunos cadastrados na escola.`}
    >
      <Filtros
        label="Turno dos alunos"
        opcoes={[{ id: 'todos', nome: 'Todos' }, ...TURNOS_ALUNO]}
        valor={turnoSelecionado}
        onChange={setTurnoSelecionado}
      />
      {fontesDados.some((fonte) => fonte.carregando) ? (
        <Carregando />
      ) : fontesDados.some((fonte) => fonte.erro) ? (
        <Falha
          mensagem={fontesDados.find((fonte) => fonte.erro)?.erro}
          tentarNovamente={() => fontesDados.forEach((fonte) => fonte.tentarNovamente())}
        />
      ) : !administradorAutorizado ? (
        <Text style={ui.erro}>Esta área é exclusiva da direção.</Text>
      ) : (
        <>
          <View style={ui.linha}>
            <Indicador label="Alunos cadastrados" valor={estatisticas.total} />
            <Indicador
              label="Com restrições declaradas"
              valor={estatisticas.comRestricoes}
              ajuda="Cada aluno conta uma vez, mesmo quando declara várias restrições."
            />
          </View>
          <View style={ui.linha}>
            <Indicador label="Sem restrições declaradas" valor={estatisticas.semRestricoes} />
            <Indicador
              label="Ainda não informaram"
              valor={estatisticas.naoInformado}
              ajuda="Ausência de informação não significa ausência de restrição."
            />
          </View>
          <View style={ui.card}>
            <Text style={ui.secao}>Quantidade por restrição</Text>
            <Text testID="explicacao-contagem-restricoes" style={ui.texto}>
              {estatisticas.comRestricoes} aluno(s) com restrições · {estatisticas.totalRestricoes}{' '}
              restrição(ões) informada(s).
            </Text>
            <Text style={ui.pequeno}>
              Um aluno pode aparecer em vários tipos. Por isso, a soma abaixo pode ser maior que o
              número de alunos com restrições. Cada tipo conta o mesmo aluno apenas uma vez.
            </Text>
            {estatisticas.total ? (
              <>
                <Text style={ui.pequeno}>
                  Os percentuais consideram os {estatisticas.total} alunos do turno selecionado.
                </Text>
                {estatisticas.grupos.map((restricao) => (
                  <View
                    key={restricao.id}
                    testID={`estatistica-${restricao.id}`}
                    style={estilos.grupoRestricao}
                  >
                    <View style={[ui.linha, estilos.linhaRestricao]}>
                      <Text style={[ui.texto, estilos.nomeRestricao]}>{restricao.nome}</Text>
                      <Text style={ui.label}>
                        {restricao.quantidade} · {restricao.percentual.toFixed(1).replace('.', ',')}
                        %
                      </Text>
                    </View>
                    <View style={estilos.trilhoBarra}>
                      <View
                        style={[estilos.barraPreenchida, larguraDaBarra(restricao.percentual)]}
                      />
                    </View>
                  </View>
                ))}
              </>
            ) : (
              <Text style={ui.texto}>Nenhum aluno cadastrado nesta seleção.</Text>
            )}
          </View>
          <Text style={ui.pequeno}>
            Os totais usam as declarações atuais dos alunos desta escola e do turno selecionado. A
            escola deve conferir as restrições junto com os ingredientes e o preparo.
          </Text>
        </>
      )}
      <Botao secundario onPress={() => navigation.goBack()}>
        Voltar ao painel
      </Botao>
    </Pagina>
  );
}

const estilos = StyleSheet.create({
  grupoRestricao: {
    gap: 6,
  },
  linhaRestricao: {
    justifyContent: 'space-between',
  },
  nomeRestricao: {
    flex: 1,
  },
  trilhoBarra: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EAF0EA',
    overflow: 'hidden',
  },
  barraPreenchida: {
    height: 10,
    backgroundColor: '#427B61',
  },
});

function larguraDaBarra(percentual) {
  return { width: `${Math.max(0, Math.min(100, percentual))}%` };
}

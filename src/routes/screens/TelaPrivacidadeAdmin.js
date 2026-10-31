import { chamarFuncao } from '../../services/backend';
import React, { useRef, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Botao, Campo, Carregando, Falha, Filtros, Pagina, ui } from '../../components/Interface';
import ListaPaginada from '../../components/ListaPaginada';
import HistoricoPrivacidade from '../../components/HistoricoPrivacidade';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import { atenderSolicitacao } from '../../services/privacidade';
import {
  TIPOS_PEDIDO,
  nomeStatus,
  STATUS_PRIVACIDADE,
  podeAtender,
  revisaoPedido,
  cicloPedido,
} from '../../domain/privacidade';
import { mensagemAuth } from '../../domain/contas';
import { Alert } from '../../components/Alerta';
function Atendimento({ pedido, ocupado, onSalvar }) {
  const [status, setStatus] = useState(pedido.status === 'pendente' ? 'em_analise' : pedido.status),
    [resposta, setResposta] = useState(pedido.resposta || ''),
    [base, setBase] = useState(revisaoPedido(pedido));
  const desatualizado = base !== revisaoPedido(pedido);
  return (
    <View style={estilosLocais.grupo}>
      {desatualizado ? (
        <View style={[ui.card, ui.aviso]}>
          <Text style={ui.texto}>
            Este pedido foi atualizado durante a edição. Seu texto foi preservado; confira a
            atualização antes de salvar.
          </Text>
          <Botao
            testID="recarregar-atendimento"
            secundario
            onPress={() => {
              setBase(revisaoPedido(pedido));
              setStatus(pedido.status === 'pendente' ? 'em_analise' : pedido.status);
              setResposta(pedido.resposta || '');
            }}
          >
            Carregar atualização
          </Botao>
        </View>
      ) : null}
      <Filtros
        label="Novo status"
        opcoes={STATUS_PRIVACIDADE.filter((opcaoStatus) => opcaoStatus.id !== 'pendente').map(
          (opcaoStatus) => ({
            ...opcaoStatus,
            disabled: ocupado || desatualizado,
          }),
        )}
        valor={status}
        onChange={setStatus}
      />
      <Campo
        label="Resposta ao aluno"
        testID="resposta-privacidade"
        value={resposta}
        onChangeText={setResposta}
        multiline
        maxLength={1000}
        editable={!ocupado && !desatualizado}
        ajuda="Esta resposta ficará visível ao aluno. Explique as providências tomadas; concluir não executa exclusão automática."
      />
      <Botao
        testID="salvar-atendimento"
        disabled={desatualizado}
        carregando={ocupado}
        onPress={() =>
          onSalvar({
            status,
            resposta,
            revisaoEsperada: base,
          })
        }
      >
        Salvar atendimento
      </Botao>
    </View>
  );
}
export default function TelaPrivacidadeAdmin({ navigation }) {
  const perfil = usePerfil(),
    habilitado = perfil.perfil?.tipoConta === 'admin',
    lista = useColecaoEscola('solicitacoesPrivacidade', perfil.perfil, [], habilitado);
  const [filtro, setFiltro] = useState('todos'),
    [busca, setBusca] = useState(''),
    [selecionado, setSelecionado] = useState(null),
    [historico, setHistorico] = useState(false),
    [erro, setErro] = useState(null),
    [ocupado, setOcupado] = useState(false);
  const trava = useRef(false);
  const normalizar = (textoNormalizado) =>
    String(textoNormalizado || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const itens = lista.dados
    .filter(
      (solicitacaoPrivacidade) =>
        (filtro === 'todos' || solicitacaoPrivacidade.status === filtro) &&
        normalizar(
          `${solicitacaoPrivacidade.alunoNome} ${solicitacaoPrivacidade.matricula} ${solicitacaoPrivacidade.email}`,
        ).includes(normalizar(busca)),
    )
    .sort(
      (primeiroRegistro, segundoRegistro) =>
        (segundoRegistro.criadoEm?.seconds || 0) - (primeiroRegistro.criadoEm?.seconds || 0) ||
        primeiroRegistro.id.localeCompare(segundoRegistro.id),
    );
  const pedido = lista.dados.find(
    (solicitacaoPrivacidade) => solicitacaoPrivacidade.id === selecionado,
  );
  async function salvar(dados) {
    if (trava.current) return;
    trava.current = true;
    setOcupado(true);
    setErro(null);
    try {
      await atenderSolicitacao(pedido.id, dados);
      setSelecionado(null);
      setHistorico(false);
      Alert.alert(
        'Atendimento registrado',
        'O status e a resposta já podem ser acompanhados pelo aluno.',
      );
    } catch (erroCapturado) {
      setErro(mensagemAuth(erroCapturado));
    } finally {
      trava.current = false;
      setOcupado(false);
    }
  }
  async function excluirConta() {
    if (trava.current || !pedido) return;
    trava.current = true;
    setOcupado(true);
    setErro(null);
    try {
      await chamarFuncao('executarExclusaoDados', {
        uid: pedido.id,
        revisaoEsperada: revisaoPedido(pedido),
      });
      setSelecionado(null);
      lista.tentarNovamente();
      Alert.alert(
        'Providência executada',
        pedido.tipo === 'exclusao_dados'
          ? 'A conta foi excluída e os registros operacionais foram preservados sem os identificadores e comentários.'
          : 'Os identificadores e comentários das respostas foram removidos. A conta permanece disponível.',
      );
    } catch (erroCapturado) {
      setErro(erroCapturado.message);
    } finally {
      trava.current = false;
      setOcupado(false);
    }
  }
  return (
    <Pagina
      titulo="Pedidos de privacidade"
      subtitulo={`${perfil.perfil?.escola || 'Sua escola'} · Consulte os pedidos e registre o atendimento.`}
    >
      {perfil.carregando || lista.carregando ? (
        <Carregando />
      ) : perfil.erro || lista.erro ? (
        <Falha
          mensagem={perfil.erro || lista.erro}
          tentarNovamente={() => {
            perfil.tentarNovamente();
            lista.tentarNovamente();
          }}
        />
      ) : !habilitado ? (
        <Text style={ui.erro}>Esta área é exclusiva da equipe.</Text>
      ) : pedido ? (
        <>
          <View style={ui.card}>
            <Text style={ui.secao}>{pedido.alunoNome}</Text>
            <Text style={ui.selo}>
              {TIPOS_PEDIDO.find((tipoPedido) => tipoPedido.id === pedido.tipo)?.nome ||
                pedido.tipo}
            </Text>
            <Text style={ui.texto}>
              Matrícula {pedido.matricula} · {pedido.turma}
            </Text>
            <Text style={ui.texto}>{pedido.email}</Text>
            <Text style={ui.selo}>
              Pedido {cicloPedido(pedido)} · {nomeStatus(pedido.status)}
            </Text>
            <Text style={ui.texto}>
              {pedido.mensagem || 'O aluno não acrescentou uma mensagem.'}
            </Text>
            {pedido.resposta ? (
              <Text style={ui.texto}>Resposta registrada: {pedido.resposta}</Text>
            ) : null}
            {pedido.executandoExclusao ? (
              <Text style={ui.texto}>
                A limpeza foi iniciada. Em caso de interrupção, aguarde três minutos e use Executar
                exclusão para retomar.
              </Text>
            ) : null}
            {podeAtender(pedido) && !pedido.executandoExclusao ? (
              <Atendimento key={pedido.id} pedido={pedido} ocupado={ocupado} onSalvar={salvar} />
            ) : (
              <Text style={ui.pequeno}>Atendimento concluído. O histórico está preservado.</Text>
            )}
          </View>
          {['exclusao_dados', 'anonimizacao_dados'].includes(pedido.tipo) && podeAtender(pedido) ? (
            <Botao
              disabled={ocupado}
              onPress={() =>
                Alert.alert(
                  'Executar providência solicitada?',
                  pedido.tipo === 'exclusao_dados'
                    ? 'Esta ação exclui a conta, a declaração alimentar e os históricos pessoais. As respostas ficam sem identificadores e comentários. Confirme o atendimento antes de prosseguir.'
                    : 'Esta ação retira identificadores e comentários das respostas anteriores. A conta e as restrições alimentares serão preservadas.',
                  [
                    {
                      text: 'Cancelar',
                      style: 'cancel',
                    },
                    {
                      text: 'Executar exclusão',
                      style: 'destructive',
                      onPress: excluirConta,
                    },
                  ],
                )
              }
            >
              {pedido.tipo === 'exclusao_dados'
                ? 'Executar exclusão da conta e dos dados'
                : 'Remover identificação das respostas'}
            </Botao>
          ) : null}
          {erro ? (
            <Text style={ui.erro} accessibilityRole="alert">
              {erro}
            </Text>
          ) : null}
          <Botao secundario onPress={() => setHistorico(!historico)}>
            {historico ? 'Fechar histórico' : 'Ver histórico completo'}
          </Botao>
          {historico ? <HistoricoPrivacidade uid={pedido.id} /> : null}
          <Botao
            secundario
            disabled={ocupado}
            onPress={() => {
              setSelecionado(null);
              setErro(null);
              setHistorico(false);
            }}
          >
            Voltar aos pedidos
          </Botao>
        </>
      ) : (
        <>
          <Campo label="Buscar aluno, matrícula ou e-mail" value={busca} onChangeText={setBusca} />
          <Filtros
            label="Status"
            valor={filtro}
            onChange={setFiltro}
            opcoes={[
              {
                id: 'todos',
                nome: 'Todos',
              },
              ...STATUS_PRIVACIDADE,
            ]}
          />
          <Text style={ui.pequeno}>
            {lista.dados.length} aluno(s) com pedidos registrados. Abra um pedido para consultar os
            ciclos anteriores no histórico.
          </Text>
          <ListaPaginada
            prefixo="pedidos-privacidade"
            itens={itens}
            tamanho={8}
            chave={`${filtro}|${busca}`}
            renderItem={(solicitacaoPrivacidade) => (
              <View key={solicitacaoPrivacidade.id} style={ui.card}>
                <Text style={ui.secao}>{solicitacaoPrivacidade.alunoNome}</Text>
                <Text style={ui.texto}>
                  Matrícula {solicitacaoPrivacidade.matricula} · {solicitacaoPrivacidade.turma}
                </Text>
                <Text style={ui.selo}>{nomeStatus(solicitacaoPrivacidade.status)}</Text>
                <Botao
                  testID={`abrir-pedido-${solicitacaoPrivacidade.id}`}
                  secundario
                  onPress={() => {
                    setSelecionado(solicitacaoPrivacidade.id);
                    setErro(null);
                    setHistorico(false);
                  }}
                >
                  Consultar e atender
                </Botao>
              </View>
            )}
          />
        </>
      )}
      <Botao secundario disabled={ocupado} onPress={() => navigation.goBack()}>
        Voltar ao painel
      </Botao>
    </Pagina>
  );
}
const estilosLocais = StyleSheet.create({
  grupo: {
    gap: 14,
  },
});

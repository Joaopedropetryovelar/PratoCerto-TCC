import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Alert } from '../../components/Alerta';
import { Botao, Campo, Carregando, Falha, Filtros, Pagina, ui } from '../../components/Interface';
import HistoricoPrivacidade from '../../components/HistoricoPrivacidade';
import ListaPaginada from '../../components/ListaPaginada';
import { mensagemAuth } from '../../domain/contas';
import {
  TIPOS_PEDIDO,
  STATUS_PRIVACIDADE,
  cicloPedido,
  nomeStatus,
  pedidoExigeExclusao,
  podeAtender,
  podeExecutarExclusao,
  revisaoPedido,
  statusPedido,
} from '../../domain/privacidade';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import { atenderSolicitacao, executarExclusaoSolicitada } from '../../services/privacidade';

function normalizarTexto(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// CORREÇÃO 1: o Firebase devolve "internal" puro quando a função não responde
// (por exemplo, quando não está publicada). Traduz isso para algo que o usuário entenda.
function mensagemExclusao(erro) {
  const codigo = String(erro?.code || '');
  const texto = String(erro?.message || '');
  if (codigo === 'functions/internal' && /^internal\b/i.test(texto))
    return 'O servidor não respondeu à exclusão. Confira no Firebase Console → Functions se a função "executarExclusaoDados" está publicada.';
  if (codigo === 'functions/unavailable' || codigo === 'functions/deadline-exceeded')
    return 'Não foi possível conectar ao servidor. Confira a conexão e tente novamente.';
  if (codigo === 'functions/not-found')
    return 'A função de exclusão ainda não foi ativada. Peça ao responsável pelo aplicativo para publicá-la no Firebase.';
  return mensagemAuth(erro);
}

// CORREÇÃO 2: a busca não inclui mais a palavra "undefined" quando falta algum campo.
function textoBuscavel(pedido) {
  return normalizarTexto(
    [pedido.alunoNome, pedido.matricula, pedido.email].filter(Boolean).join(' '),
  );
}

function textoBotaoExclusao(pedido) {
  if (pedido.execucaoIniciadaEm) return 'Retomar exclusão e concluir pedido';
  return pedido.tipo === 'exclusao_dados'
    ? 'Excluir conta e dados e concluir pedido'
    : 'Remover identificação e concluir pedido';
}

function FormularioAtendimento({ pedido, ocupado, onSalvar, onExecutarExclusao }) {
  const [novoStatus, setNovoStatus] = useState(
    pedido.status === 'pendente' ? 'em_analise' : pedido.status,
  );
  const [respostaAluno, setRespostaAluno] = useState(pedido.resposta || '');
  const [revisaoEmEdicao, setRevisaoEmEdicao] = useState(revisaoPedido(pedido));
  const pedidoDesatualizado = revisaoEmEdicao !== revisaoPedido(pedido);
  const exigeExclusao = pedidoExigeExclusao(pedido);
  const opcoesStatus = STATUS_PRIVACIDADE.filter(
    (opcao) => opcao.id !== 'pendente' && (!exigeExclusao || opcao.id !== 'concluida'),
  ).map((opcao) => ({ ...opcao, disabled: ocupado || pedidoDesatualizado }));

  function carregarAtualizacao() {
    setRevisaoEmEdicao(revisaoPedido(pedido));
    setNovoStatus(pedido.status === 'pendente' ? 'em_analise' : pedido.status);
    setRespostaAluno(pedido.resposta || '');
  }

  return (
    <View style={estilos.grupo}>
      {pedidoDesatualizado ? (
        <View style={[ui.card, ui.aviso]}>
          <Text style={ui.texto}>
            Este pedido foi atualizado durante a edição. Confira a atualização antes de continuar.
          </Text>
          <Botao
            testID="recarregar-atendimento"
            secundario
            disabled={ocupado}
            onPress={carregarAtualizacao}
          >
            Carregar atualização
          </Botao>
        </View>
      ) : null}
      {exigeExclusao ? (
        <Text style={ui.pequeno}>
          Salvar a análise registra sua resposta. Para atender à solicitação, use o botão de
          exclusão abaixo. O pedido será concluído após a limpeza dos dados.
        </Text>
      ) : (
        <Filtros
          label="Novo status"
          opcoes={opcoesStatus}
          valor={novoStatus}
          onChange={setNovoStatus}
        />
      )}
      <Campo
        label="Resposta ao aluno"
        testID="resposta-privacidade"
        value={respostaAluno}
        onChangeText={setRespostaAluno}
        multiline
        maxLength={1000}
        editable={!ocupado && !pedidoDesatualizado}
        ajuda={
          exigeExclusao
            ? 'Resposta opcional para a análise. Ao executar a exclusão, o aplicativo registra a confirmação do que foi removido.'
            : 'Informe as providências tomadas. Esta resposta ficará visível ao aluno.'
        }
      />
      <Botao
        testID="salvar-atendimento"
        secundario={exigeExclusao}
        disabled={pedidoDesatualizado}
        carregando={ocupado}
        onPress={() =>
          onSalvar({
            status: exigeExclusao ? 'em_analise' : novoStatus,
            resposta: respostaAluno,
            revisaoEsperada: revisaoEmEdicao,
          })
        }
      >
        {exigeExclusao ? 'Salvar análise' : 'Salvar atendimento'}
      </Botao>
      {exigeExclusao ? (
        <Botao
          testID="executar-exclusao-dados"
          disabled={ocupado || pedidoDesatualizado}
          onPress={() => onExecutarExclusao(revisaoEmEdicao)}
        >
          {textoBotaoExclusao(pedido)}
        </Botao>
      ) : null}
    </View>
  );
}

export default function TelaPrivacidadeAdmin({ navigation }) {
  const dadosPerfil = usePerfil();
  const acessoPermitido = dadosPerfil.perfil?.tipoConta === 'admin';
  const listaPedidos = useColecaoEscola(
    'solicitacoesPrivacidade',
    dadosPerfil.perfil,
    [],
    acessoPermitido,
  );
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [termoBusca, setTermoBusca] = useState('');
  const [pedidoSelecionadoId, setPedidoSelecionadoId] = useState(null);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [mensagemErro, setMensagemErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [solicitacaoTopo, setSolicitacaoTopo] = useState(0);
  const atendimentoEmExecucao = useRef(false);

  const pedidosFiltrados = listaPedidos.dados
    .filter(
      (pedido) =>
        (filtroStatus === 'todos' || statusPedido(pedido) === filtroStatus) &&
        textoBuscavel(pedido).includes(normalizarTexto(termoBusca)),
    )
    .sort(
      (primeiroPedido, segundoPedido) =>
        (segundoPedido.criadoEm?.seconds || 0) - (primeiroPedido.criadoEm?.seconds || 0) ||
        primeiroPedido.id.localeCompare(segundoPedido.id),
    );
  const pedidoSelecionado = listaPedidos.dados.find((pedido) => pedido.id === pedidoSelecionadoId);

  function voltarParaLista() {
    setPedidoSelecionadoId(null);
    setMostrarHistorico(false);
    setMensagemErro(null);
    setSolicitacaoTopo((numeroAtual) => numeroAtual + 1);
  }

  async function salvarAtendimento(dadosAtendimento) {
    if (atendimentoEmExecucao.current || !pedidoSelecionado) return;
    atendimentoEmExecucao.current = true;
    setSalvando(true);
    setMensagemErro(null);
    try {
      await atenderSolicitacao(pedidoSelecionado.id, dadosAtendimento);
      voltarParaLista();
      Alert.alert('Atendimento registrado', 'O aluno já pode acompanhar o status e a resposta.');
    } catch (erro) {
      setMensagemErro(mensagemAuth(erro));
    } finally {
      atendimentoEmExecucao.current = false;
      setSalvando(false);
    }
  }

  async function excluirDadosDoAluno(pedidoConfirmado, revisaoEsperada) {
    if (atendimentoEmExecucao.current) return;
    atendimentoEmExecucao.current = true;
    setSalvando(true);
    setMensagemErro(null);
    try {
      await executarExclusaoSolicitada(pedidoConfirmado.id, revisaoEsperada);
      voltarParaLista();
      listaPedidos.tentarNovamente();
      Alert.alert(
        'Pedido atendido',
        pedidoConfirmado.tipo === 'exclusao_dados'
          ? 'A conta, o cadastro e as restrições alimentares foram excluídos. As respostas ficaram sem identificação e comentários; os totais de refeições foram preservados.'
          : 'A identificação e os comentários das respostas anteriores foram removidos. A conta e as restrições alimentares foram preservadas.',
      );
    } catch (erro) {
      // Mostra o erro real no console para facilitar o diagnóstico (F12 no navegador).
      console.warn('Falha na exclusão de dados:', erro?.code, erro?.message);
      setMensagemErro(mensagemExclusao(erro));
    } finally {
      atendimentoEmExecucao.current = false;
      setSalvando(false);
    }
  }

  function confirmarExclusao(revisaoEsperada) {
    if (!pedidoSelecionado || salvando || !podeExecutarExclusao(pedidoSelecionado)) return;
    const pedidoConfirmado = pedidoSelecionado;
    const excluirConta = pedidoConfirmado.tipo === 'exclusao_dados';
    Alert.alert(
      excluirConta
        ? 'Excluir a conta e os dados deste aluno?'
        : 'Remover a identificação das respostas?',
      excluirConta
        ? 'O cadastro, a conta de acesso, as restrições alimentares e o histórico pessoal do pedido serão excluídos. As respostas ficarão sem identificação e comentários, preservando os totais de refeições. Esta ação não pode ser desfeita.'
        : 'Os identificadores e comentários das respostas anteriores serão removidos. A conta e as restrições alimentares continuarão disponíveis. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: excluirConta ? 'Excluir e concluir' : 'Remover e concluir',
          style: 'destructive',
          onPress: () => excluirDadosDoAluno(pedidoConfirmado, revisaoEsperada),
        },
      ],
    );
  }

  return (
    <Pagina
      titulo="Pedidos de privacidade"
      subtitulo={`${dadosPerfil.perfil?.escola || 'Sua escola'} · Consulte os pedidos e registre o atendimento.`}
      solicitacaoTopo={solicitacaoTopo}
    >
      {dadosPerfil.carregando || listaPedidos.carregando ? (
        <Carregando />
      ) : dadosPerfil.erro || listaPedidos.erro ? (
        <Falha
          mensagem={dadosPerfil.erro || listaPedidos.erro}
          tentarNovamente={() => {
            dadosPerfil.tentarNovamente();
            listaPedidos.tentarNovamente();
          }}
        />
      ) : !acessoPermitido ? (
        <Text style={ui.erro}>Esta área é exclusiva da equipe.</Text>
      ) : pedidoSelecionado ? (
        <>
          <View style={ui.card}>
            <Text style={ui.secao}>{pedidoSelecionado.alunoNome}</Text>
            <Text style={ui.selo}>
              {TIPOS_PEDIDO.find((tipo) => tipo.id === pedidoSelecionado.tipo)?.nome ||
                pedidoSelecionado.tipo}
            </Text>
            {pedidoSelecionado.matricula ? (
              <Text style={ui.texto}>
                Matrícula {pedidoSelecionado.matricula} · {pedidoSelecionado.turma}
              </Text>
            ) : null}
            {pedidoSelecionado.email ? (
              <Text style={ui.texto}>{pedidoSelecionado.email}</Text>
            ) : null}
            <Text style={ui.selo}>
              Pedido {cicloPedido(pedidoSelecionado)} ·{' '}
              {nomeStatus(statusPedido(pedidoSelecionado))}
            </Text>
            {pedidoSelecionado.mensagem ? (
              <Text style={ui.texto}>{pedidoSelecionado.mensagem}</Text>
            ) : null}
            {pedidoSelecionado.resposta ? (
              <Text style={ui.texto}>Resposta registrada: {pedidoSelecionado.resposta}</Text>
            ) : null}
            {podeExecutarExclusao(pedidoSelecionado) && pedidoSelecionado.status === 'concluida' ? (
              <View style={[ui.card, ui.aviso]}>
                <Text style={ui.texto}>
                  Este pedido foi encerrado sem executar a exclusão. Confirme a ação abaixo para
                  remover os dados e finalizar o atendimento.
                </Text>
              </View>
            ) : null}
            {podeExecutarExclusao(pedidoSelecionado) && pedidoSelecionado.execucaoIniciadaEm ? (
              <Text style={ui.texto}>
                {pedidoSelecionado.executandoExclusao
                  ? 'A limpeza foi iniciada. Se não terminar, aguarde três minutos antes de retomar pelo botão abaixo.'
                  : 'A limpeza foi interrompida. Use o botão abaixo para retomar a exclusão dos dados que ainda faltam.'}
              </Text>
            ) : null}
            {podeAtender(pedidoSelecionado) &&
            !pedidoSelecionado.execucaoIniciadaEm &&
            !pedidoSelecionado.executandoExclusao ? (
              <FormularioAtendimento
                key={pedidoSelecionado.id}
                pedido={pedidoSelecionado}
                ocupado={salvando}
                onSalvar={salvarAtendimento}
                onExecutarExclusao={confirmarExclusao}
              />
            ) : podeExecutarExclusao(pedidoSelecionado) ? (
              <Botao
                testID="executar-exclusao-dados"
                carregando={salvando}
                onPress={() => confirmarExclusao(revisaoPedido(pedidoSelecionado))}
              >
                {textoBotaoExclusao(pedidoSelecionado)}
              </Botao>
            ) : (
              <Text style={ui.pequeno}>Atendimento concluído.</Text>
            )}
          </View>
          <Botao
            secundario
            disabled={salvando}
            onPress={() => setMostrarHistorico(!mostrarHistorico)}
          >
            {mostrarHistorico ? 'Fechar histórico' : 'Ver histórico completo'}
          </Botao>
          {mostrarHistorico ? <HistoricoPrivacidade uid={pedidoSelecionado.id} /> : null}
          <Botao secundario disabled={salvando} onPress={voltarParaLista}>
            Voltar aos pedidos
          </Botao>
        </>
      ) : (
        <>
          <Campo
            label="Buscar aluno, matrícula ou e-mail"
            value={termoBusca}
            onChangeText={setTermoBusca}
          />
          <Filtros
            label="Status"
            valor={filtroStatus}
            onChange={setFiltroStatus}
            opcoes={[{ id: 'todos', nome: 'Todos' }, ...STATUS_PRIVACIDADE]}
          />
          <Text style={ui.pequeno}>
            {listaPedidos.dados.length} aluno(s) com pedidos registrados. A exclusão só é concluída
            após a remoção dos dados.
          </Text>
          <ListaPaginada
            prefixo="pedidos-privacidade"
            itens={pedidosFiltrados}
            tamanho={8}
            chave={`${filtroStatus}|${termoBusca}`}
            renderItem={(pedido) => (
              <View key={pedido.id} style={ui.card}>
                <Text style={ui.secao}>{pedido.alunoNome}</Text>
                {pedido.matricula ? (
                  <Text style={ui.texto}>
                    Matrícula {pedido.matricula} · {pedido.turma}
                  </Text>
                ) : null}
                <Text style={ui.selo}>{nomeStatus(statusPedido(pedido))}</Text>
                <Botao
                  testID={`abrir-pedido-${pedido.id}`}
                  secundario
                  onPress={() => {
                    setPedidoSelecionadoId(pedido.id);
                    setMensagemErro(null);
                    setMostrarHistorico(false);
                    setSolicitacaoTopo((numeroAtual) => numeroAtual + 1);
                  }}
                >
                  Consultar e atender
                </Botao>
              </View>
            )}
          />
        </>
      )}
      {mensagemErro ? (
        <Text style={ui.erro} accessibilityRole="alert">
          {mensagemErro}
        </Text>
      ) : null}
      <Botao secundario disabled={salvando} onPress={() => navigation.goBack()}>
        Voltar ao painel
      </Botao>
    </Pagina>
  );
}

const estilos = StyleSheet.create({
  grupo: {
    gap: 14,
  },
});
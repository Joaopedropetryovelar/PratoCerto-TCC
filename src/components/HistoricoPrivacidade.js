import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useColecao } from '../hooks/useDados';
import { Carregando, Falha, ui } from './Interface';
import ListaPaginada from './ListaPaginada';
import { nomeStatus } from '../domain/privacidade';
export default function HistoricoPrivacidade({ uid: identificadorUsuario }) {
  const lista = useColecao(
    identificadorUsuario
      ? `solicitacoesPrivacidade/${identificadorUsuario}/historico`
      : 'historico',
    [],
    Boolean(identificadorUsuario),
  );
  const itens = [...lista.dados].sort(
    (primeiroRegistro, segundoRegistro) => segundoRegistro.revisao - primeiroRegistro.revisao,
  );
  return lista.carregando ? (
    <Carregando />
  ) : lista.erro ? (
    <Falha mensagem={lista.erro} tentarNovamente={lista.tentarNovamente} />
  ) : (
    <View style={estilosLocais.grupo}>
      <Text style={ui.secao}>Histórico de atendimento</Text>
      {!itens.length ? (
        <Text style={ui.pequeno}>
          Ainda não há movimentações registradas. Pedidos anteriores a esta versão terão histórico a
          partir do próximo atendimento.
        </Text>
      ) : (
        <ListaPaginada
          prefixo="historico-privacidade"
          itens={itens}
          chave={identificadorUsuario}
          renderItem={(solicitacaoPrivacidade) => (
            <View key={solicitacaoPrivacidade.id} style={ui.card}>
              <Text style={ui.selo}>
                Pedido {solicitacaoPrivacidade.ciclo} · {nomeStatus(solicitacaoPrivacidade.status)}
              </Text>
              <Text style={ui.pequeno}>
                {solicitacaoPrivacidade.autorTipo === 'admin' ? 'Equipe' : 'Aluno'} ·{' '}
                {solicitacaoPrivacidade.autorNome}
                {solicitacaoPrivacidade.criadoEm?.seconds
                  ? ` · ${new Date(solicitacaoPrivacidade.criadoEm.seconds * 1000).toLocaleString(
                      'pt-BR',
                      {
                        timeZone: 'America/Sao_Paulo',
                      },
                    )}`
                  : ''}
              </Text>
              {solicitacaoPrivacidade.mensagem ? (
                <Text style={ui.texto}>Mensagem: {solicitacaoPrivacidade.mensagem}</Text>
              ) : null}
              {solicitacaoPrivacidade.resposta ? (
                <Text style={ui.texto}>Resposta da equipe: {solicitacaoPrivacidade.resposta}</Text>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}
const estilosLocais = StyleSheet.create({
  grupo: {
    gap: 12,
  },
});

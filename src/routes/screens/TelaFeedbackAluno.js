import React, { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Alert } from '../../components/Alerta';
import { Botao, Filtros, Campo, Carregando, Falha, Pagina, ui } from '../../components/Interface';
import { useDocumento } from '../../hooks/useDados';
import { useRefeicaoAluno } from '../../hooks/useRefeicaoAluno';
import { auth } from '../../services/backend';
import { agoraAplicativo } from '../../services/relogio';
import { podeConsumir } from '../../domain/escolas';
import { erroAvaliacao } from '../../domain/calendario';
import { useAgora } from '../../hooks/useAgora';
import { ETIQUETAS, OPCOES_NOTA, salvarAvaliacao } from '../../services/aluno';
import { dataDaEscola, idAvaliacao } from '../../domain/refeicoes';
export default function TelaFeedbackAluno({ navigation, route }) {
  const [escolhida, setEscolhida] = useState(null);
  useEffect(() => setEscolhida(null), [route?.params?.refeicao?.id]);
  const contexto = useRefeicaoAluno(escolhida || route?.params?.refeicao?.id, 'avaliacao');
  const agora = useAgora();
  useEffect(() => {
    if (!escolhida && !route?.params?.refeicao?.id && !contexto.carregando && contexto.refeicao)
      setEscolhida(contexto.refeicao.id);
  }, [escolhida, route?.params?.refeicao?.id, contexto.carregando, contexto.refeicao?.id]);
  const { refeicao } = contexto;
  const identificadorUsuario = auth.currentUser?.uid;
  const novo = useDocumento(
    'feedbacks',
    refeicao?.id && identificadorUsuario ? idAvaliacao(refeicao.id, identificadorUsuario) : null,
  );
  const antigo = useDocumento(
    'feedbacks',
    refeicao?.data && identificadorUsuario ? `${refeicao.data}_${identificadorUsuario}` : null,
  );
  const salvo =
    novo.dados ||
    (antigo.dados?.refeicaoId === refeicao?.id && antigo.dados?.alunoId === identificadorUsuario
      ? antigo.dados
      : null);
  const [nota, setNota] = useState(null);
  const [etiquetas, setEtiquetas] = useState([]);
  const [comentario, setComentario] = useState('');
  const [editando, setEditando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const bloqueio = useRef(false);
  const prazo = erroAvaliacao(refeicao, agora);
  useEffect(() => {
    setEditando(false);
    setNota(null);
    setEtiquetas([]);
    setComentario('');
  }, [refeicao?.id]);
  useEffect(() => {
    if (editando) return;
    setNota(salvo?.emojiValor || null);
    setEtiquetas(Array.isArray(salvo?.etiquetas) ? salvo.etiquetas : []);
    setComentario(salvo?.comentario || '');
  }, [salvo, editando]);
  async function enviar() {
    if (bloqueio.current || !refeicao || !nota) return;
    bloqueio.current = true;
    setEnviando(true);
    try {
      await salvarAvaliacao(refeicao.id, {
        emojiValor: nota,
        comentario,
        etiquetas,
      });
      setEditando(false);
      Alert.alert('Avaliação enviada', 'Obrigado por ajudar a melhorar a alimentação escolar.');
    } catch (erro) {
      Alert.alert('Não foi possível enviar', erro.message);
    } finally {
      bloqueio.current = false;
      setEnviando(false);
    }
  }
  function tentarNovamente() {
    contexto.tentarNovamente();
    novo.tentarNovamente();
    antigo.tentarNovamente();
  }
  const bloqueada =
    !refeicao || refeicao.ativo === false || !podeConsumir(refeicao, contexto.perfil);
  return (
    <Pagina titulo="Avaliar refeição" subtitulo="Conte como foi a refeição depois de consumi-la.">
      {contexto.carregando || novo.carregando || antigo.carregando ? (
        <Carregando />
      ) : contexto.erro || novo.erro || antigo.erro ? (
        <Falha
          mensagem={contexto.erro || novo.erro || antigo.erro}
          tentarNovamente={tentarNovamente}
        />
      ) : bloqueada ? (
        <View style={ui.card}>
          <Text style={ui.secao}>Nenhuma refeição disponível para avaliar</Text>
          <Text style={ui.texto}>Escolha uma refeição do seu turno no cardápio.</Text>
          <Botao
            secundario
            onPress={() =>
              navigation.navigate('HomeAluno', {
                screen: 'Cardapio',
              })
            }
          >
            Ver cardápio
          </Botao>
        </View>
      ) : (
        <>
          <Filtros
            label="Refeição"
            opcoes={contexto.refeicoes.map((refeicaoDaLista) => ({
              id: refeicaoDaLista.id,
              nome: `${refeicaoDaLista.data.split('-').reverse().join('/')} · ${refeicaoDaLista.turno}`,
            }))}
            valor={refeicao.id}
            onChange={setEscolhida}
          />
          <View style={ui.card}>
            <Text style={ui.selo}>{refeicao.data?.split('-').reverse().join('/')}</Text>
            <Text style={ui.secao}>{refeicao.nome}</Text>
          </View>
          {prazo ? (
            <View style={[ui.card, ui.aviso]}>
              <Text style={ui.texto}>{prazo}</Text>
              {salvo ? (
                <Text style={ui.texto}>
                  Avaliação registrada: {salvo.nota} / 5 · {salvo.comentario}
                </Text>
              ) : null}
            </View>
          ) : salvo && !editando ? (
            <View style={ui.card}>
              <Text style={ui.secao}>Avaliação registrada</Text>
              <Text style={ui.texto}>
                {OPCOES_NOTA.find((item) => item.valor === salvo.emojiValor)?.rotulo ||
                  'Nota registrada'}{' '}
                · {salvo.nota} / 5
              </Text>
              {salvo.comentario ? <Text style={ui.texto}>{salvo.comentario}</Text> : null}
              <Botao testID="editar-avaliacao" secundario onPress={() => setEditando(true)}>
                Editar avaliação
              </Botao>
            </View>
          ) : (
            <>
              <View style={ui.card}>
                <Text style={ui.secao}>Como estava a refeição?</Text>
                <View style={ui.linha}>
                  {OPCOES_NOTA.map((item) => (
                    <TouchableOpacity
                      key={item.valor}
                      testID={`nota-${item.nota}`}
                      accessibilityRole="button"
                      accessibilityLabel={item.rotulo}
                      accessibilityState={{
                        selected: nota === item.valor,
                      }}
                      disabled={enviando}
                      onPress={() => setNota(item.valor)}
                      style={[
                        ui.filtro,
                        estilosLocais.container,
                        nota === item.valor && ui.filtroAtivo,
                      ]}
                    >
                      <Text style={estilosLocais.texto}>{item.emoji}</Text>
                      <Text
                        style={[
                          ui.pequeno,
                          estilosLocais.texto2,
                          nota === item.valor && estilosLocais.texto3,
                        ]}
                      >
                        {item.rotulo}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={ui.card}>
                <Text style={ui.secao}>Quer contar mais?</Text>
                <View style={ui.linha}>
                  {ETIQUETAS.map((item) => (
                    <TouchableOpacity
                      key={item}
                      accessibilityRole="checkbox"
                      accessibilityLabel={item}
                      accessibilityState={{
                        checked: etiquetas.includes(item),
                      }}
                      disabled={enviando}
                      onPress={() =>
                        setEtiquetas((anteriores) =>
                          anteriores.includes(item)
                            ? anteriores.filter((valor) => valor !== item)
                            : [...anteriores, item],
                        )
                      }
                      style={[ui.filtro, etiquetas.includes(item) && ui.filtroAtivo]}
                    >
                      <Text
                        style={[ui.filtroTexto, etiquetas.includes(item) && estilosLocais.texto4]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Campo
                  testID="comentario"
                  label="Comentário (opcional)"
                  multiline
                  maxLength={240}
                  editable={!enviando}
                  value={comentario}
                  onChangeText={setComentario}
                  ajuda={`${comentario.length}/240 caracteres`}
                />
              </View>
              <Botao
                testID="enviar-avaliacao"
                onPress={enviar}
                disabled={!nota}
                carregando={enviando}
              >
                {editando ? 'Salvar avaliação' : 'Enviar avaliação'}
              </Botao>
              {editando ? (
                <Botao secundario disabled={enviando} onPress={() => setEditando(false)}>
                  Cancelar edição
                </Botao>
              ) : null}
            </>
          )}
        </>
      )}
    </Pagina>
  );
}
const estilosLocais = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 48,
    minHeight: 80,
    paddingHorizontal: 3,
    alignItems: 'center',
  },
  texto: {
    fontSize: 26,
  },
  texto2: {
    textAlign: 'center',
    fontSize: 12,
  },
  texto3: {
    color: '#FFFFFF',
  },
  texto4: {
    color: '#FFFFFF',
  },
});

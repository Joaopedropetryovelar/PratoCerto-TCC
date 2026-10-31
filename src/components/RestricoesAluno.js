import React, { useEffect, useRef, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { auth } from '../services/backend';
import { useDocumento } from '../hooks/useDados';
import { formularioRestricoes, resumoRestricoes, validarRestricoes } from '../domain/restricoes';
import { mensagemDados } from '../domain/errosDados';
import { salvarRestricoes, retirarRestricoes } from '../services/restricoes';
import { Botao, Carregando, Falha, ui } from './Interface';
import { Alert } from './Alerta';
import FormularioRestricoes from './FormularioRestricoes';
export default function RestricoesAluno() {
  const registro = useDocumento('restricoesAlimentares', auth.currentUser?.uid);
  const [editando, setEditando] = useState(false),
    [valor, setValor] = useState(formularioRestricoes());
  const [erros, setErros] = useState({}),
    [erro, setErro] = useState(null),
    [ocupado, setOcupado] = useState(false);
  const bloqueio = useRef(false);
  useEffect(() => {
    if (!editando) setValor(formularioRestricoes(registro.dados));
  }, [registro.dados, editando]);
  async function executar(operacao) {
    if (bloqueio.current) return;
    bloqueio.current = true;
    setOcupado(true);
    setErro(null);
    try {
      await operacao();
      setEditando(false);
    } catch (erroCapturado) {
      setErro(erroCapturado.code ? mensagemDados(erroCapturado) : erroCapturado.message);
    } finally {
      bloqueio.current = false;
      setOcupado(false);
    }
  }
  function salvar() {
    const validacao = validarRestricoes(valor);
    setErros(validacao);
    if (Object.keys(validacao).length) return;
    if (valor.situacao === 'nao_informado') {
      setErro('Para retirar uma declaração já salva, use Retirar informações.');
      return;
    }
    executar(async () => {
      await salvarRestricoes(valor);
      Alert.alert('Informação salva', 'A declaração foi atualizada para a equipe da sua escola.');
    });
  }
  if (registro.carregando) return <Carregando />;
  if (registro.erro)
    return <Falha mensagem={registro.erro} tentarNovamente={registro.tentarNovamente} />;
  return (
    <View style={estilosLocais.grupo}>
      {editando ? (
        <>
          <FormularioRestricoes
            valor={valor}
            onChange={setValor}
            erros={erros}
            disabled={ocupado}
          />
          <Botao testID="salvar-restricoes" carregando={ocupado} onPress={salvar}>
            Salvar declaração
          </Botao>
          <Botao
            secundario
            disabled={ocupado}
            onPress={() => {
              setEditando(false);
              setErro(null);
              setErros({});
            }}
          >
            Cancelar
          </Botao>
        </>
      ) : (
        <View style={ui.card}>
          <Text style={ui.secao}>Minhas restrições alimentares</Text>
          <Text testID="resumo-restricoes" style={ui.texto}>
            {resumoRestricoes(registro.dados)}
          </Text>
          {registro.dados?.outra ? <Text style={ui.texto}>{registro.dados.outra}</Text> : null}
          <Text style={ui.pequeno}>
            Informações autodeclaradas. Combine o atendimento com a equipe da escola; não presuma
            que o cardápio seja adequado automaticamente.
          </Text>
          <Botao
            testID="editar-restricoes"
            secundario
            disabled={ocupado}
            onPress={() => {
              setErros({});
              setErro(null);
              setEditando(true);
            }}
          >
            Informar ou atualizar restrições
          </Botao>
          {registro.dados ? (
            <Botao
              testID="retirar-restricoes"
              secundario
              disabled={ocupado}
              onPress={() =>
                Alert.alert(
                  'Retirar informações alimentares?',
                  'Sua declaração será removida. A equipe passará a ver sua situação como não informada. Isso não exclui sua conta nem suas respostas sobre refeições.',
                  [
                    {
                      text: 'Cancelar',
                      style: 'cancel',
                    },
                    {
                      text: 'Retirar',
                      style: 'destructive',
                      onPress: () =>
                        executar(async () => {
                          await retirarRestricoes();
                          Alert.alert(
                            'Declaração retirada',
                            'As informações alimentares foram removidas do registro ativo.',
                          );
                        }),
                    },
                  ],
                )
              }
            >
              Retirar informações alimentares
            </Botao>
          ) : null}
        </View>
      )}
      {erro ? (
        <Text accessibilityRole="alert" style={ui.erro}>
          {erro}
        </Text>
      ) : null}
      {ocupado ? <Carregando /> : null}
    </View>
  );
}
const estilosLocais = StyleSheet.create({
  grupo: {
    gap: 14,
  },
});

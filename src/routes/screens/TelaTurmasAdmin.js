import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Botao, Campo, Carregando, Falha, Pagina, ui } from '../../components/Interface';
import ListaPaginada from '../../components/ListaPaginada';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import { salvarTurma, desativarTurma } from '../../services/turmas';
import { mensagemAuth } from '../../domain/contas';
import { Alert } from '../../components/Alerta';
export default function TelaTurmasAdmin({ navigation }) {
  const perfil = usePerfil(),
    lista = useColecaoEscola('turmas', perfil.perfil);
  const [nome, setNome] = useState(''),
    [ocupado, setOcupado] = useState(false),
    [erro, setErro] = useState(null);
  const trava = useRef(false);
  async function executar(operacao) {
    if (trava.current) return;
    trava.current = true;
    setOcupado(true);
    setErro(null);
    try {
      await operacao();
    } catch (erroCapturado) {
      setErro(mensagemAuth(erroCapturado));
    } finally {
      trava.current = false;
      setOcupado(false);
    }
  }
  const turmas = [...lista.dados].sort((primeiroRegistro, segundoRegistro) =>
    primeiroRegistro.nome.localeCompare(segundoRegistro.nome, 'pt-BR', {
      numeric: true,
    }),
  );
  return (
    <Pagina
      titulo="Turmas da escola"
      subtitulo="Estas opções aparecem no cadastro e na alteração de turma dos alunos."
    >
      {perfil.carregando ? (
        <Carregando />
      ) : perfil.erro ? (
        <Falha mensagem={perfil.erro} tentarNovamente={perfil.tentarNovamente} />
      ) : perfil.perfil?.tipoConta !== 'admin' ? (
        <Text style={ui.texto}>Esta área é exclusiva da equipe.</Text>
      ) : (
        <>
          <View style={ui.card}>
            <Text style={ui.secao}>Adicionar turma</Text>
            <Campo
              label="Nome da turma"
              value={nome}
              onChangeText={setNome}
              maxLength={80}
              editable={!ocupado}
              ajuda="Use a identificação adotada pela sua escola."
            />
            <Botao
              testID="salvar-turma"
              carregando={ocupado}
              onPress={() =>
                executar(async () => {
                  await salvarTurma(nome);
                  setNome('');
                  Alert.alert('Turma disponível', 'Os alunos já podem selecionar essa turma.');
                })
              }
            >
              Adicionar ou reativar turma
            </Botao>
          </View>
          {erro ? (
            <Text accessibilityRole="alert" style={ui.erro}>
              {erro}
            </Text>
          ) : null}
          {lista.carregando ? (
            <Carregando />
          ) : lista.erro ? (
            <Falha mensagem={lista.erro} tentarNovamente={lista.tentarNovamente} />
          ) : (
            <ListaPaginada
              itens={turmas}
              tamanho={8}
              renderItem={(turma) => (
                <View key={turma.id} style={ui.card}>
                  <Text style={ui.secao}>{turma.nome}</Text>
                  <Text style={ui.pequeno}>
                    {turma.ativa ? 'Disponível para seleção' : 'Desativada para novos cadastros'}
                  </Text>
                  {turma.ativa ? (
                    <Botao
                      secundario
                      disabled={ocupado}
                      onPress={() =>
                        Alert.alert(
                          'Desativar turma?',
                          'Os perfis e históricos existentes serão preservados.',
                          [
                            {
                              text: 'Cancelar',
                              style: 'cancel',
                            },
                            {
                              text: 'Desativar',
                              onPress: () => executar(() => desativarTurma(turma.id)),
                            },
                          ],
                        )
                      }
                    >
                      Desativar
                    </Botao>
                  ) : null}
                </View>
              )}
            />
          )}
        </>
      )}
      <Botao secundario onPress={() => navigation.goBack()}>
        Voltar
      </Botao>
    </Pagina>
  );
}

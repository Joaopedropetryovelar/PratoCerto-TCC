import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Botao, Campo, Carregando, Falha, Filtros, Pagina, ui } from '../../components/Interface';
import ListaPaginada from '../../components/ListaPaginada';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import {
  autorizarMatricula,
  autorizarMatriculasEmLote,
  desativarAutorizacao,
} from '../../services/matriculas';
import { analisarListaMatriculas } from '../../domain/matriculas';
import { mensagemAuth } from '../../domain/contas';
import { Alert } from '../../components/Alerta';
const situacoes = {
  autorizada: 'Autorizada',
  atualizada: 'Atualizada',
  existente: 'Já estava autorizada',
  vinculada: 'Conta já vinculada',
  inativa: 'Inativa: reative individualmente',
  erro: 'Não autorizada',
};
export default function TelaMatriculasAdmin({ navigation }) {
  const perfil = usePerfil(),
    habilitado = perfil.perfil?.tipoConta === 'admin',
    lista = useColecaoEscola('matriculasAutorizadas', perfil.perfil, [], habilitado);
  const [modo, setModo] = useState('lote'),
    [matricula, setMatricula] = useState(''),
    [editor, setEditor] = useState(null),
    [email, setEmail] = useState('');
  const [entrada, setEntrada] = useState(''),
    [previa, setPrevia] = useState(null),
    [resultado, setResultado] = useState(null),
    [progresso, setProgresso] = useState(null);
  const [busca, setBusca] = useState(''),
    [situacao, setSituacao] = useState('todas'),
    [erro, setErro] = useState(null),
    [ocupado, setOcupado] = useState(false);
  const trava = useRef(false);
  function limpar() {
    setEditor(null);
    setMatricula('');
    setEmail('');
  }
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
  function conferir() {
    setErro(null);
    setResultado(null);
    try {
      const previaMatriculas = analisarListaMatriculas(entrada);
      if (!previaMatriculas.matriculas.length)
        throw new Error('Cole pelo menos uma matrícula de cinco números.');
      setPrevia(previaMatriculas);
    } catch (erroCapturado) {
      setPrevia(null);
      setErro(erroCapturado.message);
    }
  }
  const itens = lista.dados
    .filter(
      (matriculaAutorizada) =>
        (situacao === 'todas' ||
          (situacao === 'vinculadas'
            ? Boolean(matriculaAutorizada.alunoId)
            : situacao === 'ativas'
              ? matriculaAutorizada.ativa && !matriculaAutorizada.alunoId
              : !matriculaAutorizada.ativa && !matriculaAutorizada.alunoId)) &&
        matriculaAutorizada.matricula.includes(busca.trim()),
    )
    .sort((primeiroRegistro, segundoRegistro) =>
      primeiroRegistro.matricula.localeCompare(segundoRegistro.matricula),
    );
  const liberadas =
    resultado?.filter((resultadoAutorizacao) =>
      ['autorizada', 'atualizada'].includes(resultadoAutorizacao.status),
    ).length || 0;
  const falhas =
    resultado?.filter((resultadoAutorizacao) => resultadoAutorizacao.status === 'erro') || [];
  return (
    <Pagina
      titulo="Matrículas autorizadas"
      subtitulo={`${perfil.perfil?.escola || 'Sua escola'} · Autorize matrículas; o vínculo com e-mail é opcional.`}
    >
      {perfil.carregando ? (
        <Carregando />
      ) : perfil.erro ? (
        <Falha mensagem={perfil.erro} tentarNovamente={perfil.tentarNovamente} />
      ) : !habilitado ? (
        <Text style={ui.erro}>Esta área é exclusiva da equipe.</Text>
      ) : (
        <>
          <Filtros
            label="Como autorizar"
            valor={modo}
            onChange={(novoValor) => {
              if (!ocupado) {
                setModo(novoValor);
                setErro(null);
                limpar();
              }
            }}
            opcoes={[
              {
                id: 'lote',
                nome: 'Várias de uma vez',
                disabled: ocupado,
              },
              {
                id: 'individual',
                nome: 'Uma matrícula',
                disabled: ocupado,
              },
            ]}
          />
          {modo === 'lote' ? (
            <View style={ui.card}>
              <Text style={ui.secao}>Cole a lista de matrículas</Text>
              <Text style={ui.texto}>
                Copie a coluna de matrículas da lista da escola. Use uma por linha ou separe por
                vírgula, ponto e vírgula ou espaço. Até 500 por envio.
              </Text>
              <Campo
                label="Lista de matrículas"
                testID="lista-matriculas"
                value={entrada}
                onChangeText={(novoValor) => {
                  setEntrada(novoValor);
                  setPrevia(null);
                  setResultado(null);
                  setProgresso(null);
                }}
                multiline
                numberOfLines={6}
                maxLength={20000}
                editable={!ocupado}
                placeholder={'01234\n05678\n12345'}
                ajuda="Cada matrícula deve ter cinco números. Preserve os zeros à esquerda; não cole nomes nem e-mails."
              />
              <Botao testID="conferir-matriculas" secundario disabled={ocupado} onPress={conferir}>
                Conferir lista
              </Botao>
              {previa ? (
                <View testID="previa-matriculas" style={ui.card}>
                  <Text style={ui.secao}>
                    {previa.matriculas.length} matrículas únicas no formato correto
                  </Text>
                  <Text style={ui.texto}>
                    {previa.repetidas} repetidas serão ignoradas. Conferir a lista ainda não
                    autoriza nenhum cadastro.
                  </Text>
                  {previa.invalidas.length ? (
                    <Text style={ui.erro}>
                      Corrija estes valores antes de enviar:{' '}
                      {previa.invalidas.slice(0, 15).join(', ')}
                      {previa.invalidas.length > 15 ? '…' : ''}. Nenhuma matrícula foi enviada.
                    </Text>
                  ) : (
                    <>
                      <Text style={ui.pequeno}>
                        {previa.matriculas.slice(0, 20).join(', ')}
                        {previa.matriculas.length > 20 ? '…' : ''}
                      </Text>
                      <Text style={ui.pequeno}>
                        Contas vinculadas e autorizações inativas serão preservadas. Vínculos de
                        e-mail já existentes serão preservados.
                      </Text>
                      <Botao
                        testID="autorizar-lote"
                        carregando={ocupado}
                        disabled={ocupado || Boolean(resultado)}
                        onPress={() =>
                          executar(async () => {
                            setProgresso({
                              concluidas: 0,
                              total: previa.matriculas.length,
                            });
                            setResultado(await autorizarMatriculasEmLote(entrada, setProgresso));
                          })
                        }
                      >
                        Autorizar lista da escola
                      </Botao>
                    </>
                  )}
                </View>
              ) : null}
              {progresso ? (
                <Text accessibilityLiveRegion="polite" style={ui.texto}>
                  {progresso.concluidas} de {progresso.total} matrículas processadas.
                </Text>
              ) : null}
              {resultado ? (
                <View testID="resultado-lote" style={ui.card}>
                  <Text style={ui.secao}>
                    {liberadas} liberadas · {falhas.length} com erro
                  </Text>
                  <Text style={ui.texto}>
                    Os demais resultados mostram matrículas já existentes, vinculadas ou inativas.
                    Uma falha não desfaz as autorizações que deram certo.
                  </Text>
                  <ListaPaginada
                    prefixo="resultado-matriculas"
                    itens={resultado}
                    tamanho={8}
                    chave={resultado
                      .map((resultadoAutorizacao) => resultadoAutorizacao.matricula)
                      .join(',')}
                    renderItem={(resultadoAutorizacao) => (
                      <View key={resultadoAutorizacao.matricula}>
                        <Text style={resultadoAutorizacao.status === 'erro' ? ui.erro : ui.texto}>
                          {resultadoAutorizacao.matricula} —{' '}
                          {situacoes[resultadoAutorizacao.status]}
                          {resultadoAutorizacao.mensagem
                            ? `: ${resultadoAutorizacao.mensagem}`
                            : ''}
                        </Text>
                      </View>
                    )}
                  />
                  {falhas.length ? (
                    <Botao
                      testID="repetir-falhas-matriculas"
                      secundario
                      onPress={() => {
                        setEntrada(
                          falhas
                            .map((resultadoAutorizacao) => resultadoAutorizacao.matricula)
                            .join('\n'),
                        );
                        setResultado(null);
                        setPrevia(null);
                        setProgresso(null);
                      }}
                    >
                      Preparar nova tentativa só das falhas
                    </Botao>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : (
            <View style={ui.card}>
              <Text style={ui.secao}>
                {editor ? 'Editar autorização' : 'Autorizar uma matrícula'}
              </Text>
              <Campo
                label="Matrícula"
                testID="matricula-autorizada"
                value={matricula}
                onChangeText={setMatricula}
                maxLength={5}
                keyboardType="number-pad"
                editable={!ocupado && !editor}
                ajuda="Cinco números, preservando os zeros à esquerda."
              />
              <Campo
                label="E-mail vinculado (opcional)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!ocupado}
                ajuda="Se preenchido, apenas esse e-mail poderá usar a matrícula."
              />
              <Text style={ui.pequeno}>
                O aluno informará o próprio e-mail e a senha ao criar a conta. Cada matrícula só
                pode ser vinculada a uma conta nesta escola.
              </Text>
              <Botao
                testID="autorizar-matricula"
                carregando={ocupado}
                onPress={() =>
                  executar(async () => {
                    const resultadoAutorizacao = await autorizarMatricula({
                      matricula,
                      email,
                      revisaoEsperada: editor?.revisao || 0,
                    });
                    limpar();
                    Alert.alert(
                      resultadoAutorizacao.alunoId
                        ? 'Cadastro existente reconhecido'
                        : 'Matrícula autorizada',
                      resultadoAutorizacao.alunoId
                        ? 'A matrícula foi vinculada ao cadastro existente, sem criar outra conta.'
                        : 'O aluno já pode criar a conta com esta matrícula e o próprio e-mail.',
                    );
                  })
                }
              >
                {editor ? 'Salvar autorização' : 'Autorizar cadastro'}
              </Botao>
              {editor ? (
                <Botao secundario disabled={ocupado} onPress={limpar}>
                  Cancelar edição
                </Botao>
              ) : null}
            </View>
          )}
          {erro ? (
            <Text style={ui.erro} accessibilityRole="alert">
              {erro}
            </Text>
          ) : null}
          <Campo
            label="Buscar matrícula"
            value={busca}
            onChangeText={setBusca}
            keyboardType="number-pad"
          />
          <Filtros
            label="Situação"
            valor={situacao}
            onChange={setSituacao}
            opcoes={[
              {
                id: 'todas',
                nome: 'Todas',
              },
              {
                id: 'ativas',
                nome: 'Aguardando cadastro',
              },
              {
                id: 'vinculadas',
                nome: 'Vinculadas',
              },
              {
                id: 'inativas',
                nome: 'Inativas',
              },
            ]}
          />
          {lista.carregando ? (
            <Carregando />
          ) : lista.erro ? (
            <Falha mensagem={lista.erro} tentarNovamente={lista.tentarNovamente} />
          ) : (
            <ListaPaginada
              prefixo="matriculas"
              itens={itens}
              tamanho={8}
              chave={`${busca}|${situacao}`}
              renderItem={(matriculaAutorizada) => (
                <View key={matriculaAutorizada.id} style={ui.card}>
                  <Text style={ui.secao}>{matriculaAutorizada.matricula}</Text>
                  <Text style={ui.selo}>
                    {matriculaAutorizada.alunoId
                      ? 'Conta vinculada'
                      : matriculaAutorizada.ativa
                        ? 'Autorizada para cadastro'
                        : 'Autorização inativa'}
                  </Text>
                  {!matriculaAutorizada.alunoId ? (
                    <>
                      <Text style={ui.pequeno}>
                        {matriculaAutorizada.email
                          ? 'Cadastro restrito ao e-mail vinculado.'
                          : 'Sem exigência de e-mail pré-cadastrado.'}
                      </Text>
                      <View style={ui.linha}>
                        <Botao
                          secundario
                          disabled={ocupado}
                          onPress={() => {
                            setModo('individual');
                            setEditor(matriculaAutorizada);
                            setMatricula(matriculaAutorizada.matricula);
                            setEmail(matriculaAutorizada.email || '');
                            setErro(null);
                          }}
                        >
                          Editar ou reativar
                        </Botao>
                        {matriculaAutorizada.ativa ? (
                          <Botao
                            secundario
                            disabled={ocupado}
                            onPress={() =>
                              Alert.alert(
                                'Desativar autorização?',
                                'Isso impede o cadastro enquanto a autorização estiver inativa.',
                                [
                                  {
                                    text: 'Cancelar',
                                    style: 'cancel',
                                  },
                                  {
                                    text: 'Desativar',
                                    onPress: () =>
                                      executar(() =>
                                        desativarAutorizacao(
                                          matriculaAutorizada.matricula,
                                          matriculaAutorizada.revisao,
                                        ),
                                      ),
                                  },
                                ],
                              )
                            }
                          >
                            Desativar
                          </Botao>
                        ) : null}
                      </View>
                    </>
                  ) : (
                    <Text style={ui.pequeno}>
                      A conta existente foi preservada. Esta tela não transfere matrículas entre
                      contas.
                    </Text>
                  )}
                </View>
              )}
            />
          )}
        </>
      )}
      <Botao secundario disabled={ocupado} onPress={() => navigation.goBack()}>
        Voltar
      </Botao>
    </Pagina>
  );
}

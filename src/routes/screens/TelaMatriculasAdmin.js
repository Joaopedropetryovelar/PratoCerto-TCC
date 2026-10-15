import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Botao, Campo, Carregando, Falha, Filtros, Pagina, ui } from '../../components/Interface';
import ListaPaginada from '../../components/ListaPaginada';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import { autorizarMatricula, autorizarMatriculasEmLote, desativarAutorizacao } from '../../services/matriculas';
import { analisarListaMatriculas } from '../../domain/matriculas';
import { mensagemAuth } from '../../domain/contas';
import { Alert } from '../../components/Alerta';
const situacoes = { autorizada: 'Autorizada', atualizada: 'Liberada sem e-mail', existente: 'Já estava autorizada', vinculada: 'Conta já vinculada', inativa: 'Inativa: reative individualmente', erro: 'Não autorizada' };
export default function TelaMatriculasAdmin({ navigation }) {
  const perfil = usePerfil(), habilitado = perfil.perfil?.tipoConta === 'admin', lista = useColecaoEscola('matriculasAutorizadas', perfil.perfil, [], habilitado);
  const [modo, setModo] = useState('lote'), [matricula, setMatricula] = useState(''), [editor, setEditor] = useState(null);
  const [entrada, setEntrada] = useState(''), [previa, setPrevia] = useState(null), [resultado, setResultado] = useState(null), [progresso, setProgresso] = useState(null);
  const [busca, setBusca] = useState(''), [situacao, setSituacao] = useState('todas'), [erro, setErro] = useState(null), [ocupado, setOcupado] = useState(false);
  const trava = useRef(false);
  function limpar() { setEditor(null); setMatricula(''); }
  async function executar(fn) {
    if (trava.current) return;
    trava.current = true; setOcupado(true); setErro(null);
    try { await fn(); } catch (e) { setErro(mensagemAuth(e)); }
    finally { trava.current = false; setOcupado(false); }
  }
  function conferir() {
    setErro(null); setResultado(null);
    try { const p = analisarListaMatriculas(entrada); if (!p.matriculas.length) throw new Error('Cole pelo menos uma matrícula de cinco números.'); setPrevia(p); }
    catch (e) { setPrevia(null); setErro(e.message); }
  }
  const itens = lista.dados.filter(r => (situacao === 'todas' || (situacao === 'vinculadas' ? Boolean(r.alunoId) : situacao === 'ativas' ? r.ativa && !r.alunoId : !r.ativa && !r.alunoId)) && r.matricula.includes(busca.trim())).sort((a, b) => a.matricula.localeCompare(b.matricula));
  const liberadas = resultado?.filter(r => ['autorizada', 'atualizada'].includes(r.status)).length || 0;
  const falhas = resultado?.filter(r => r.status === 'erro') || [];
  return <Pagina titulo="Matrículas autorizadas" subtitulo={`${perfil.perfil?.escola || 'Sua escola'} · Libere o cadastro usando apenas as matrículas, sem informar e-mails.`}>
    {perfil.carregando ? <Carregando /> : perfil.erro ? <Falha mensagem={perfil.erro} tentarNovamente={perfil.tentarNovamente} /> : !habilitado ? <Text style={ui.erro}>Esta área é exclusiva da equipe.</Text> : <>
      <Filtros label="Como autorizar" valor={modo} onChange={v => { if (!ocupado) { setModo(v); setErro(null); limpar(); } }} opcoes={[{ id: 'lote', nome: 'Várias de uma vez', disabled: ocupado }, { id: 'individual', nome: 'Uma matrícula', disabled: ocupado }]} />
      {modo === 'lote' ? <View style={ui.card}>
        <Text style={ui.secao}>Cole a lista de matrículas</Text>
        <Text style={ui.texto}>Copie a coluna de matrículas da lista da escola. Use uma por linha ou separe por vírgula, ponto e vírgula ou espaço. Até 500 por envio.</Text>
        <Campo label="Lista de matrículas" testID="lista-matriculas" value={entrada} onChangeText={v => { setEntrada(v); setPrevia(null); setResultado(null); setProgresso(null); }} multiline numberOfLines={6} maxLength={20000} editable={!ocupado} placeholder={'01234\n05678\n12345'} ajuda="Cada matrícula deve ter cinco números. Preserve os zeros à esquerda; não cole nomes nem e-mails." />
        <Botao testID="conferir-matriculas" secundario disabled={ocupado} onPress={conferir}>Conferir lista</Botao>
        {previa ? <View testID="previa-matriculas" style={ui.card}>
          <Text style={ui.secao}>{previa.matriculas.length} matrículas únicas no formato correto</Text>
          <Text style={ui.texto}>{previa.repetidas} repetidas serão ignoradas. Conferir a lista ainda não autoriza nenhum cadastro.</Text>
          {previa.invalidas.length ? <Text style={ui.erro}>Corrija estes valores antes de enviar: {previa.invalidas.slice(0, 15).join(', ')}{previa.invalidas.length > 15 ? '…' : ''}. Nenhuma matrícula foi enviada.</Text> : <><Text style={ui.pequeno}>{previa.matriculas.slice(0, 20).join(', ')}{previa.matriculas.length > 20 ? '…' : ''}</Text><Text style={ui.pequeno}>Contas vinculadas e autorizações inativas serão preservadas. Autorizações pendentes antigas perderão a exigência de e-mail.</Text><Botao testID="autorizar-lote" carregando={ocupado} disabled={ocupado || Boolean(resultado)} onPress={() => executar(async () => { setProgresso({ concluidas: 0, total: previa.matriculas.length }); setResultado(await autorizarMatriculasEmLote(entrada, setProgresso)); })}>Autorizar lista da escola</Botao></>}
        </View> : null}
        {progresso ? <Text accessibilityLiveRegion="polite" style={ui.texto}>{progresso.concluidas} de {progresso.total} matrículas processadas.</Text> : null}
        {resultado ? <View testID="resultado-lote" style={ui.card}><Text style={ui.secao}>{liberadas} liberadas · {falhas.length} com erro</Text><Text style={ui.texto}>Os demais resultados mostram matrículas já existentes, vinculadas ou inativas. Uma falha não desfaz as autorizações que deram certo.</Text><ListaPaginada prefixo="resultado-matriculas" itens={resultado} tamanho={8} chave={resultado.map(r => r.matricula).join(',')} renderItem={r => <View key={r.matricula}><Text style={r.status === 'erro' ? ui.erro : ui.texto}>{r.matricula} — {situacoes[r.status]}{r.mensagem ? `: ${r.mensagem}` : ''}</Text></View>} />{falhas.length ? <Botao testID="repetir-falhas-matriculas" secundario onPress={() => { setEntrada(falhas.map(r => r.matricula).join('\n')); setResultado(null); setPrevia(null); setProgresso(null); }}>Preparar nova tentativa só das falhas</Botao> : null}</View> : null}
      </View> : <View style={ui.card}>
        <Text style={ui.secao}>{editor ? 'Reativar ou liberar sem e-mail' : 'Autorizar uma matrícula'}</Text>
        <Campo label="Matrícula" testID="matricula-autorizada" value={matricula} onChangeText={setMatricula} maxLength={5} keyboardType="number-pad" editable={!ocupado && !editor} ajuda="Cinco números, preservando os zeros à esquerda." />
        <Text style={ui.pequeno}>O aluno informará o próprio e-mail e a senha ao criar a conta. Cada matrícula só pode ser vinculada a uma conta nesta escola.</Text>
        <Botao testID="autorizar-matricula" carregando={ocupado} onPress={() => executar(async () => { const r = await autorizarMatricula({ matricula, revisaoEsperada: editor?.revisao || 0 }); limpar(); Alert.alert(r.alunoId ? 'Cadastro existente reconhecido' : 'Matrícula autorizada', r.alunoId ? 'A matrícula foi vinculada ao cadastro existente, sem criar outra conta.' : 'O aluno já pode criar a conta com esta matrícula e o próprio e-mail.'); })}>{editor ? 'Salvar e liberar sem e-mail' : 'Autorizar cadastro'}</Botao>
        {editor ? <Botao secundario disabled={ocupado} onPress={limpar}>Cancelar edição</Botao> : null}
      </View>}
      {erro ? <Text style={ui.erro} accessibilityRole="alert">{erro}</Text> : null}
      <Campo label="Buscar matrícula" value={busca} onChangeText={setBusca} keyboardType="number-pad" />
      <Filtros label="Situação" valor={situacao} onChange={setSituacao} opcoes={[{ id: 'todas', nome: 'Todas' }, { id: 'ativas', nome: 'Aguardando cadastro' }, { id: 'vinculadas', nome: 'Vinculadas' }, { id: 'inativas', nome: 'Inativas' }]} />
      {lista.carregando ? <Carregando /> : lista.erro ? <Falha mensagem={lista.erro} tentarNovamente={lista.tentarNovamente} /> : <ListaPaginada prefixo="matriculas" itens={itens} tamanho={8} chave={`${busca}|${situacao}`} renderItem={r => <View key={r.id} style={ui.card}>
        <Text style={ui.secao}>{r.matricula}</Text><Text style={ui.selo}>{r.alunoId ? 'Conta vinculada' : r.ativa ? 'Autorizada para cadastro' : 'Autorização inativa'}</Text>
        {!r.alunoId ? <><Text style={ui.pequeno}>{r.email ? 'Autorização antiga com e-mail. Edite para liberar apenas pela matrícula.' : 'Sem exigência de e-mail pré-cadastrado.'}</Text><View style={ui.linha}><Botao secundario disabled={ocupado} onPress={() => { setModo('individual'); setEditor(r); setMatricula(r.matricula); setErro(null); }}>Editar ou reativar</Botao>{r.ativa ? <Botao secundario disabled={ocupado} onPress={() => Alert.alert('Desativar autorização?', 'Isso impede o cadastro enquanto a autorização estiver inativa.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Desativar', onPress: () => executar(() => desativarAutorizacao(r.matricula, r.revisao)) }])}>Desativar</Botao> : null}</View></> : <Text style={ui.pequeno}>A conta existente foi preservada. Esta tela não transfere matrículas entre contas.</Text>}
      </View>} />}
    </>}
    <Botao secundario disabled={ocupado} onPress={() => navigation.goBack()}>Voltar</Botao>
  </Pagina>;
}

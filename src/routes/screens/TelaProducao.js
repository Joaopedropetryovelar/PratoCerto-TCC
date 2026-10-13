import CartaoRefeicao from '../../components/CartaoRefeicao';
import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Alert } from '../../components/Alerta';
import Calendario from '../../components/Calendario';
import { Botao, Campo, Carregando, Falha, Filtros, Pagina, ui } from '../../components/Interface';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import { salvarProducao } from '../../services/producao';
import { agoraAplicativo } from '../../services/demo';
import { dataDaEscola } from '../../domain/refeicoes';
import { dataValida, formularioDoRegistro, kg, registroValido, resumirProducao, TURNOS, validarProducao } from '../../domain/producao';

const PESOS = [
  ['preparadoKg', 'Quantidade preparada (kg)', 'Peso total dos alimentos prontos para servir.'],
  ['sobraLimpaKg', 'Sobra limpa (kg)', 'Alimento que não foi servido e foi separado para possível aproveitamento.'],
  ['sobraDescartadaKg', 'Sobra descartada (kg)', 'Alimento não servido que foi efetivamente descartado.'],
  ['restosKg', 'Restos dos pratos (kg)', 'Alimento devolvido nos pratos e descartado.'],
];

export default function TelaProducao() {
  const hoje = dataDaEscola(agoraAplicativo());
  const [dataEscolhida, setDataEscolhida] = useState(hoje);
  const [turno, setTurno] = useState('todos');
  const [selecionada, setSelecionada] = useState(null);
  const [formulario, setFormulario] = useState(formularioDoRegistro(null));
  const [erros, setErros] = useState({});
  const [erroSalvar, setErroSalvar] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const bloqueio = useRef(false);
  const focada = useIsFocused();
  const perfil = usePerfil();
  const pratos = useColecaoEscola('NomePratos', perfil.perfil, [['data', '==', dataEscolhida]]);
  const registros = useColecaoEscola('producao', perfil.perfil, [['data', '==', dataEscolhida]]);
  const falhou = perfil.erro || pratos.erro || registros.erro;
  const carregando = perfil.carregando || pratos.carregando || registros.carregando;
  const daEscola = (item) => item.escola === perfil.perfil?.escola;
  const resultados = registros.dados.filter(daEscola);

  function voltar() {
    if (bloqueio.current) return;
    const inicial = formularioDoRegistro(selecionada?.registro);
    if (JSON.stringify(inicial) !== JSON.stringify(formulario)) {
      Alert.alert('Sair da edição?', 'As alterações ainda não salvas serão perdidas.', [{ text: 'Continuar editando', style: 'cancel' }, { text: 'Sair', onPress: () => setSelecionada(null) }]);
    } else setSelecionada(null);
  }
  useEffect(() => {
    if (!selecionada || !focada) return;
    const assinatura = BackHandler.addEventListener('hardwareBackPress', () => { voltar(); return true; });
    return () => assinatura.remove();
  }, [selecionada, focada, formulario]);

  function abrir(refeicao) {
    const registro = resultados.find((item) => item.refeicaoId === refeicao.id) || null;
    setSelecionada({ refeicao, registro });
    setFormulario(formularioDoRegistro(registro));
    setErros({}); setErroSalvar(null);
  }
  async function salvar() {
    if (bloqueio.current || !selecionada) return;
    const validacao = validarProducao(formulario, selecionada.refeicao, agoraAplicativo());
    setErros(validacao.erros);
    if (!validacao.valido) return;
    bloqueio.current = true;
    setSalvando(true); setErroSalvar(null);
    try {
      await salvarProducao({ refeicaoId: selecionada.refeicao.id, formulario, revisaoEsperada: selecionada.registro?.revisao || 0 });
      setSelecionada(null);
      Alert.alert('Produção registrada', 'As quantidades foram salvas e os relatórios foram atualizados.');
    } catch (erro) { setErroSalvar(erro.message || 'Não foi possível salvar o registro.'); }
    finally { bloqueio.current = false; setSalvando(false); }
  }
  function tentarNovamente() { perfil.tentarNovamente(); pratos.tentarNovamente(); registros.tentarNovamente(); }
  const lista = pratos.dados.filter((item) => daEscola(item) && (turno === 'todos' || item.turno === turno) && (item.ativo !== false || resultados.some((registro) => registro.refeicaoId === item.id)));
  const validacao = selecionada ? validarProducao(formulario, selecionada.refeicao, agoraAplicativo()) : null;
  const previsao = validacao?.valido ? resumirProducao([{ ...validacao.dados, schemaVersion: formulario.modo === 'rapido' ? 2 : 1, data: selecionada.refeicao.data, turno: selecionada.refeicao.turno, refeicaoId: selecionada.refeicao.id }]) : null;

  return <Pagina titulo={selecionada ? 'Registrar produção' : 'Produção e sobras'} subtitulo={selecionada ? `${selecionada.refeicao.nome} · ${dataEscolhida.split('-').reverse().join('/')}` : 'Registre quantas refeições foram servidas e quanto alimento sobrou.'}>
    {carregando ? <Carregando /> : falhou ? <Falha tentarNovamente={tentarNovamente} /> : perfil.perfil?.tipoConta !== 'admin' ? <Falha mensagem="Esta área é exclusiva da equipe." tentarNovamente={perfil.tentarNovamente} /> : selecionada ? <>
      {selecionada.registro?.schemaVersion !== 1 && !selecionada.registro?.preparadoG ? <Filtros label="Tipo de registro" opcoes={[{id:'rapido',nome:'Registro rápido',disabled:salvando},{id:'detalhado',nome:'Pesagem detalhada',disabled:salvando}]} valor={formulario.modo} onChange={modo => setFormulario(f => ({...f, modo}))} /> : <Text style={ui.pequeno}>Este registro conserva suas pesagens detalhadas.</Text>}
      <View style={[ui.card, ui.aviso]}><Text style={ui.texto}>{formulario.modo === 'rapido' ? 'Informe a quantidade de refeições servidas e pese o alimento que ficou sem servir. A sobra não será considerada descarte automaticamente.' : 'Pese cada categoria separadamente. Desconte o peso dos recipientes e informe 0 quando não houver sobra ou restos.'}</Text></View>
      <View style={ui.card}>
        {formulario.modo === 'rapido' ? <Campo testID="sobraTotalKg" label="Quantidade que sobrou (kg)" ajuda="Alimento que ficou sem servir. Ex.: 30 kg. Informe 0 se não sobrou." value={formulario.sobraTotalKg} onChangeText={valor => setFormulario(f => ({...f, sobraTotalKg: valor}))} keyboardType="decimal-pad" editable={!salvando} erro={erros.sobraTotalKg} /> : PESOS.map(([campo, label, ajuda]) => <Campo key={campo} testID={campo} label={label} ajuda={ajuda} placeholder="Ex.: 12,500" keyboardType="decimal-pad" editable={!salvando} value={formulario[campo]} onChangeText={(valor) => setFormulario((anterior) => ({ ...anterior, [campo]: valor }))} erro={erros[campo]} />)}
        {erros.pesos ? <Text accessibilityRole="alert" style={ui.erro}>{erros.pesos}</Text> : null}
        <Campo testID="servidos" label="Quantidade servida (refeições)" ajuda="Número de refeições efetivamente servidas, não de confirmações." keyboardType="number-pad" editable={!salvando} value={formulario.servidos} onChangeText={(valor) => setFormulario((anterior) => ({ ...anterior, servidos: valor }))} erro={erros.servidos} />
        <Campo label="Observação (opcional)" multiline maxLength={500} editable={!salvando} value={formulario.observacao} onChangeText={(valor) => setFormulario((anterior) => ({ ...anterior, observacao: valor }))} erro={erros.observacao} />
        {erros.refeicao ? <Text style={ui.erro}>{erros.refeicao}</Text> : null}
      </View>
      {previsao ? <View style={ui.card}><Text style={ui.secao}>Conferência antes de salvar</Text><Text style={ui.texto}>{previsao.servidos} refeições servidas · {kg(previsao.sobrasG)} kg de sobra</Text>{previsao.medidos ? <><Text style={ui.texto}>Descarte total: {kg(previsao.descarteG)} kg</Text><Text style={ui.texto}>Taxa de descarte: {previsao.percentualDescarte.toFixed(1).replace('.', ',')}%</Text><Text style={ui.pequeno}>A sobra limpa permanece separada do descarte.</Text></> : null}</View> : null}
      {erroSalvar ? <View style={ui.card}><Text accessibilityRole="alert" style={ui.erro}>{erroSalvar}</Text><Botao secundario disabled={salvando} onPress={() => Alert.alert('Recarregar registro?', 'Isso substitui os valores não salvos pelos valores atuais.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Recarregar', onPress: () => abrir(selecionada.refeicao) }])}>Recarregar registro</Botao></View> : null}
      <Botao testID="salvar-producao" onPress={salvar} carregando={salvando}>Salvar produção</Botao>
      <Botao secundario disabled={salvando} onPress={voltar}>Voltar à lista</Botao>
    </> : <>
      <Calendario label="Data da refeição" value={dataEscolhida} onChange={setDataEscolhida} max={hoje} marcadas={resultados.map(r=>r.data)} />
      <Filtros label="Turno" opcoes={TURNOS} valor={turno} onChange={setTurno} />
      {!lista.length ? <View style={ui.card}><Text style={ui.secao}>Nenhuma refeição nesta seleção</Text><Text style={ui.texto}>Cadastre o cardápio ou consulte uma data com refeições já publicadas.</Text></View> : lista.map((refeicao) => {
        const registro = resultados.find((item) => item.refeicaoId === refeicao.id);
        return <CartaoRefeicao key={refeicao.id} nome={refeicao.nome}><Text style={ui.selo}>{TURNOS.find((item) => item.id === refeicao.turno)?.nome || 'Turno'}</Text><Text style={ui.secao}>{refeicao.nome}</Text>
          <Text style={ui.texto}>{registro ? registroValido(registro) ? `${registro.servidos} refeições servidas · ${kg(registro.schemaVersion === 2 ? registro.sobraTotalG : registro.sobraLimpaG + registro.sobraDescartadaG)} kg de sobra` : 'Este registro precisa de correção nas pesagens.' : 'Quantidades ainda não registradas.'}</Text>
          {refeicao.ativo === false ? <Text style={ui.pequeno}>Refeição arquivada · histórico preservado</Text> : null}
          <Botao testID={`abrir-${refeicao.id}`} onPress={() => abrir(refeicao)}>{registro ? 'Editar quantidades' : 'Registrar produção'}</Botao>
        </CartaoRefeicao>;
      })}
    </>}
  </Pagina>;
}

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Campo, Filtros, ui } from './Interface';
import { OPCOES_RESTRICOES } from '../domain/restricoes';

export default function FormularioRestricoes({ valor, onChange, erros = {}, disabled = false }) {
  function mudar(patch) { onChange({ ...valor, ...patch, autorizou: false }); }
  function situacao(id) { mudar({ situacao: id, itens: [], outra: '', declarante: '', nomeResponsavel: '' }); }
  function alternar(id) { const itens = valor.itens.includes(id) ? valor.itens.filter((v) => v !== id) : [...valor.itens, id]; mudar({ itens, outra: itens.includes('outra') ? valor.outra : '' }); }
  return <View style={ui.card}>
    <Text style={ui.secao}>Restrições alimentares</Text>
    <Text style={ui.texto}>Informação opcional para o planejamento e atendimento das refeições pela equipe autorizada da sua escola. Você pode informar depois, atualizar ou retirar estes dados no perfil.</Text>
    <Filtros vertical label="Como deseja informar?" opcoes={[
      { id: 'nao_informado', nome: 'Prefiro informar depois', disabled },
      { id: 'nenhuma', nome: 'Não há restrições a informar', disabled },
      { id: 'informadas', nome: 'Há restrições alimentares', disabled },
    ]} valor={valor.situacao} onChange={situacao} />
    {erros.situacao ? <Text style={ui.erro}>{erros.situacao}</Text> : null}
    {valor.situacao !== 'nao_informado' ? <>
      {valor.situacao === 'informadas' ? <>
        <Text style={ui.pequeno}>Intolerância à lactose e alergia ao leite são informações diferentes. Registre o que já foi identificado; o aplicativo não faz diagnóstico nem garante que um prato seja adequado.</Text>
        {OPCOES_RESTRICOES.map((opcao) => <TouchableOpacity key={opcao.id} testID={`restricao-${opcao.id}`} accessibilityRole="checkbox" accessibilityState={{ checked: valor.itens.includes(opcao.id), disabled }} disabled={disabled} onPress={() => alternar(opcao.id)} style={[ui.filtro, { paddingVertical: 12 }, valor.itens.includes(opcao.id) && { borderColor: '#23624B', backgroundColor: '#EAF2EC' }]}><Text style={ui.texto}>{valor.itens.includes(opcao.id) ? '☑' : '☐'} {opcao.nome}</Text></TouchableOpacity>)}
        {erros.itens ? <Text style={ui.erro}>{erros.itens}</Text> : null}
        {valor.itens.includes('outra') ? <Campo testID="restricao-outra" label="Qual é a outra restrição?" ajuda="Informe somente a restrição alimentar. Não envie laudos nem histórico médico." value={valor.outra} onChangeText={(outra) => mudar({ outra })} maxLength={120} editable={!disabled} erro={erros.outra} /> : null}
      </> : null}
      <Filtros vertical label="Quem está preenchendo esta informação?" opcoes={[
        { id: 'titular_adulto', nome: 'Sou o aluno e tenho 18 anos ou mais', disabled },
        { id: 'responsavel', nome: 'Sou o responsável legal pelo aluno', disabled },
      ]} valor={valor.declarante} onChange={(declarante) => mudar({ declarante, nomeResponsavel: '' })} />
      {erros.declarante ? <Text style={ui.erro}>{erros.declarante}</Text> : null}
      {valor.declarante === 'responsavel' ? <Campo testID="nome-responsavel" label="Nome do responsável legal" value={valor.nomeResponsavel} onChangeText={(nomeResponsavel) => mudar({ nomeResponsavel })} maxLength={100} editable={!disabled} erro={erros.nomeResponsavel} /> : null}
      <Text style={ui.pequeno}>Se o aluno for menor de idade, peça ao responsável legal para preencher. A escola precisa conferir as informações antes de adaptar o atendimento.</Text>
      <TouchableOpacity testID="autorizar-restricoes" accessibilityRole="checkbox" accessibilityState={{ checked: valor.autorizou, disabled }} disabled={disabled} onPress={() => onChange({ ...valor, autorizou: !valor.autorizou })} style={[ui.card, { padding: 16 }]}><Text style={ui.texto}>{valor.autorizou ? '☑' : '☐'} Autorizo especificamente o uso destas informações de saúde pela equipe autorizada da escola para planejar e atender as refeições, incluindo as estatísticas internas. Sei que posso atualizar ou retirar esta declaração no perfil.</Text></TouchableOpacity>
      {erros.autorizacao ? <Text style={ui.erro}>{erros.autorizacao}</Text> : null}
    </> : null}
  </View>;
}

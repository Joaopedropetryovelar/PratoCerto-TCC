import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Carregando, Falha, Filtros, ui } from './Interface';
import { useDocumento } from '../hooks/useDados';
import { ESCOLAS, chaveEscola } from '../domain/escolas';

export default function AvisoInstitucional({ escolaInicial }) {
  const [escola,setEscola] = useState(escolaInicial || ESCOLAS[0]);
  const dados = useDocumento('configuracoesEscola', chaveEscola(escola));
  return <View style={ui.card}><Text style={ui.secao}>Responsável e atendimento</Text>
    {!escolaInicial ? <Filtros vertical label="Instituição" valor={escola} onChange={setEscola} opcoes={ESCOLAS.map(id => ({id,nome:id}))} /> : null}
    {dados.carregando ? <Carregando /> : dados.erro ? <Falha mensagem={dados.erro} tentarNovamente={dados.tentarNovamente} /> : dados.dados ? <>
      <Text style={ui.label}>{dados.dados.controlador}</Text><Text selectable style={ui.texto}>Contato: {dados.dados.contato}</Text>
      <Text style={ui.label}>Finalidades e bases legais</Text><Text style={ui.texto}>{dados.dados.baseLegal}</Text>
      <Text style={ui.label}>Conservação dos dados</Text><Text style={ui.texto}>{dados.dados.retencao}</Text>
    </> : <Text style={ui.texto}>A direção de {escola} ainda precisa publicar o contato e os critérios de tratamento dos dados. Procure a instituição para obter essas informações.</Text>}
  </View>;
}
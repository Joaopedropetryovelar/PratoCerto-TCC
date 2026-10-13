import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Alert } from '../../components/Alerta';
import { Botao, Filtros, Pagina, ui } from '../../components/Interface';
import { ESCOLAS } from '../../domain/escolas';
import { demoStore, entrarDemonstracao } from '../../services/demo';
export default function TelaDemonstracao({ navigation }) {
  const [escola,setEscola]=useState(ESCOLAS[0]);const [turno,setTurno]=useState('multi');const [ocupado,setOcupado]=useState(false);const bloqueio=useRef(false);
  async function executar(acao){if(bloqueio.current)return;bloqueio.current=true;setOcupado(true);try{await acao();}catch(e){Alert.alert('Não foi possível concluir',e.message);}finally{bloqueio.current=false;setOcupado(false);}}
  async function entrar(tipo){await entrarDemonstracao(tipo,turno,escola);navigation.reset({index:0,routes:[{name:tipo==='admin'?'HomeAdmin':'HomeAluno'}]});}
  return <Pagina estreita titulo="Teste sem conta" subtitulo="Conheça o aplicativo com dados fictícios das duas escolas.">
    <View style={[ui.card,ui.aviso]}><Text style={ui.texto}>Os dados ficam apenas neste aparelho. Use a mesma instalação para comparar aluno e equipe.</Text><Text style={ui.pequeno}>O botão Trocar horário alterna 08:00 (confirmar) e 21:00 (avaliar após as refeições). Os cardápios mostram somente dias úteis. Em fins de semana, a demonstração simula a próxima segunda-feira.</Text></View>
    <Filtros vertical label="Escola de demonstração" opcoes={ESCOLAS.map((s)=>({id:s,nome:s}))} valor={escola} onChange={setEscola}/>
    <Filtros label="Turnos do aluno" opcoes={[{id:'multi',nome:'Manhã e tarde'},{id:'manha',nome:'Manhã'},{id:'tarde',nome:'Tarde'},{id:'noite',nome:'Noite'}]} valor={turno} onChange={setTurno}/>
    <Botao testID="demo-aluno" carregando={ocupado} onPress={()=>executar(()=>entrar('aluno'))}>Entrar como aluno</Botao><Botao testID="demo-equipe" secundario disabled={ocupado} onPress={()=>executar(()=>entrar('admin'))}>Entrar como equipe</Botao>
    <Botao secundario disabled={ocupado} onPress={()=>Alert.alert('Restaurar exemplos?','Substitui somente as alterações locais da demonstração desta versão.',[{text:'Cancelar',style:'cancel'},{text:'Restaurar',onPress:()=>executar(async()=>{await demoStore.restaurar();Alert.alert('Exemplos restaurados','Os dados fictícios foram recriados.');})}])}>Restaurar dados de exemplo</Botao>
    <Botao secundario disabled={ocupado} onPress={()=>navigation.goBack()}>Voltar</Botao>
  </Pagina>;
}

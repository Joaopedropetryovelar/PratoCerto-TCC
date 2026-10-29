import AvisoInstitucional from '../../components/AvisoInstitucional';
import { SafeAreaView } from "react-native-safe-area-context";
import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const POLITICA = [
  {
    titulo: '1. Quais dados coletamos',
    texto:
      'O cadastro utiliza nome, matrícula, e-mail, escola, turma e turnos. A matrícula precisa estar previamente autorizada pela equipe da escola. O aluno informa e confirma o próprio e-mail ao criar a conta; a equipe pode liberar matrículas em lote sem cadastrar os e-mails. As confirmações e avaliações ficam vinculadas à sua conta. A senha é gerenciada pelo Firebase Authentication e não é gravada no perfil escolar. As restrições alimentares são opcionais e ficam em um registro separado, com autorização específica.',
  },
  {
    titulo: '2. Como usamos seus dados',
    texto:
      'Os dados identificam sua conta e vinculam suas respostas à escola. A equipe autorizada da sua escola pode consultar suas confirmações e avaliações identificadas. Outros alunos não têm acesso às suas respostas. Os relatórios de produção registram quantidades, sem uma lista de nomes dos alunos.',
  },
  {
    titulo: '3. Compartilhamento de dados',
    texto:
      'O aplicativo utiliza Firebase Authentication e Cloud Firestore, serviços do Google, para autenticação e armazenamento. O Authentication processa dados nos Estados Unidos. Outros locais de processamento dependem do serviço e da configuração da instituição. O compartilhamento e a transferência internacional devem ser avaliados pela instituição responsável.',
  },
  {
    titulo: '4. Seus direitos',
    texto:
      'O usuário ou responsável pode solicitar acesso, correção, exclusão, anonimização e outras providências pelos canais definidos pela instituição. O perfil do aluno possui uma opção de pedido sobre dados pessoais, registrada para a equipe da própria escola. O status, a resposta e o histórico do atendimento ficam disponíveis no perfil do aluno e para a equipe autorizada. As restrições alimentares podem ser atualizadas ou retiradas no perfil. A retirada remove a declaração do registro ativo, sem excluir a conta e o histórico de refeições. Você pode obter uma cópia dos dados no perfil. A direção pode executar exclusão da conta e dos dados alimentares; as respostas são transformadas em registros operacionais sem nome, matrícula, e-mail ou comentário. Um comprovante mínimo do atendimento é conservado conforme os critérios publicados pela instituição.',
  },
  {
    titulo: '5. Informações alimentares e de saúde',
    texto:
      'Intolerâncias e alergias são informações de saúde sensíveis. O preenchimento é opcional, deve ser feito pelo aluno adulto ou responsável legal e exige autorização específica para o planejamento e atendimento das refeições e estatísticas internas. Somente o próprio aluno e a equipe autorizada da sua escola podem acessar o registro. A tela de estatísticas apresenta totais, sem nomes ou relatos. A instituição deve validar a identidade do declarante e as informações antes de adaptar o atendimento; o aplicativo não faz diagnóstico nem garante a adequação de um prato.',
  },
  {
    titulo: '6. Segurança',
    texto:
      'São adotadas medidas de segurança para reduzir riscos de acesso, alteração ou divulgação não autorizada dos dados armazenados.',
  },
];

export default function PoliticaPrivacidadeScreen({ navigation }) {
  function voltar() {
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F6FAF1"
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={voltar}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Política de Privacidade
        </Text>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <AvisoInstitucional />
        <View style={styles.card}>
          {POLITICA.map((item) => (
            <View
              key={item.titulo}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>
                {item.titulo}
              </Text>

              <Text style={styles.text}>
                {item.texto}
              </Text>
            </View>
          ))}

          <View style={styles.versionBox}>
            <Text style={styles.version}>
              Versão: 2026-10-13
            </Text>

            <Text style={styles.version}>
              Atualização: 13/10/2026.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={voltar}
        >
          <Text style={styles.buttonText}>
            Voltar
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6FAF1',
  },

  header: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },

  backButton: {
    width: 40,
  },

  backText: {
    fontSize: 38,
    lineHeight: 40,
    color: '#204A37',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '800',
    color: '#101810',
  },

  headerSpace: {
    width: 40,
  },

  container: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E9DA',
    padding: 20,
    marginTop: 10,
  },

  section: {
    marginBottom: 19,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#101810',
    marginBottom: 7,
  },

  text: {
    fontSize: 14,
    lineHeight: 21,
    color: '#303C32',
  },

  versionBox: {
    marginTop: 3,
  },

  version: {
    fontSize: 12,
    lineHeight: 18,
    color: '#69756B',
  },

  button: {
    backgroundColor: '#2F6B4F',
    borderRadius: 17,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
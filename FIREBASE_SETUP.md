# Instalar as alterações no Firebase

Use o projeto Firebase já utilizado pelo aplicativo. A configuração e os números de versão foram preservados.

## Pré-requisitos

Ter acesso administrativo ao projeto Firebase, permissão de publicação e um plano que permita as Cloud Functions utilizadas. Execute os comandos com uma conta autorizada. O código não publica nem altera os dados do ambiente de produção por conta própria.

```bash
npm ci
npm ci --prefix functions
npx firebase login
npx firebase use --add
```

## Publicação

Publique as funções antes de distribuir a atualização do aplicativo e publique as regras junto com ela:

```bash
npx firebase deploy --only functions,firestore:rules,firestore:indexes
```

Funções: `convidarAdministrador`, `alterarAcessoEquipe`, `obterMeusDados`, `executarExclusaoDados`. A região continua `southamerica-east1`.

As regras novas exigem histórico na mesma operação de publicação/edição do cardápio e ciência do aviso no cadastro novo. Clientes antigos que gravam sem esses campos não são compatíveis com essas novas gravações: atualize os aparelhos junto com as regras. Dados existentes não são migrados ou apagados durante a instalação.

## Configuração pela direção

1. Abra o menu lateral da direção → Privacidade da instituição.
2. Informe instituição responsável, contato, finalidades/bases legais e critérios de conservação definidos pela escola. Não use textos de exemplo como decisões jurídicas.
3. Defina como conferir a identidade do aluno e do responsável por declarações de saúde. O vínculo opcional de e-mail da matrícula restringe o cadastro ao e-mail informado; matrículas sem vínculo continuam aceitando e-mail autodeclarado.
4. Use contas individuais em Equipe da direção; a desativação bloqueia as regras e o Firebase Authentication. Se uma etapa de autenticação falhar, repita a operação para sincronizar.

## Pedidos de privacidade

O aluno pode solicitar cópia, correção, exclusão ou retirada de identificação das respostas. A direção analisa o pedido e executa a providência apropriada.

- Cópia: o próprio aluno obtém o arquivo JSON no perfil, sem senha ou credenciais de autenticação.
- Correção: feita no perfil ou pelo procedimento da instituição; não há alteração automática de matrícula/escola.
- Retirada de identificação: remove o UID original, nomes, turma e comentários das respostas anteriores; conta e declaração alimentar são mantidas.
- Exclusão: bloqueia a conta, retira identificadores e textos livres das respostas, remove declaração alimentar, perfil, autorização de matrícula, histórico pessoal do pedido e conta Auth. Conserva registros operacionais e um comprovante mínimo do atendimento. Cabe à escola avaliar se essa conservação é adequada e por quanto tempo.
- Uma execução interrompida mantém o pedido bloqueado para edições comuns; aguarde três minutos e retome pelo mesmo botão. Não marque manualmente como concluído uma exclusão que ainda está em execução.

Não confunda retirada de identificação direta com garantia de anonimização absoluta: grupos pequenos e contexto ainda precisam de avaliação institucional.

## Testar localmente

```bash
npx firebase emulators:exec --only auth,firestore --project demo-pratocerto "node --test tests/regras/melhorias.test.cjs tests/regras/gestao.test.cjs"
```

Para exercitar chamadas de funções pela interface, execute também o emulador de Functions e abra o Expo com `EXPO_PUBLIC_USAR_EMULADORES=1`. O cliente de funções usa a porta 5001 e o mesmo host local configurado para os demais emuladores. Nunca use dados reais nos exemplos locais.

## Convite de novos administradores

Publique a função `convidarAdministrador` atualizada para que uma nova tentativa possa recuperar o convite de uma conta administrativa ativa da mesma escola. Ela não promove contas existentes de alunos e não reassocia contas de outras escolas.

```bash
npx firebase deploy --only functions:convidarAdministrador
```

No aplicativo: menu lateral → Equipe da direção → Autorizar novo administrador. A direção informa nome/e-mail; o novo integrante recebe o link de definição da própria senha. Se a confirmação do e-mail ainda for necessária após o primeiro acesso, o app envia essa verificação e mantém o acesso bloqueado até a confirmação.
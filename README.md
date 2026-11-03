# Study Flow

O Study Flow é um aplicativo móvel para organizar atividades escolares, acompanhar prazos e registrar o progresso dos estudos. O projeto usa React Native com Expo e Firebase Authentication e Cloud Firestore.

## Problema

Estudantes podem ter dificuldade para reunir em um só lugar as tarefas, datas de entrega, matérias e notas. Professores também precisam de uma forma simples de compartilhar atividades com seus estudantes. Quando essas informações ficam espalhadas entre cadernos, mensagens e outros canais, fica mais difícil acompanhar o que precisa ser feito e o que já foi concluído.

## Justificativa

Centralizar atividades e resultados ajuda estudantes a planejar a rotina e acompanhar seu próprio progresso. Para professores, publicar atividades em um espaço compartilhado facilita a comunicação das tarefas. A separação dos dados por conta também permite que cada estudante acompanhe suas próprias conclusões e notas.

## Público-alvo

- **Estudantes**, que organizam atividades pessoais e acompanham atividades publicadas por professores.
- **Professores**, que publicam atividades compartilhadas com os usuários do aplicativo.

## Proposta de solução

O aplicativo oferece telas para autenticação, visualização de atividades, cadastro e edição de tarefas, calendário mensal e acompanhamento de resultados por matéria. O Firebase Authentication gerencia contas com e-mail e senha. O Cloud Firestore armazena perfis, atividades e resultados individuais.

## Requisitos funcionais

- **RF-01 — Criar conta:** permitir o cadastro com nome, e-mail e senha. Contas novas recebem o perfil de estudante.
- **RF-02 — Entrar e sair:** permitir autenticação por e-mail e senha e encerrar a sessão atual.
- **RF-03 — Carregar perfil:** identificar a pessoa autenticada e apresentar seu nome e seu perfil no aplicativo.
- **RF-04 — Atribuir perfil de professor:** permitir que uma pessoa administradora libere o perfil de professor no documento do usuário no Firestore. O usuário não pode promover a própria conta pelo aplicativo.
- **RF-05 — Listar atividades visíveis:** mostrar a todos os usuários autenticados as atividades globais e mostrar a cada usuário suas próprias atividades privadas.
- **RF-06 — Cadastrar atividade:** permitir que estudantes criem atividades privadas e que professores publiquem atividades globais.
- **RF-07 — Informar dados da atividade:** permitir informar título, matéria selecionada, descrição, data e horário.
- **RF-08 — Editar e excluir atividades:** permitir que a pessoa criadora edite ou exclua sua atividade, respeitando as permissões definidas para atividades privadas e globais.
- **RF-09 — Consultar calendário:** permitir navegar entre meses, selecionar uma data e ver as atividades daquele dia.
- **RF-10 — Consultar notas por matéria:** agrupar atividades por matéria e apresentar notas e médias.
- **RF-11 — Filtrar atividades:** permitir alternar entre todas as atividades visíveis e somente as concluídas.
- **RF-12 — Registrar conclusão:** permitir que cada usuário marque ou desmarque a conclusão de uma atividade. O progresso de atividades globais é individual.
- **RF-13 — Registrar nota:** permitir que cada estudante registre uma nota de 0 a 10 nas próprias atividades e nas atividades globais, sem alterar a nota de outro usuário.
- **RF-14 — Proteger dados por usuário:** restringir a leitura e a alteração de atividades privadas e resultados conforme as regras do Cloud Firestore.

## Principais telas

### Login e cadastro — `screens/login.js`

Permite entrar com e-mail e senha ou criar uma conta. Os cadastros feitos pelo aplicativo recebem inicialmente o perfil de estudante. A tela apresenta mensagens para erros comuns de autenticação.

### Início — `screens/inicio.js`

Mostra o nome e o perfil da pessoa conectada, um resumo das atividades e as próximas tarefas. A partir dela é possível abrir o calendário, as notas, cadastrar uma atividade ou sair da conta.

### Cadastro de atividade — `screens/cadastrar.js`

Permite informar título, matéria, descrição, data e horário. Estudantes podem registrar uma nota de 0 a 10 em suas atividades pessoais. Professores publicam atividades compartilhadas; cada usuário registra seu próprio progresso e sua nota.

### Calendário — `screens/calendario.js`

Apresenta um calendário mensal interativo. Ao escolher um dia, a tela lista as atividades correspondentes. É possível navegar entre meses e abrir o cadastro para a data selecionada. A edição e a exclusão ficam disponíveis para quem criou a atividade.

### Notas — `screens/notas.js`

Agrupa as atividades por matéria e mostra notas, médias e conclusões. Os filtros permitem ver todas as atividades ou somente as concluídas. Cada usuário pode registrar a própria conclusão e nota para atividades compartilhadas.

## Fluxos principais

1. **Autenticação:** ao abrir o aplicativo, o estado da sessão do Firebase é carregado. A pessoa entra com sua conta ou cria uma nova.
2. **Cadastro de estudante:** o Firebase Authentication cria a conta e o Firestore cria `usuarios/{uid}` com nome, e-mail e `tipo: "estudante"`.
3. **Liberação de professor:** o perfil de professor não pode ser escolhido no cadastro público. Uma pessoa administradora altera o campo `tipo` do documento `usuarios/{uid}` para `"professor"` pelo Console do Firebase. A alteração é carregada ao entrar novamente.
4. **Atividade de estudante:** o estudante cria uma atividade privada, visível apenas para a própria conta.
5. **Atividade de professor:** o professor cria uma atividade global, visível para todas as contas autenticadas.
6. **Acompanhamento:** conclusões e notas são gravadas separadamente por usuário, inclusive quando a atividade foi publicada por um professor.
7. **Saída:** a opção “Sair” encerra a sessão do Firebase e volta à tela de login.

## Perfis e permissões

As regras do Firestore devem estar publicadas no Console do Firebase. A tabela descreve o comportamento implementado pelo aplicativo e esperado pelas regras.

| Ação | Estudante | Professor |
| --- | --- | --- |
| Ler atividades globais | Sim | Sim |
| Ler atividade privada de outra pessoa | Não | Não |
| Criar atividade privada própria | Sim | Sim, pelas regras; a tela de professor publica atividades globais |
| Criar atividade global | Não | Sim |
| Editar ou excluir atividade privada própria | Sim | Sim, se for a pessoa que criou |
| Editar ou excluir atividade global | Não | Sim, se for quem publicou |
| Registrar conclusão e nota próprias | Sim | Pode registrar o próprio progresso |
| Ler ou alterar resultados de outra pessoa | Não | Não |
| Alterar o próprio tipo para professor pelo app | Não | Não |

Os resultados ficam em `usuarios/{uid}/resultados/{atividadeId}`, então estudantes e professores só leem e alteram seus próprios documentos de resultado. O professor não lança notas para estudantes nesta versão; cada estudante registra a própria nota. Atividades globais são compartilhadas com todos os usuários autenticados, sem separação por turma.

## Estrutura dos dados no Firestore

- `usuarios/{uid}`: `nome`, `email` e `tipo` (`estudante` ou `professor`).
- `atividades/{atividadeId}`: `titulo`, `materia`, `descricao`, `data`, `horario`, `visibilidade` (`global` ou `privada`) e `criadoPor` (UID da pessoa criadora).
- `usuarios/{uid}/resultados/{atividadeId}`: `concluida` (booleano) e `nota` (número de 0 a 10 ou `null`).

O aplicativo consulta as atividades globais e as atividades criadas pela pessoa conectada separadamente, conforme as permissões do Firestore.

## Configuração e execução

1. Instale as dependências na pasta do projeto:

   ```bash
   npm install
   ```

2. Copie `firebase.example.js` para `firebase.js` e substitua os valores de exemplo pelos dados de configuração do app Web no Firebase Console. O arquivo `firebase.js` está no `.gitignore` e não deve ser enviado ao repositório.
3. No Firebase Console, habilite o provedor **E-mail/senha** no Authentication, crie o banco Cloud Firestore e publique regras compatíveis com os campos e coleções descritos neste README.
4. Inicie o Expo:

   ```bash
   npm start
   ```

## Tecnologias

- React Native
- Expo
- Firebase Authentication
- Cloud Firestore

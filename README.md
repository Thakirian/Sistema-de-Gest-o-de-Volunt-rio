# Sistema de Gestão de Voluntários

Este é um sistema web desenvolvido para o projeto de extensão "Quanto Amor Você Tem Para Dar" da UTFPR - Câmpus Cornélio Procópio. O sistema visa facilitar a gestão de voluntários e atividades, substituindo processos manuais e automatizando o registro de informações.

## Funcionalidades Principais:

**Cadastro de Voluntários:** Permite o registro de novos voluntários com informações pessoais e acadêmicas.
**Gestão de Oficinas e Atividades:** Coordenadores podem cadastrar, gerenciar e detalhar as atividades do projeto.
**Registro de Participação:** Voluntários podem registrar sua presença e função desempenhada nas atividades.
**Controle de Horas:** O sistema controla as horas dedicadas pelos voluntários às ações.
**Solicitação e Gerenciamento de Certificados:** Voluntários podem solicitar certificados de participação, e coordenadores podem aprovar ou rejeitar essas solicitações.
**Visualização de Histórico:** Voluntários podem consultar o histórico de suas solicitações e atividades participadas.
**Notificações:** Envio de notificações por e-mail para coordenadores sobre novas solicitações de certificados.

## Tecnologias Utilizadas:

**Frontend:** HTML5, CSS3, JavaScript.
**Backend:** Firebase (Firestore para banco de dados NoSQL e Firebase Authentication para autenticação de usuários).
**Metodologia de Desenvolvimento:** Feature-Driven Development (FDD), com foco em desenvolvimento incremental e entrega contínua de funcionalidades.
**Ferramentas de Modelagem e Design:** Astah (para diagramas UML), Figma (para prototipagem da interface).
**Gerenciamento de Projeto:** Trello.
**Controle de Versão:** Git e GitHub.

## Pré-requisitos

Antes de executar o projeto, é necessário ter os seguintes itens instalados em sua máquina:

**Node.js:** Versão 16 ou superior. Você pode baixá-lo em [https://nodejs.org](https://nodejs.org).
**Git:** (Opcional, apenas para clonar o repositório).
**Editor de Código:** Recomendamos o Visual Studio Code, disponível em [https://code.visualstudio.com/download](https://code.visualstudio.com/download).
**Conta Firebase:** Uma conta no Firebase com um projeto configurado, e os serviços de **Autenticação (Email/Senha)** e **Firestore** ativados.

## Como Executar o Projeto Localmente

Siga os passos abaixo para configurar e rodar o sistema em seu ambiente local:

1.  **Clonar o Repositório:**
    Se você ainda não tem o repositório localmente, abra o terminal e execute:
    ```bash
    git clone [https://github.com/BrendaBeatrizC/Sistema-de-Gestao-de-Voluntarios.git](https://github.com/BrendaBeatrizC/Sistema-de-Gestao-de-Voluntarios.git)
    cd Sistema-de-Gestao-de-Voluntarios
    ```
    *(Nota: Assumindo o URL do GitHub como `https://github.com/BrendaBeatrizC/Sistema-de-Gestao-de-Voluntarios.git` com base no contexto, por favor, verifique se este é o URL correto do seu repositório.)*

2.  **Instalar as Dependências:**
    Navegue até o diretório do projeto (`Sistema-de-Gestao-de-Voluntarios`) e instale todas as dependências necessárias:
    ```bash
    npm install
    ```

3.  **Configurar o Firebase:**
    * No console do Firebase, acesse as **Configurações do projeto** e encontre suas credenciais (geralmente em "Seus aplicativos" > "SDK setup and configuration").
    * Copie as informações de configuração do seu projeto Firebase (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId).
    * Abra o arquivo `src/firebase/firebase-config.js` no seu editor de código e substitua as credenciais existentes pelas suas.

4.  **Iniciar o Servidor de Desenvolvimento:**
    Com as dependências instaladas e o Firebase configurado, inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```

5.  **Acessar a Aplicação:**
    Após o servidor iniciar, você poderá acessar a aplicação em seu navegador. Para testar a funcionalidade de cadastro e a integração com o Firebase Auth e Firestore, utilize o seguinte link:
    ```
    http://localhost:5173/src/screens/cadastro/cadastro.html
    ```
    **Observação:** Este link é específico para a tela de cadastro e é ideal para testar a integração inicial do Firebase (autenticação e armazenamento de dados).

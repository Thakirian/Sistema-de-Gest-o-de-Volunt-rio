# Sistema de Gestão de Voluntários

Este é um sistema web desenvolvido para o projeto de extensão "Quanto Amor Você Tem Para Dar" da UTFPR - Câmpus Cornélio Procópio. O sistema visa facilitar a gestão de voluntários e atividades, substituindo processos manuais e automatizando o registro de informações.

## Funcionalidades Principais:

* **Cadastro de Voluntários:** Permite o registro de novos voluntários com informações pessoais e acadêmicas.
* **Gestão de Oficinas e Atividades:** Coordenadores podem cadastrar, gerenciar e detalhar as atividades do projeto, incluindo a adição de novos eventos e a definição de carga horária.
* **Registro de Participação:** Permite registrar a presença dos voluntários nas atividades e que eles informem a função desempenhada.
* **Controle de Horas:** O sistema controlará as horas trabalhadas pelos voluntários em cada atividade oferecida pelo projeto.
* **Solicitação e Gerenciamento de Certificados:** Voluntários podem solicitar certificados de participação diretamente pelo site, por meio de um botão que enviará automaticamente um e-mail para a universidade. Coordenadores podem aprovar ou rejeitar essas solicitações.
* **Visualização de Histórico:** Voluntários podem consultar o histórico completo de solicitações de atividades em que participaram, incluindo datas, oficinas e carga horária.
* **Notificações:** Envio de notificações por e-mail para o coordenador sempre que houver uma nova solicitação de certificado ou outra ação que exija análise.

## Tecnologias Utilizadas:

* **Frontend:** O desenvolvimento do front-end é realizado com HTML5, CSS3 e JavaScript.
* **Backend:** A lógica do sistema é construída utilizando a plataforma Firebase, que fornece serviços de autenticação, banco de dados (Firestore), regras de segurança e envio de notificações por e-mail.
* **Banco de Dados:** Firestore (NoSQL) é utilizado para o armazenamento das informações do sistema, como dados dos voluntários, atividades, registros de horas e solicitações de certificados.
* **Metodologia de Desenvolvimento:** Feature-Driven Development (FDD) é o modelo de ciclo de vida adotado, uma metodologia ágil que foca no desenvolvimento incremental e iterativo, priorizando a entrega contínua de funcionalidades específicas.
* **Ferramentas de Modelagem e Design:** Astah é utilizada para criar diagramas UML, e Figma para a criação dos protótipos da interface.
* **Gerenciamento de Projeto:** Trello é utilizado para organização das tarefas, controle de progresso e definição de prazos de entrega por fase.
* **Controle de Versão:** Git e GitHub são utilizados como ferramentas de versionamento e colaboração entre os desenvolvedores.

## Pré-requisitos

Antes de executar o projeto, é necessário ter os seguintes itens instalados em sua máquina:

* **Navegador Moderno:** Um navegador web moderno de sua preferência (e.g., Google Chrome, Mozilla Firefox).
* **Node.js:** Versão 16 ou superior. Você pode baixá-lo em [https://nodejs.org](https://nodejs.org).
* **Editor de Código:** Recomendamos o Visual Studio Code, disponível em [https://code.visualstudio.com/download](https://code.visualstudio.com/download).
* **Conta Firebase:** Uma conta no Firebase com um projeto configurado, e os serviços de **Autenticação (Email/Senha)** e **Firestore** ativados.

## Como Executar o Projeto Localmente

Siga os passos abaixo para configurar e rodar o sistema em seu ambiente local:

1.  **Clonar o Repositório:**
    Se você ainda não tem o repositório localmente, abra o terminal e execute:
    ```bash
    git clone [https://github.com/BrendaBeatrizC/Sistema-de-Gestao-de-Voluntarios.git](https://github.com/BrendaBeatrizC/Sistema-de-Gestao-de-Voluntarios.git)
    cd Sistema-de-Gestao-de-Voluntarios
    ```
    *(Nota: O link do GitHub do projeto é [Sistema de Gestão de Voluntários no GitHub](https://github.com/BrendaBeatrizC/Sistema-de-Gestao-de-Voluntarios).)*

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
    Após o servidor iniciar, você poderá acessar a aplicação em seu navegador. O sistema será iniciado no endereço padrão do Vite (geralmente `http://localhost:5173`). Para testar a funcionalidade de cadastro e a integração com o Firebase Auth e Firestore, utilize o seguinte link:
    ```
    http://localhost:5173/src/screens/cadastro/cadastro.html

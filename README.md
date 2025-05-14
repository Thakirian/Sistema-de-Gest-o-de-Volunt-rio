# Sistema de Gestão de Voluntários ![Group 11](https://github.com/user-attachments/assets/1b971359-b6c3-455b-b552-729b894a5d71)


Este é um sistema web desenvolvido para o **projeto "Quanto Amor Você Tem Para Dar"** (UTFPR-CP). O sistema visa facilitar a gestão de voluntários, incluindo funcionalidades como:
- Cadastro de voluntários.
- Registro de horas de participação.
- Organização de oficinas.
- Solicitação e gerenciamento de certificados.

Tecnologias utilizadas:
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Firebase (Firestore para banco de dados, Firebase Auth para autenticação)
- **Metodologia de Desenvolvimento**: Feature-Driven Development (FDD)


### Pré-requisitos

Antes de rodar o projeto, é necessário ter os seguintes itens instalados:

- **Node.js** (versão 16 ou superior)
- **Git** (opcional, apenas se for clonar o repositório)


### Clonando o Repositório

Se você não tem o repositório localmente, clone-o utilizando o comando:

```bash
git clone [URL_DO_REPOSITORIO]
cd [NOME_DO_PROJETO]


### Como Executar o Projeto Localmente

1. Após clonar o repositório, navegue até o diretório do projeto:

    ```bash
    cd [NOME_DO_PROJETO]
    ```

2. Instale as dependências do projeto:

    ```bash
    npm install
    ```

3. Instale as dependências específicas para Firebase e Vite:

    ```bash
    npm install firebase vite --save
    ```

4. Inicie o servidor de desenvolvimento:

    ```bash
    npm run dev
    ```

5. Acesse a aplicação no navegador:

    ```
    http://localhost:5173/src/screens/cadastro/cadastro.html
    ```

    **Obs**: Este link é apenas para testar o cadastro, incluindo a integração com o Firebase Auth e Firestore.


# Inicie o servidor de desenvolvimento
npm run dev

# Acesse a aplicação
Em seu navegador, abra:
http://localhost:5173/src/screans/cadastro/cadastro.html

OBS: esse é apenas para testar o cadastro - auth e firestore no firebase 

// src/screens/recuperar/recuperar.js
import { auth_mod } from "../../firebase/firebase-config.js";
import { sendPasswordResetEmail } from 'firebase/auth';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('recuperar-form');
    const emailInput = document.getElementById('email');
    const submitBtn = document.querySelector('.submit-button');
    // Elemento para exibir mensagens de feedback (sucesso ou erro)
    const recuperarMessageDisplay = document.getElementById('recuperar-message');

    // Verifica se os elementos essenciais existem antes de adicionar event listeners
    if (!form || !emailInput || !submitBtn || !recuperarMessageDisplay) {
        console.error('Elementos essenciais (formulário, input de e-mail, botão de submit ou display de mensagem) não encontrados no DOM!');
        return; // Sai da função se algo estiver faltando
    }

    form.addEventListener('submit', async function(event) {
        event.preventDefault(); // Impede o envio padrão do formulário, que recarregaria a página

        const email = emailInput.value.trim(); // Pega o valor do e-mail e remove espaços em branco

        // Limpa mensagens anteriores e remove classes de estilo para um novo feedback
        recuperarMessageDisplay.textContent = '';
        recuperarMessageDisplay.classList.remove('error-text', 'success-text');

        // Validação local básica do e-mail antes de enviar ao Firebase
        if (!email) {
            recuperarMessageDisplay.textContent = 'Por favor, insira seu e-mail.';
            recuperarMessageDisplay.classList.add('error-text');
            return; // Interrompe a execução se o e-mail estiver vazio
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Expressão regular para validar formato de e-mail
        if (!emailRegex.test(email)) {
            recuperarMessageDisplay.textContent = 'Por favor, insira um e-mail válido.';
            recuperarMessageDisplay.classList.add('error-text');
            return; 
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        try {
            // Função do Firebase para enviar o e-mail de redefinição de senha
            await sendPasswordResetEmail(auth_mod, email);

            const successText = 'Se a conta existir, um e-mail de redefinição de senha foi enviado para ' + email + '.';
            recuperarMessageDisplay.textContent = successText;
            recuperarMessageDisplay.classList.add('success-text'); // Aplica estilo de sucesso (verde)
            
            alert(successText); 
            
        } catch (error) {
            console.error("Erro ao recuperar senha:", error); 

            let errorMessage = "Ocorreu um erro ao enviar o e-mail de recuperação. Tente novamente.";

            // Tratamento de erros específicos do Firebase Auth
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/invalid-email':
                    
                    errorMessage = "Se a conta existir, um e-mail de redefinição de senha foi enviado."; 
                    break;
                case 'auth/missing-email':
                    errorMessage = "Por favor, insira um e-mail.";
                    break;
                case 'auth/too-many-requests':
                    errorMessage = "Muitas tentativas de envio. Tente novamente mais tarde.";
                    break;
                default:
                    errorMessage = error.message || "Ocorreu um erro inesperado.";
                    break;
            }
            recuperarMessageDisplay.textContent = errorMessage; 
            recuperarMessageDisplay.classList.add('error-text'); 
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Recuperar senha';
        }
    });
});
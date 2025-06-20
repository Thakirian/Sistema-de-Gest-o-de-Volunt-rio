import { auth_mod, db } from "../../firebase/firebase-config.js";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from "firebase/firestore";

const firestoreSettings = {
    experimentalForceLongPolling: true,
    merge: true
};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('cadastro-form');
    const emailError = document.getElementById('email-error');
    const senhaError = document.getElementById('senha-error');
    const submitBtn = document.querySelector('.submit-button');

    if (!form || !emailError || !senhaError || !submitBtn) {
        console.error('Elementos essenciais não encontrados no DOM para o Cadastro de Coordenador!');
        return;
    }

    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        submitBtn.disabled = true;
        submitBtn.textContent = 'Cadastrando...';

        emailError.textContent = '';
        senhaError.textContent = '';

        // Coleta os valores dos campos específicos do COORDENADOR
        const nome = document.getElementById('nome').value.trim();
        const departamento = document.getElementById('departamento').value.trim(); 
        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value;
        const confirmarSenha = document.getElementById('confirmarSenha').value;

        // Validações 
        let isValid = true;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            emailError.textContent = 'Por favor, insira um e-mail válido.';
            isValid = false;
        }

        if (senha !== confirmarSenha) {
            senhaError.textContent = 'As senhas não coincidem.';
            isValid = false;
        }

        const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!senhaRegex.test(senha)) {
            senhaError.textContent = 'A senha deve conter 8+ caracteres, incluindo maiúsculas, minúsculas e números.';
            isValid = false;
        }

        if (!isValid) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Cadastrar Coordenador';
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth_mod, email, senha);

            if (!auth_mod.currentUser) {
                throw new Error("Falha na autenticação após cadastro do coordenador");
            }

            await setDoc(
                doc(db, "coordenadores", userCredential.user.uid), 
                {
                    uid: userCredential.user.uid,
                    nome,
                    departamento,
                    email,
                    tipo: "coordenador",
                    dataCadastro: new Date()
                },
                firestoreSettings
            );

            alert('Cadastro de Coordenador realizado com sucesso! Você pode fazer login agora.');
            window.location.href = '../login/login.html';

        } catch (error) {
            console.error('Erro no Firebase (Cadastro Coordenador):', error);

            switch (error.code) {
                case 'auth/email-already-in-use':
                    emailError.textContent = 'Este e-mail já está cadastrado.';
                    break;
                case 'auth/invalid-email':
                    emailError.textContent = 'Formato de e-mail inválido.';
                    break;
                case 'auth/weak-password':
                    senhaError.textContent = 'A senha deve ter pelo menos 6 caracteres.';
                    break;
                case 'permission-denied':
                    alert('Erro de permissão. Verifique as regras do Firestore para a coleção "coordenadores".');
                    break;
                default:
                    alert('Erro: ' + (error.message || 'Ocorreu um erro inesperado no cadastro de coordenador.'));
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Cadastrar Coordenador';
        }
    });
});
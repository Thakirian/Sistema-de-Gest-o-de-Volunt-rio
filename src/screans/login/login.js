// src/screens/login/login.js
import { auth_mod, db } from "../../firebase/firebase-config.js";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const submitBtn = document.querySelector('.submit-button');
    const loginErrorDisplay = document.getElementById('login-error-message');


    if (!form || !submitBtn || !loginErrorDisplay) {
        console.error('Elementos essenciais (formulário, botão de submit ou display de erro) não encontrados no DOM!');
        return;
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value;

        loginErrorDisplay.textContent = ''; 

        submitBtn.disabled = true;
        submitBtn.textContent = 'Entrando...';

        try {
            const userCredential = await signInWithEmailAndPassword(auth_mod, email, senha);
            const user = userCredential.user;

            const [voluntarioSnap, coordSnap] = await Promise.all([
                getDoc(doc(db, "voluntarios", user.uid)),
                getDoc(doc(db, "coordenadores", user.uid))
            ]);

            if (voluntarioSnap.exists()) {
                // NOVO: Alert de sucesso para voluntário
                alert('Login de voluntário realizado com sucesso!'); 
                window.location.href = '../dashboard-voluntario/dashboard-voluntario.html';
            } else if (coordSnap.exists()) {
                // NOVO: Alert de sucesso para coordenador
                alert('Login de coordenador realizado com sucesso!'); 
                window.location.href = '../dashboard-coordenador/dashboard-coordenador.html';
            } else {
                throw new Error("Seu perfil não foi encontrado. Contate o administrador.");
            }

        } catch (error) {
            console.error("Erro no login:", error);

            let errorMessage = "Erro ao fazer login. Tente novamente.";

            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    errorMessage = "E-mail ou senha incorretos.";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "O formato do e-mail é inválido.";
                    break;
                case 'auth/user-disabled':
                    errorMessage = "Sua conta foi desativada. Entre em contato para mais informações.";
                    break;
                case 'auth/too-many-requests':
                    errorMessage = "Muitas tentativas de login. Tente novamente mais tarde.";
                    break;
                default:
                    errorMessage = error.message || "Ocorreu um erro inesperado.";
                    break;
            }
            loginErrorDisplay.textContent = errorMessage;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Entrar';
        }
    });
});
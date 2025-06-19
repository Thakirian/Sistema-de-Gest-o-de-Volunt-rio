// src/screens/perfil-voluntario/perfil-voluntario.js

import { auth_mod, db } from "../../firebase/firebase-config.js";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, updatePassword } from 'firebase/auth';

// Função principal de inicialização da tela de Perfil
export async function initPerfilVoluntario() {
    console.log('Inicializando tela de Perfil do Voluntário...');

    const perfilForm = document.getElementById('perfilForm');
    const nomeInput = document.getElementById('nome');
    const raInput = document.getElementById('ra');
    const periodoInput = document.getElementById('periodo');
    const cursoInput = document.getElementById('curso');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const formMessage = document.getElementById('formMessage');
    const submitButton = perfilForm.querySelector('button[type="submit"]');

    let currentUserId = null;

    onAuthStateChanged(auth_mod, async (user) => {
        if (user) {
            currentUserId = user.uid;
            console.log("Usuário logado para perfil:", user.email);
            emailInput.value = user.email; 
            await loadProfileData(currentUserId);
            setupFormSubmission(currentUserId);
        } else {
            console.log("Nenhum usuário logado. Não é possível carregar o perfil.");
            formMessage.textContent = "Por favor, faça login para ver seu perfil.";
            formMessage.classList.add('error');
            perfilForm.style.display = 'none';
        }
    });

    // Função para carregar os dados do perfil do Firestore
    async function loadProfileData(userId) {
        try {
            const voluntarioRef = doc(db, "voluntarios", userId);
            const docSnap = await getDoc(voluntarioRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                nomeInput.value = data.nome || '';
                raInput.value = data.ra || '';
                periodoInput.value = data.periodo || '';
                cursoInput.value = data.curso || '';
                console.log("Dados do perfil carregados:", data);
            } else {
                console.log("Nenhum perfil encontrado para este usuário. Criando um perfil vazio.");
            }
        } catch (error) {
            console.error("Erro ao carregar dados do perfil:", error);
            formMessage.textContent = `Erro ao carregar perfil: ${error.message}`;
            formMessage.classList.add('error');
        }
    }

    // Função para configurar o envio do formulário
    function setupFormSubmission(userId) {
        perfilForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            formMessage.textContent = '';
            formMessage.classList.remove('success', 'error');
            submitButton.disabled = true; 

            const newNome = nomeInput.value.trim();
            const newRa = raInput.value.trim();
            const newPeriodo = periodoInput.value.trim();
            const newCurso = cursoInput.value.trim();
            const newPassword = senhaInput.value; 

            try {
                // 1. Atualizar dados no Firestore (nome, ra, periodo, curso)
                const voluntarioRef = doc(db, "voluntarios", userId);
                const updatedProfileData = {
                    nome: newNome,
                    ra: newRa,
                    periodo: newPeriodo,
                    curso: newCurso,
                    // O email não é atualizado via Firestore, mas via Firebase Auth
                };
                await updateDoc(voluntarioRef, updatedProfileData);
                console.log("Dados do perfil atualizados no Firestore.");

                // 2. Atualizar senha no Firebase Authentication 
                if (newPassword) {
                    if (auth_mod.currentUser) {
                        try {
                            await updatePassword(auth_mod.currentUser, newPassword);
                            console.log("Senha atualizada no Firebase Authentication.");
                            formMessage.textContent = "Dados do perfil e senha atualizados com sucesso!";
                            formMessage.classList.add('success');
                            senhaInput.value = ''; 
                        } catch (passwordError) {
                            console.error("Erro ao atualizar senha:", passwordError);
                            if (passwordError.code === 'auth/requires-recent-login') {
                                formMessage.textContent = "Para alterar a senha, por favor, faça logout e login novamente, e tente a alteração imediatamente.";
                            } else {
                                formMessage.textContent = `Erro ao atualizar senha: ${passwordError.message}`;
                            }
                            formMessage.classList.add('error');
                            submitButton.disabled = false; 
                            return; 
                        }
                    } else {
                        formMessage.textContent = "Erro: Usuário não autenticado para alterar a senha.";
                        formMessage.classList.add('error');
                        submitButton.disabled = false;
                        return;
                    }
                } else {
                    formMessage.textContent = "Dados do perfil atualizados com sucesso!";
                    formMessage.classList.add('success');
                }

            } catch (error) {
                console.error("Erro geral ao salvar dados do perfil:", error);
                formMessage.textContent = `Erro ao salvar perfil: ${error.message}`;
                formMessage.classList.add('error');
            } finally {
                submitButton.disabled = false; 
            }
        });
    }
}
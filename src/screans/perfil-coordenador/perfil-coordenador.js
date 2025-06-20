// src/screens/perfil-coordenador/perfil-coordenador.js

import { auth_mod, db } from "../../firebase/firebase-config.js";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, updatePassword } from 'firebase/auth';

// Função principal de inicialização da tela de Perfil do Coordenador
export async function initPerfilCoordenador() {
    console.log('Inicializando tela de Perfil do Coordenador...');

    const perfilForm = document.getElementById('perfilFormCoordenador');
    const nomeInput = document.getElementById('nomeCoordenador');
    const emailInput = document.getElementById('emailCoordenador');
    const senhaInput = document.getElementById('senhaCoordenador');
    const formMessage = document.getElementById('formMessageCoordenador');
    const submitButton = perfilForm.querySelector('button[type="submit"]');

    let currentUserId = null;

    onAuthStateChanged(auth_mod, async (user) => {
        if (user) {
            currentUserId = user.uid;
            console.log("Usuário logado para perfil do coordenador:", user.email);
            emailInput.value = user.email; 
            await loadProfileData(currentUserId);
            setupFormSubmission(currentUserId);
        } else {
            console.log("Nenhum usuário logado. Não é possível carregar o perfil do coordenador.");
            formMessage.textContent = "Por favor, faça login para ver seu perfil.";
            formMessage.classList.add('error');
            perfilForm.style.display = 'none';
        }
    });

    // Função para carregar os dados do perfil do Firestore
    async function loadProfileData(userId) {
        try {
            const coordenadorRef = doc(db, "coordenadores", userId); // Coleção "coordenadores"
            const docSnap = await getDoc(coordenadorRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                nomeInput.value = data.nome || '';
                console.log("Dados do perfil do coordenador carregados:", data);
            } else {
                console.log("Nenhum perfil de coordenador encontrado para este usuário. Criando um perfil vazio.");
            }
        } catch (error) {
            console.error("Erro ao carregar dados do perfil do coordenador:", error);
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
            const newPassword = senhaInput.value; 

            try {
                // 1. Atualizar dados no Firestore (apenas o nome para o coordenador)
                const coordenadorRef = doc(db, "coordenadores", userId); // Coleção "coordenadores"
                const updatedProfileData = {
                    nome: newNome,
                };
                await updateDoc(coordenadorRef, updatedProfileData);
                console.log("Dados do perfil do coordenador atualizados no Firestore.");

                // 2. Atualizar senha no Firebase Authentication 
                if (newPassword) {
                    if (auth_mod.currentUser) {
                        try {
                            await updatePassword(auth_mod.currentUser, newPassword);
                            console.log("Senha atualizada no Firebase Authentication.");
                            formMessage.textContent = "Dados do perfil e senha atualizados com sucesso!";
                            formMessage.classList.add('success');
                            senhaInput.value = ''; // Limpa o campo de senha após sucesso
                        } catch (passwordError) {
                            console.error("Erro ao atualizar senha:", passwordError);
                            if (passwordError.code === 'auth/requires-recent-login') {
                                formMessage.textContent = "Para alterar a senha, por favor, faça logout e login novamente, e tente a alteração imediatamente.";
                            } else {
                                formMessage.textContent = `Erro ao atualizar senha: ${passwordError.message}`;
                            }
                            formMessage.classList.add('error');
                            submitButton.disabled = false; 
                            return; // Sai da função para não mostrar a mensagem de sucesso geral
                        }
                    } else {
                        formMessage.textContent = "Erro: Usuário não autenticado para alterar a senha.";
                        formMessage.classList.add('error');
                        submitButton.disabled = false;
                        return;
                    }
                } else {
                    // Se não houve nova senha, apenas dados do perfil foram atualizados
                    formMessage.textContent = "Dados do perfil atualizados com sucesso!";
                    formMessage.classList.add('success');
                }

            } catch (error) {
                console.error("Erro geral ao salvar dados do perfil do coordenador:", error);
                formMessage.textContent = `Erro ao salvar perfil: ${error.message}`;
                formMessage.classList.add('error');
            } finally {
                submitButton.disabled = false; // Reabilita o botão ao final, sucesso ou falha
            }
        });
    }
}
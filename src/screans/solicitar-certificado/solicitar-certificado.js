// src/screens/solicitar-certificado/solicitar-certificado.js

import { auth_mod, db } from "../../firebase/firebase-config.js";
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// Função principal de inicialização da tela
export async function initSolicitarCertificado() {
    console.log('Inicializando tela de Solicitar Certificado...');

    const oficinaSelect = document.getElementById('oficinaSelect');
    const solicitacaoCertificadoForm = document.getElementById('solicitacaoCertificadoForm');
    const formMessage = document.getElementById('formMessage');

    // Garante que o usuário esteja logado antes de tentar carregar dados ou enviar o formulário
    onAuthStateChanged(auth_mod, async (user) => {
        if (user) {
            console.log("Usuário logado para solicitar certificado:", user.email);
            await loadOficinas(user.uid); // Carrega as oficinas disponíveis
            setupFormSubmission(user.uid); // Configura o envio do formulário
        } else {
            console.log("Nenhum usuário logado. Não é possível solicitar certificado.");
            formMessage.textContent = "Por favor, faça login para solicitar seu certificado.";
            formMessage.classList.add('error');
            solicitacaoCertificadoForm.style.display = 'none';
        }
    });

    // Função para carregar as oficinas e preencher o select
    async function loadOficinas(currentVoluntarioId) {
        oficinaSelect.innerHTML = '<option value="">Carregando oficinas...</option>';
        try {
            const oficinasCollectionRef = collection(db, "oficinas");
            
            // Agora, busca oficinas com status "ativa" OU "concluída"
            const q = query(oficinasCollectionRef, where("status", "in", ["ativa", "concluida"])); 
            // --- FIM DA ALTERAÇÃO ---

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                oficinaSelect.innerHTML = '<option value="">Nenhuma oficina ativa ou concluída encontrada.</option>';
                oficinaSelect.disabled = true;
                return;
            }

            // Limpa a opção de "Carregando..."
            oficinaSelect.innerHTML = '<option value="">-- Selecione uma Oficina --</option>';

            querySnapshot.forEach((doc) => {
                const oficina = doc.data();
                const option = document.createElement('option');
                option.value = doc.id; 
                option.textContent = oficina.nome; 
                oficinaSelect.appendChild(option);
            });
            console.log('Oficinas (ativas e concluídas) carregadas com sucesso.');

        } catch (error) {
            console.error("Erro ao carregar oficinas:", error);
            oficinaSelect.innerHTML = '<option value="">Erro ao carregar oficinas.</option>';
            oficinaSelect.disabled = true;
        }
    }

    // Função para configurar o envio do formulário
    function setupFormSubmission(voluntarioId) {
        solicitacaoCertificadoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            formMessage.textContent = '';
            formMessage.classList.remove('success', 'error');
            solicitacaoCertificadoForm.querySelector('button[type="submit"]').disabled = true;

            const oficinaId = oficinaSelect.value;
            const dataParticipacaoStr = document.getElementById('dataParticipacao').value;
            const cargaHoraria = parseInt(document.getElementById('cargaHorariaInput').value);
            const papelDesempenhado = document.getElementById('papelDesempenhado').value.trim();
            const detalhes = document.getElementById('detalhes').value.trim();

            // Validação básica
            if (!oficinaId || !dataParticipacaoStr || isNaN(cargaHoraria) || cargaHoraria <= 0 || !papelDesempenhado) {
                formMessage.textContent = "Por favor, preencha todos os campos obrigatórios e verifique a carga horária.";
                formMessage.classList.add('error');
                solicitacaoCertificadoForm.querySelector('button[type="submit"]').disabled = false;
                return;
            }

            // Converte a data de participação para um objeto Date e depois para Timestamp
            const dataParticipacaoDate = new Date(dataParticipacaoStr + 'T12:00:00'); // Adiciona T12:00:00 para evitar problemas de fuso horário
            const dataSolicitacaoTimestamp = Timestamp.fromDate(new Date()); // Data atual da solicitação

            const novaSolicitacao = {
                voluntarioId: voluntarioId,
                oficinaId: oficinaId,
                dataParticipacao: Timestamp.fromDate(dataParticipacaoDate), // Convertendo a data de participação para Timestamp
                cargaHoraria: cargaHoraria,
                papelDesempenhado: papelDesempenhado,
                detalhes: detalhes,
                status: 'pendente', // Status inicial da solicitação
                dataSolicitacao: dataSolicitacaoTimestamp, // Quando a solicitação foi enviada
            };

            try {
                const solicitacoesCollectionRef = collection(db, "solicitacoesCertificado");
                await addDoc(solicitacoesCollectionRef, novaSolicitacao);

                formMessage.textContent = "Solicitação de certificado enviada com sucesso!";
                formMessage.classList.add('success');
                solicitacaoCertificadoForm.reset(); // Limpa o formulário
                oficinaSelect.innerHTML = '<option value="">-- Selecione uma Oficina --</option>'; // Resetar para o estado inicial
                await loadOficinas(voluntarioId); // Recarrega as oficinas caso algo mude ou para resetar o select
                console.log("Nova solicitação adicionada:", novaSolicitacao);

            } catch (error) {
                console.error("Erro ao enviar solicitação:", error);
                formMessage.textContent = `Erro ao enviar solicitação: ${error.message}`;
                formMessage.classList.add('error');
            } finally {
                solicitacaoCertificadoForm.querySelector('button[type="submit"]').disabled = false; // Reabilita o botão
            }
        });
    }
}
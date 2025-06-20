// src/screens/solicitar-certificado/solicitar-certificado.js

import { auth_mod, db } from "../../firebase/firebase-config.js";
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

let formSubmitHandler = null;

// Função principal de inicialização da tela
export async function initSolicitarCertificado() {
    console.log('Inicializando tela de Solicitar Certificado...');

    const oficinaSelect = document.getElementById('oficinaSelect');
    const solicitacaoCertificadoForm = document.getElementById('solicitacaoCertificadoForm');
    const formMessage = document.getElementById('formMessage');

    onAuthStateChanged(auth_mod, async (user) => {
        if (user) {
            console.log("Utilizador autenticado para solicitar certificado:", user.email);
            await loadOficinas(user.uid); 
            setupFormSubmission(user.uid); 
        } else {
            console.log("Nenhum utilizador autenticado. Não é possível solicitar certificado.");
            formMessage.textContent = "Por favor, autentique-se para solicitar o seu certificado.";
            formMessage.classList.add('error');
            solicitacaoCertificadoForm.style.display = 'none';
        }
    });

    // Função para carregar as oficinas e preencher o select
    async function loadOficinas(currentVoluntarioId) {
        oficinaSelect.innerHTML = '<option value="">A carregar oficinas...</option>';
        try {
            const oficinasCollectionRef = collection(db, "oficinas");
            
            // Agora, busca oficinas com status "ativa" OU "concluída"
            const q = query(oficinasCollectionRef, where("status", "in", ["ativa", "concluida"])); 
            
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                oficinaSelect.innerHTML = '<option value="">Nenhuma oficina ativa ou concluída encontrada.</option>';
                oficinaSelect.disabled = true;
                return;
            }

            // Limpa a opção de "A carregar..."
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
        if (formSubmitHandler) {
            solicitacaoCertificadoForm.removeEventListener('submit', formSubmitHandler);
        }

        formSubmitHandler = async (e) => {
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
            const dataParticipacaoDate = new Date(dataParticipacaoStr + 'T12:00:00'); 
            const dataSolicitacaoTimestamp = Timestamp.fromDate(new Date()); 

            const novaSolicitacao = {
                voluntarioId: voluntarioId,
                oficinaId: oficinaId,
                dataParticipacao: Timestamp.fromDate(dataParticipacaoDate), 
                cargaHoraria: cargaHoraria,
                papelDesempenhado: papelDesempenhado,
                detalhes: detalhes,
                status: 'pendente', 
                dataSolicitacao: dataSolicitacaoTimestamp, 
            };

            try {
                const solicitacoesCollectionRef = collection(db, "solicitacoesCertificado");
                await addDoc(solicitacoesCollectionRef, novaSolicitacao);

                formMessage.textContent = "Solicitação de certificado enviada com sucesso!";
                formMessage.classList.add('success');
                solicitacaoCertificadoForm.reset();
                console.log("Nova solicitação adicionada:", novaSolicitacao);

            } catch (error) {
                console.error("Erro ao enviar solicitação:", error);
                formMessage.textContent = `Erro ao enviar solicitação: ${error.message}`;
                formMessage.classList.add('error');
            } finally {
                solicitacaoCertificadoForm.querySelector('button[type="submit"]').disabled = false; 
            }
        };

        // Adiciona o novo listener
        solicitacaoCertificadoForm.addEventListener('submit', formSubmitHandler);
        // *** FIM DA CORREÇÃO ***
    }
}
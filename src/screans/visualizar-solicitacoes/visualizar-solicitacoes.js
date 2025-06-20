// src/screens/visualizar-solicitacoes/visualizar-solicitacoes.js
import { db } from "../../firebase/firebase-config.js";
import { collection, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';

export async function initVisualizarSolicitacoes() {
    console.log("Inicializando tela de Visualizar Solicitações de Certificado...");

    // Referências aos elementos do DOM
    const solicitacoesTableBody = document.getElementById('solicitacoesTableBody');
    const noSolicitacoesMessage = document.getElementById('noSolicitacoesMessage');
    const searchSolicitacoesInput = document.getElementById('searchSolicitacoesInput');
    const filterStatusSelect = document.getElementById('filterStatusSelect');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');

    // Referências do Modal de Detalhes
    const detalhesSolicitacaoModal = document.getElementById('detalhesSolicitacaoModal');
    const detalhesVoluntarioNome = document.getElementById('detalhesVoluntarioNome');
    const detalhesVoluntarioEmail = document.getElementById('detalhesVoluntarioEmail');
    const detalhesOficinaNome = document.getElementById('detalhesOficinaNome');
    const detalhesOficinaDescricao = document.getElementById('detalhesOficinaDescricao');
    const detalhesOficinaCargaHoraria = document.getElementById('detalhesOficinaCargaHoraria'); 
    const detalhesOficinaData = document.getElementById('detalhesOficinaData');
    const detalhesDataSolicitacao = document.getElementById('detalhesDataSolicitacao');
    const detalhesStatusAtual = document.getElementById('detalhesStatusAtual');
    const detalhesObservacoes = document.getElementById('detalhesObservacoes');
    const btnAprovarSolicitacao = document.getElementById('btnAprovarSolicitacao');
    const btnRejeitarSolicitacao = document.getElementById('btnRejeitarSolicitacao');

    let currentSolicitacaoId = null; 

    // Função para carregar e exibir as solicitações
    async function loadSolicitacoes() {
        if (!solicitacoesTableBody) {
            console.error("Elemento 'solicitacoesTableBody' não encontrado. Não foi possível carregar as solicitações.");
            return;
        }

        solicitacoesTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Carregando solicitações...</td></tr>';
        if (noSolicitacoesMessage) noSolicitacoesMessage.style.display = 'none';

        try {
            const searchTerm = searchSolicitacoesInput ? searchSolicitacoesInput.value.trim().toLowerCase() : '';
            const filterStatus = filterStatusSelect ? filterStatusSelect.value : '';

            let q = collection(db, 'solicitacoesCertificado');

            if (filterStatus) {
                q = query(q, where('status', '==', filterStatus));
            }

            const querySnapshot = await getDocs(q);
            let solicitacoes = [];

            for (const docSnap of querySnapshot.docs) {
                const solicitacao = { id: docSnap.id, ...docSnap.data() };

                let voluntarioNome = 'N/A';
                let voluntarioEmail = 'N/A';
                if (solicitacao.voluntarioId) {
                    const voluntarioRef = doc(db, 'voluntarios', solicitacao.voluntarioId);
                    const voluntarioSnap = await getDoc(voluntarioRef);
                    if (voluntarioSnap.exists()) {
                        const voluntarioData = voluntarioSnap.data();
                        voluntarioNome = voluntarioData.nome || voluntarioNome;
                        voluntarioEmail = voluntarioData.email || voluntarioEmail;
                    }
                }

                let oficinaNome = 'N/A';
                let oficinaCargaHorariaOficina = 'N/A'; 
                let oficinaDataFormatada = 'N/A';
                if (solicitacao.oficinaId) {
                    const oficinaRef = doc(db, 'oficinas', solicitacao.oficinaId);
                    const oficinaSnap = await getDoc(oficinaRef);
                    if (oficinaSnap.exists()) {
                        const oficinaData = oficinaSnap.data();
                        oficinaNome = oficinaData.nome || oficinaNome;
                        oficinaCargaHorariaOficina = oficinaData.cargaHoraria || oficinaCargaHorariaOficina; 
                        oficinaDataFormatada = oficinaData.dataOficina ? new Date(oficinaData.dataOficina.seconds * 1000).toLocaleDateString('pt-BR') : 'N/A';
                    }
                }

                solicitacao.voluntarioNome = voluntarioNome;
                solicitacao.voluntarioEmail = voluntarioEmail;
                solicitacao.oficinaNome = oficinaNome;
                solicitacao.oficinaCargaHorariaReal = oficinaCargaHorariaOficina; 
                solicitacao.oficinaData = oficinaDataFormatada;

                if (searchTerm && !(
                    (solicitacao.voluntarioNome && solicitacao.voluntarioNome.toLowerCase().includes(searchTerm)) ||
                    (solicitacao.oficinaNome && solicitacao.oficinaNome.toLowerCase().includes(searchTerm))
                )) {
                    continue;
                }
                
                solicitacoes.push(solicitacao);
            }

            solicitacoesTableBody.innerHTML = '';
            if (solicitacoes.length === 0) {
                if (noSolicitacoesMessage) noSolicitacoesMessage.style.display = 'block';
            } else {
                if (noSolicitacoesMessage) noSolicitacoesMessage.style.display = 'none';
                solicitacoes.forEach(solicitacao => {
                    const dataSolicitacaoFormatada = solicitacao.dataSolicitacao ? new Date(solicitacao.dataSolicitacao.seconds * 1000).toLocaleDateString('pt-BR') : 'N/A';
                    const statusClass = solicitacao.status ? `status-${solicitacao.status.toLowerCase().replace(' ', '-')}` : '';

                    const row = `
                        <tr>
                            <td>${solicitacao.voluntarioNome}</td>
                            <td>${solicitacao.oficinaNome}</td>
                            <td>${dataSolicitacaoFormatada}</td>
                            <td>${solicitacao.cargaHoraria || 'N/A'}h</td>
                            <td><span class="status-badge ${statusClass}">${solicitacao.status || 'N/A'}</span></td>
                            <td>
                                <button class="btn btn-info view-details-btn" data-id="${solicitacao.id}">Ver Detalhes</button>
                            </td>
                        </tr>
                    `;
                    solicitacoesTableBody.innerHTML += row;
                });

                solicitacoesTableBody.querySelectorAll('.view-details-btn').forEach(button => {
                    button.addEventListener('click', (event) => {
                        const solicitacaoId = event.target.dataset.id;
                        viewSolicitacaoDetails(solicitacaoId);
                    });
                });
            }

        } catch (error) {
            console.error("Erro ao carregar solicitações de certificado:", error);
            solicitacoesTableBody.innerHTML = `<tr><td colspan="6" style="color: red; text-align: center;">Erro ao carregar solicitações.</td></tr>`;
            if (noSolicitacoesMessage) noSolicitacoesMessage.style.display = 'none';
        }
    }

    // Função para abrir o modal de detalhes e preencher com os dados da solicitação
    async function viewSolicitacaoDetails(solicitacaoId) {
        currentSolicitacaoId = solicitacaoId;
        try {
            const solicitacaoRef = doc(db, 'solicitacoesCertificado', solicitacaoId);
            const solicitacaoSnap = await getDoc(solicitacaoRef);

            if (!solicitacaoSnap.exists()) {
                alert('Solicitação não encontrada.');
                return;
            }

            const solicitacao = solicitacaoSnap.data();

            let voluntarioNome = 'N/A';
            let voluntarioEmail = 'N/A';
            if (solicitacao.voluntarioId) {
                const voluntarioRef = doc(db, 'voluntarios', solicitacao.voluntarioId);
                const voluntarioSnap = await getDoc(voluntarioRef);
                if (voluntarioSnap.exists()) {
                    const voluntarioData = voluntarioSnap.data();
                    voluntarioNome = voluntarioData.nome || voluntarioNome;
                    voluntarioEmail = voluntarioData.email || voluntarioEmail;
                }
            }

            let oficinaNome = 'N/A';
            let oficinaDescricao = 'N/A';
            let oficinaCargaHoraria = 'N/A'; 
            let oficinaDataFormatada = 'N/A';
            if (solicitacao.oficinaId) {
                const oficinaRef = doc(db, 'oficinas', solicitacao.oficinaId);
                const oficinaSnap = await getDoc(oficinaRef);
                if (oficinaSnap.exists()) {
                    const oficinaData = oficinaSnap.data();
                    oficinaNome = oficinaData.nome || oficinaNome;
                    oficinaDescricao = oficinaData.descricao || oficinaDescricao;
                    oficinaCargaHoraria = oficinaData.cargaHoraria || oficinaCargaHoraria;
                    oficinaDataFormatada = oficinaData.dataOficina ? new Date(oficinaData.dataOficina.seconds * 1000).toLocaleDateString('pt-BR') : 'N/A';
                }
            }
            
            // Preencher o modal
            detalhesVoluntarioNome.textContent = voluntarioNome;
            detalhesVoluntarioEmail.textContent = voluntarioEmail;
            detalhesOficinaNome.textContent = oficinaNome;
            detalhesOficinaDescricao.textContent = oficinaDescricao;
            detalhesOficinaCargaHoraria.textContent = oficinaCargaHoraria + 'h'; 
            detalhesOficinaData.textContent = oficinaDataFormatada;
            detalhesDataSolicitacao.textContent = solicitacao.dataSolicitacao ? new Date(solicitacao.dataSolicitacao.seconds * 1000).toLocaleDateString('pt-BR') : 'N/A';
            detalhesStatusAtual.textContent = solicitacao.status || 'N/A';
            detalhesStatusAtual.className = `status-badge status-${(solicitacao.status || 'N/A').toLowerCase().replace(' ', '-')}`;
            detalhesObservacoes.textContent = solicitacao.detalhes || 'Nenhuma observação.';

            // Habilitar/desabilitar botões de ação baseado no status atual
            if (solicitacao.status === 'pendente') {
                btnAprovarSolicitacao.style.display = 'inline-block';
                btnRejeitarSolicitacao.style.display = 'inline-block';
            } else {
                btnAprovarSolicitacao.style.display = 'none';
                btnRejeitarSolicitacao.style.display = 'none';
            }

            window.openModal('detalhesSolicitacaoModal');

        } catch (error) {
            console.error("Erro ao carregar detalhes da solicitação:", error);
            alert('Erro ao carregar detalhes da solicitação.');
        }
    }

    // Função para atualizar o status da solicitação
    async function updateSolicitacaoStatus(status) {
        if (!currentSolicitacaoId) {
            alert('Nenhuma solicitação selecionada.');
            return;
        }

        try {
            const solicitacaoRef = doc(db, 'solicitacoesCertificado', currentSolicitacaoId);
            await updateDoc(solicitacaoRef, { status: status });
            alert(`Solicitação ${status} com sucesso!`);
            
            window.closeModal('detalhesSolicitacaoModal');
            
            loadSolicitacoes(); 
        } catch (error) {
            console.error(`Erro ao ${status} solicitação:`, error);
            alert(`Erro ao ${status} solicitação.`);
        }
    }

    // --- Event Listeners ---

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', loadSolicitacoes);
    }

    if (searchSolicitacoesInput) {
        searchSolicitacoesInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                loadSolicitacoes();
            }
        });
    }

    if (filterStatusSelect) {
        filterStatusSelect.addEventListener('change', loadSolicitacoes);
    }

    if (btnAprovarSolicitacao) {
        btnAprovarSolicitacao.addEventListener('click', () => updateSolicitacaoStatus('aprovado'));
    }
    if (btnRejeitarSolicitacao) {
        btnRejeitarSolicitacao.addEventListener('click', () => updateSolicitacaoStatus('rejeitado'));
    }
    loadSolicitacoes();
}

// Funções globais para modais (mantidas aqui conforme sua solicitação)
window.openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
};

window.closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
};
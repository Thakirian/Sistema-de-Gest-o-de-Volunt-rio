// src/screens/gerenciar-oficinas/gerenciar-oficinas.js
import { db } from "../../firebase/firebase-config.js";
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

// Função de inicialização da tela Gerenciar Oficinas
// Esta função será chamada pelo dashboard-coordenador.js quando a tela for ativada
export function initGerenciarOficinas() {
    console.log("Inicializando tela de Gerenciar Oficinas...");
    
    // Referências aos elementos do DOM que serão manipulados
    // A busca por esses elementos ocorre APENAS quando initGerenciarOficinas é chamada,
    // garantindo que o HTML já foi carregado.
    const oficinasTableBody = document.getElementById('oficinasTableBody');
    const btnNovaOficina = document.getElementById('btnNovaOficina');
    const novaOficinaModal = document.getElementById('novaOficinaModal');
    const oficinaForm = document.getElementById('oficinaForm');
    const modalOficinaTitle = document.getElementById('modalOficinaTitle');
    const btnSalvarOficina = document.getElementById('btnSalvarOficina');

    // Campos do formulário
    const oficinaIdInput = document.getElementById('oficinaId');
    const nomeOficinaInput = document.getElementById('nomeOficina');
    const descricaoOficinaInput = document.getElementById('descricaoOficina');
    const instrutorOficinaInput = document.getElementById('instrutorOficina');
    const cargaHorariaOficinaInput = document.getElementById('cargaHorariaOficina');
    const dataInicioOficinaInput = document.getElementById('dataInicioOficina');
    const vagasOficinaInput = document.getElementById('vagasOficina');
    const statusOficinaInput = document.getElementById('statusOficina');
    
    // NOVOS CAMPOS
    const localOficinaInput = document.getElementById('localOficina');
    const imagemOficinaInput = document.getElementById('imagemOficina');

    // Referências para o modal de participantes
    const participantesModal = document.getElementById('participantesModal');
    const oficinaNomeParticipantesSpan = document.getElementById('oficinaNomeParticipantes');
    const participantesTableBody = document.getElementById('participantesTableBody'); 

    // Usando o mesmo nome do seu HTML para evitar confusão
    const oficinasListTableBody = document.getElementById('oficinasTableBody'); 

    let currentEditOficinaId = null; // Variável para armazenar o ID da oficina sendo editada

    // --- FUNÇÕES GLOBAIS (window.openModal, window.closeModal) ---
    // Essas funções precisam estar no escopo global (window) se forem chamadas via 'onclick' no HTML.
    window.openModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    };

    window.closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            // Limpar formulário ao fechar o modal de nova/editar oficina
            if (modalId === 'novaOficinaModal') { // Usa o ID real do HTML
                oficinaForm.reset();
                currentEditOficinaId = null;
                modalOficinaTitle.textContent = 'Nova Oficina';
                btnSalvarOficina.textContent = 'Criar Oficina';
                oficinaIdInput.value = '';
            }
        }
    };

    // --- FUNÇÕES DE LÓGICA DE NEGÓCIO ---

    // Função para carregar as oficinas do Firestore e preencher a tabela
    async function loadOficinas() {
        if (!oficinasListTableBody) {
             console.error("Elemento 'oficinasTableBody' não encontrado. Não foi possível carregar as oficinas.");
             return;
        }
        oficinasListTableBody.innerHTML = ''; // Limpa a tabela antes de preencher
        const oficinasCol = collection(db, 'oficinas');
        const oficinasSnapshot = await getDocs(oficinasCol);

        if (oficinasSnapshot.empty) {
            oficinasListTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center;">Nenhuma oficina cadastrada.</td>
                </tr>
            `;
            return;
        }

        oficinasSnapshot.forEach(doc => {
            const oficina = { id: doc.id, ...doc.data() };
            const row = document.createElement('tr');
            // Nota: Se quiser exibir 'Local' ou 'Imagem' na tabela, precisará adicionar novas colunas
            // no <thead> do HTML e novos <td> aqui. Por enquanto, focamos em salvar e editar.
            row.innerHTML = `
                <td>${oficina.nome || 'N/A'}</td>
                <td>${oficina.descricao || 'N/A'}</td>
                <td>${oficina.instrutor || 'N/A'}</td>
                <td>${oficina.cargaHoraria || 'N/A'}h</td>
                <td>${oficina.dataInicio ? new Date(oficina.dataInicio).toLocaleDateString('pt-BR') : 'N/A'}</td>
                <td>${oficina.vagasDisponiveis !== undefined ? oficina.vagasDisponiveis : 'N/A'}</td>
                <td><span class="status-badge status-${oficina.status || 'desconhecido'}">${oficina.status || 'Desconhecido'}</span></td>
                <td>
                    <button class="btn btn-sm" data-id="${oficina.id}" data-action="edit">Editar</button>
                    <button class="btn btn-sm btn-danger" data-id="${oficina.id}" data-action="delete">Excluir</button>
                    <button class="btn btn-sm btn-info" data-id="${oficina.id}" data-action="view-participants">Ver Participantes</button>
                </td>
            `;
            oficinasListTableBody.appendChild(row);
        });

        // Adiciona event listeners para os botões de ação
        oficinasListTableBody.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const id = event.target.dataset.id;
                const action = event.target.dataset.action;

                if (action === 'edit') {
                    editOficina(id);
                } else if (action === 'delete') {
                    deleteOficina(id);
                } else if (action === 'view-participants') {
                    viewParticipantes(id);
                }
            });
        });
    }

    // Função para lidar com a submissão do formulário (Adicionar/Editar)
    if (oficinaForm) { // Verifica se o elemento existe antes de adicionar o listener
        oficinaForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const oficinaData = {
                nome: nomeOficinaInput.value,
                descricao: descricaoOficinaInput.value,
                instrutor: instrutorOficinaInput.value,
                cargaHoraria: parseInt(cargaHorariaOficinaInput.value),
                dataInicio: dataInicioOficinaInput.value, // Armazena como string "YYYY-MM-DD" para consistência
                vagasDisponiveis: parseInt(vagasOficinaInput.value),
                status: statusOficinaInput.value,
                local: localOficinaInput.value, // NOVO CAMPO
                imagemUrl: imagemOficinaInput.value, // NOVO CAMPO
                // Assumindo que userData.dataCriacao é definido em outro lugar se currentEditOficinaId existir
                dataCriacao: currentEditOficinaId ? (window.userData ? window.userData.dataCriacao : new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0], 
            };

            try {
                if (currentEditOficinaId) {
                    // Modo de edição
                    const oficinaRef = doc(db, 'oficinas', currentEditOficinaId);
                    await updateDoc(oficinaRef, oficinaData);
                    alert('Oficina atualizada com sucesso!');
                } else {
                    // Modo de criação
                    oficinaData.dataCriacao = new Date(); // Firestore Timestamp
                    await addDoc(collection(db, 'oficinas'), oficinaData);
                    alert('Oficina cadastrada com sucesso!');
                }

                closeModal('novaOficinaModal'); // Usa o ID real do HTML
                loadOficinas(); // Recarrega a lista de oficinas
            } catch (e) {
                console.error("Erro ao salvar oficina: ", e);
                alert('Erro ao salvar oficina. Verifique o console para mais detalhes.');
            }
        });
    } else {
        console.error("Elemento 'oficinaForm' não encontrado. O formulário de oficina não funcionará.");
    }


    // Função para preencher o formulário para edição
    async function editOficina(id) {
        const oficinaRef = doc(db, 'oficinas', id);
        const oficinaSnap = await getDoc(oficinaRef);

        if (oficinaSnap.exists()) {
            const oficina = oficinaSnap.data();
            currentEditOficinaId = id;
            
            modalOficinaTitle.textContent = 'Editar Oficina';
            btnSalvarOficina.textContent = 'Salvar Alterações';
            oficinaIdInput.value = id; // Preenche o campo oculto
            nomeOficinaInput.value = oficina.nome || '';
            descricaoOficinaInput.value = oficina.descricao || '';
            instrutorOficinaInput.value = oficina.instrutor || '';
            cargaHorariaOficinaInput.value = oficina.cargaHoraria || '';
            dataInicioOficinaInput.value = oficina.dataInicio || ''; // dataInicio já deve estar no formato "YYYY-MM-DD"
            vagasOficinaInput.value = oficina.vagasDisponiveis || '';
            statusOficinaInput.value = oficina.status || 'ativa';
            localOficinaInput.value = oficina.local || ''; // PREENCHE NOVO CAMPO
            imagemOficinaInput.value = oficina.imagemUrl || ''; // PREENCHE NOVO CAMPO

            openModal('novaOficinaModal'); // Usa o ID real do HTML
        } else {
            alert('Oficina não encontrada para edição.');
        }
    }

    // Função para excluir uma oficina
    async function deleteOficina(id) {
        if (confirm('Tem certeza que deseja excluir esta oficina? Esta ação é irreversível.')) {
            try {
                await deleteDoc(doc(db, 'oficinas', id));
                alert('Oficina excluída com sucesso!');
                loadOficinas(); // Recarrega a lista
            } catch (e) {
                console.error("Erro ao excluir oficina: ", e);
                alert('Erro ao excluir oficina. Verifique o console para mais detalhes.');
            }
        }
    }

    // Função para visualizar participantes
    async function viewParticipantes(oficinaId) {
        if (!oficinaNomeParticipantesSpan || !participantesTableBody) {
             console.error("Elementos do modal de participantes não encontrados. Não foi possível exibir participantes.");
             return;
        }

        oficinaNomeParticipantesSpan.textContent = ''; // Limpa antes de preencher
        participantesTableBody.innerHTML = ''; // Limpa a tabela antes de preencher

        const oficinaRef = doc(db, 'oficinas', oficinaId);
        const oficinaSnap = await getDoc(oficinaRef);

        if (!oficinaSnap.exists()) {
            alert('Oficina não encontrada.');
            return;
        }
        const oficinaData = oficinaSnap.data();
        oficinaNomeParticipantesSpan.textContent = oficinaData.nome || 'N/A';

        const inscricoesRef = collection(db, 'inscricoes');
        const q = query(inscricoesRef, where('oficinaId', '==', oficinaId));
        const inscricoesSnap = await getDocs(q);

        if (inscricoesSnap.empty) {
            participantesTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center;">Nenhum participante inscrito nesta oficina.</td>
                </tr>
            `;
            openModal('participantesModal'); // Usa o ID real do HTML
            return;
        }

        for (const inscricaoDoc of inscricoesSnap.docs) {
            const inscricaoData = inscricaoDoc.data();
            const voluntarioId = inscricaoData.voluntarioId;
            
            let nomeVoluntario = 'Desconhecido';
            let emailVoluntario = 'N/A';
            
            if (voluntarioId) {
                const voluntarioRef = doc(db, 'voluntarios', voluntarioId);
                const voluntarioSnap = await getDoc(voluntarioRef);
                if (voluntarioSnap.exists()) {
                    const voluntarioData = voluntarioSnap.data();
                    nomeVoluntario = voluntarioData.nome || 'N/A';
                    emailVoluntario = voluntarioData.email || 'N/A';
                }
            }

            const row = `
                <tr>
                    <td>${nomeVoluntario}</td>
                    <td>${emailVoluntario}</td>
                    <td><span class="status-badge status-${inscricaoData.statusInscricao || 'desconhecido'}">${inscricaoData.statusInscricao || 'Desconhecido'}</span></td>
                    <td>
                        <button class="btn btn-sm" data-inscricao-id="${inscricaoDoc.id}" data-action="mudar-status-inscricao">Mudar Status</button>
                    </td>
                </tr>
            `;
            participantesTableBody.innerHTML += row;
        }

        // Adiciona event listener para o botão "Mudar Status" (exemplo)
        participantesTableBody.querySelectorAll('[data-action="mudar-status-inscricao"]').forEach(button => {
            button.addEventListener('click', async (event) => {
                const inscricaoId = event.target.dataset.inscricaoId;
                const novoStatus = prompt('Novo status da inscrição (ex: aprovado, pendente, rejeitado):');
                if (novoStatus) {
                    try {
                        await updateDoc(doc(db, 'inscricoes', inscricaoId), { statusInscricao: novoStatus });
                        alert('Status da inscrição atualizado!');
                        viewParticipantes(oficinaId); // Recarrega a lista de participantes
                    } catch (e) {
                        console.error("Erro ao mudar status da inscrição:", e);
                        alert("Erro ao atualizar status.");
                    }
                }
            });
        });

        openModal('participantesModal'); // Usa o ID real do HTML
    }


    // --- EVENT LISTENERS GLOBAIS PARA A TELA DE GERENCIAR OFICINAS ---
    // Verifica se o botão existe antes de adicionar o listener
    if (btnNovaOficina) {
        btnNovaOficina.addEventListener('click', () => {
            openModal('novaOficinaModal'); // Usa o ID real do HTML
        });
    } else {
        console.error("Elemento 'btnNovaOficina' não encontrado. O botão 'Nova Oficina' não funcionará.");
    }
    
    // Carrega as oficinas quando a tela é inicializada
    loadOficinas(); 
}
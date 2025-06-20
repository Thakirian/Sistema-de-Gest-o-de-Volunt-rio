import { db } from "../../firebase/firebase-config.js";
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore'; // Adicionado Timestamp aqui

export function initGerenciarOficinas() {
    console.log("Inicializando tela de Gerenciar Oficinas...");
    
    // Referências aos elementos do DOM que serão manipulados
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
    const departamentoOficinaInput = document.getElementById('departamentoOficina'); 
    const cargaHorariaOficinaInput = document.getElementById('cargaHorariaOficina');
    const dataInicioOficinaInput = document.getElementById('dataInicioOficina');
    const vagasOficinaInput = document.getElementById('vagasOficina');
    const statusOficinaInput = document.getElementById('statusOficina');
    
    const localOficinaInput = document.getElementById('localOficina');
    const imagemOficinaInput = document.getElementById('imagemOficina');

    const oficinasListTableBody = document.getElementById('oficinasTableBody'); 

    let currentEditOficinaId = null;

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
            if (modalId === 'novaOficinaModal') {
                oficinaForm.reset();
                currentEditOficinaId = null;
                modalOficinaTitle.textContent = 'Nova Oficina';
                btnSalvarOficina.textContent = 'Criar Oficina';
                oficinaIdInput.value = '';
            }
        }
    };

   
    async function loadOficinas() {
        if (!oficinasListTableBody) {
             console.error("Elemento 'oficinasTableBody' não encontrado. Não foi possível carregar as oficinas.");
             return;
        }
        oficinasListTableBody.innerHTML = '';
        const oficinasCol = collection(db, 'oficinas');
        const oficinasSnapshot = await getDocs(oficinasCol);

        if (oficinasSnapshot.empty) {
            oficinasListTableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center;">Nenhuma oficina cadastrada.</td> </tr>
            `;
            return;
        }

        oficinasSnapshot.forEach(doc => {
            const oficina = { id: doc.id, ...doc.data() };
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    ${oficina.imagemUrl ? `<img src="${oficina.imagemUrl}" alt="Imagem da Oficina" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">` : 'N/A'}
                </td>
                <td>${oficina.nome || 'N/A'}</td>
                <td>${oficina.descricao || 'N/A'}</td>
                <td>${oficina.departamento || 'N/A'}</td>
                <td>${oficina.cargaHoraria || 'N/A'}h</td>
                <td>${oficina.dataInicio ? new Date(oficina.dataInicio).toLocaleDateString('pt-BR') : 'N/A'}</td>
                <td>${oficina.vagasDisponiveis !== undefined ? oficina.vagasDisponiveis : 'N/A'}</td>
                <td><span class="status-badge status-${oficina.status || 'desconhecido'}">${oficina.status || 'Desconhecido'}</span></td>
                <td>
                    <button class="btn btn-sm" data-id="${oficina.id}" data-action="edit">Editar</button>
                    <button class="btn btn-sm btn-danger" data-id="${oficina.id}" data-action="delete">Excluir</button>
                </td>
            `;
            oficinasListTableBody.appendChild(row);
        });

        oficinasListTableBody.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const id = event.target.dataset.id;
                const action = event.target.dataset.action;

                if (action === 'edit') {
                    editOficina(id);
                } else if (action === 'delete') {
                    deleteOficina(id);
                }
            });
        });
    }

    if (oficinaForm) {
        oficinaForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const oficinaData = {
                nome: nomeOficinaInput.value,
                descricao: descricaoOficinaInput.value,
                departamento: departamentoOficinaInput.value,
                cargaHoraria: parseInt(cargaHorariaOficinaInput.value),
                dataInicio: dataInicioOficinaInput.value, // dataInicio pode continuar como string se preferir, já que não causa o erro
                vagasDisponiveis: parseInt(vagasOficinaInput.value),
                status: statusOficinaInput.value,
                local: localOficinaInput.value,
                imagemUrl: imagemOficinaInput.value,
                dataCriacao: Timestamp.now() 
            };

            try {
                if (currentEditOficinaId) {
                    const oficinaRef = doc(db, 'oficinas', currentEditOficinaId);
                    const existingOficinaSnap = await getDoc(oficinaRef);
                    if (existingOficinaSnap.exists() && existingOficinaSnap.data().dataCriacao instanceof Timestamp) {
                         oficinaData.dataCriacao = existingOficinaSnap.data().dataCriacao;
                    } else {
                         oficinaData.dataCriacao = Timestamp.now(); 
                    }

                    await updateDoc(oficinaRef, oficinaData);
                    alert('Oficina atualizada com sucesso!');
                } else {
                    await addDoc(collection(db, 'oficinas'), oficinaData);
                    alert('Oficina cadastrada com sucesso!');
                }

                closeModal('novaOficinaModal');
                loadOficinas();
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
            oficinaIdInput.value = id;
            nomeOficinaInput.value = oficina.nome || '';
            descricaoOficinaInput.value = oficina.descricao || '';
            departamentoOficinaInput.value = oficina.departamento || '';
            cargaHorariaOficinaInput.value = oficina.cargaHoraria || '';
            dataInicioOficinaInput.value = oficina.dataInicio || '';
            vagasOficinaInput.value = oficina.vagasDisponiveis || '';
            statusOficinaInput.value = oficina.status || 'ativa';
            localOficinaInput.value = oficina.local || '';
            imagemOficinaInput.value = oficina.imagemUrl || '';

            openModal('novaOficinaModal');
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
                loadOficinas();
            } catch (e) {
                console.error("Erro ao excluir oficina: ", e);
                alert('Erro ao excluir oficina. Verifique o console para mais detalhes.');
            }
        }
    }

    // --- EVENT LISTENERS GLOBAIS PARA A TELA DE GERENCIAR OFICINAS ---
    if (btnNovaOficina) {
        btnNovaOficina.addEventListener('click', () => {
            oficinaForm.reset();
            currentEditOficinaId = null;
            modalOficinaTitle.textContent = 'Nova Oficina';
            btnSalvarOficina.textContent = 'Criar Oficina';
            oficinaIdInput.value = '';
            openModal('novaOficinaModal');
        });
    } else {
        console.error("Elemento 'btnNovaOficina' não encontrado. O botão 'Nova Oficina' não funcionará.");
    }
    
    // Carrega as oficinas quando a tela é inicializada
    loadOficinas(); 
}
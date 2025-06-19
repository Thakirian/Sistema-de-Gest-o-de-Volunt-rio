// src/screens/lista-oficinas/lista-oficinas.js
import { db } from "../../firebase/firebase-config.js";
import { collection, getDocs, query, where } from 'firebase/firestore';

// Esta função será chamada pelo dashboard-voluntario.js quando a tela for ativada
export async function initListaOficinas() {
    console.log("Inicializando tela de Lista de Oficinas...");

    const oficinasTableBody = document.getElementById('oficinas-table').querySelector('tbody');
    const noOficinasMessage = document.getElementById('no-oficinas-message');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button'); // Corrigido: Usando 'searchButton' diretamente

    // Função para renderizar as oficinas na tabela
    async function renderOficinas(oficinasToRender) {
        oficinasTableBody.innerHTML = ''; // Limpa o conteúdo atual da tabela
        if (oficinasToRender.length === 0) {
            noOficinasMessage.style.display = 'block';
        } else {
            noOficinasMessage.style.display = 'none';
            for (const oficina of oficinasToRender) {
                const row = `
                    <tr>
                        <td>${oficina.nome || 'N/A'}</td>
                        <td>${oficina.descricao || 'N/A'}</td>
                        <td>${oficina.cargaHoraria || 'N/A'}h</td>
                        <td>${oficina.local || 'N/A'}</td>
                        <td>${oficina.dataOficina ? new Date(oficina.dataOficina.seconds * 1000).toLocaleDateString('pt-BR') : 'N/A'}</td>
                        <td>${oficina.vagasDisponiveis !== undefined ? oficina.vagasDisponiveis : 'N/A'} / ${oficina.totalVagas !== undefined ? oficina.totalVagas : 'N/A'}</td>
                        <td>
                            <button class="action-button ver-detalhes" data-oficina-id="${oficina.id}">Ver Detalhes</button>
                        </td>
                    </tr>
                `;
                oficinasTableBody.innerHTML += row;
            }

            // Adiciona event listeners aos botões "Ver Detalhes"
            document.querySelectorAll('.action-button.ver-detalhes').forEach(button => {
                button.addEventListener('click', (event) => {
                    const oficinaId = event.target.dataset.oficinaId;
                    handleVerDetalhesClick(oficinaId); // Chama a função para lidar com o clique
                });
            });
        }
    }

    // Função para buscar oficinas do Firestore
    async function fetchOficinas(searchTerm = '') {
        oficinasTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Carregando oficinas...</td></tr>';
        noOficinasMessage.style.display = 'none';

        try {
            const oficinasCollectionRef = collection(db, "oficinas");
            let q = oficinasCollectionRef;

            // Filtra por oficinas ativas
            q = query(q, where("status", "==", "ativa"));
            
            const querySnapshot = await getDocs(q);
            let oficinas = [];
            querySnapshot.forEach((doc) => {
                oficinas.push({ id: doc.id, ...doc.data() });
            });

            if (searchTerm) {
                const lowerSearchTerm = searchTerm.toLowerCase();
                oficinas = oficinas.filter(oficina => 
                    (oficina.nome && oficina.nome.toLowerCase().includes(lowerSearchTerm)) ||
                    (oficina.descricao && oficina.descricao.toLowerCase().includes(lowerSearchTerm))
                );
            }

            await renderOficinas(oficinas);

        } catch (error) {
            console.error("Erro ao buscar oficinas:", error);
            oficinasTableBody.innerHTML = `<tr><td colspan="7" style="color: red; text-align: center;">Erro ao carregar oficinas.</td></tr>`;
            noOficinasMessage.style.display = 'none';
        }
    }

    // Lógica para o botão de busca
    if (searchButton) { 
        searchButton.addEventListener('click', () => {
            fetchOficinas(searchInput.value.trim());
        });
    }

    // Lógica para buscar ao pressionar Enter no campo de busca
    if (searchInput) {
        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                fetchOficinas(searchInput.value.trim());
            }
        });
    }

    // Função de clique no botão "Ver Detalhes"
    // Esta função será o ponto de entrada para a próxima tela (Detalhamento da Oficina)
    async function handleVerDetalhesClick(oficinaId) {
        console.log("Botão Ver Detalhes clicado para oficina:", oficinaId);
        alert(`Navegar para a tela de Detalhamento da Oficina (ID: ${oficinaId})`);
        
        // FUTURAMENTE:
        // Aqui você chamaria a função de navegação do dashboard para a tela de detalhamento.
        // Por exemplo:
        // if (window.showScreen) { // Verifica se a função global está disponível
        //    window.showScreen('detalhamento-oficina', { oficinaId: oficinaId });
        // } else {
        //    console.warn("A função 'showScreen' não está definida globalmente para navegação.");
        // }
    }

    // Carrega as oficinas assim que a tela for inicializada
    fetchOficinas();
}
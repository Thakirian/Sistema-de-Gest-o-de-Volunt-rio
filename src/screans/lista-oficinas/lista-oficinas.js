// src/screens/lista-oficinas/lista-oficinas.js
import { db } from "../../firebase/firebase-config.js";
import { collection, getDocs, query } from 'firebase/firestore'; 

export async function initListaOficinas() {
    console.log("Inicializando tela de Lista de Oficinas para Voluntário (Todas as oficinas)...");

    const oficinasTableBody = document.getElementById('oficinas-table')?.querySelector('tbody');
    const noOficinasMessage = document.getElementById('no-oficinas-message');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const loadingSpinner = document.getElementById('loading-spinner'); 

    if (!oficinasTableBody || !loadingSpinner) { 
        console.error("Elementos essenciais ('oficinas-table' ou 'loading-spinner') não encontrados. A tela de lista de oficinas pode não estar carregada corretamente.");
        return;
    }

    async function renderOficinas(oficinasToRender) {
        oficinasTableBody.innerHTML = ''; 
        if (noOficinasMessage) noOficinasMessage.style.display = 'none'; 

        if (oficinasToRender.length === 0) {
            if (noOficinasMessage) noOficinasMessage.style.display = 'block';
        } else {
            for (const oficina of oficinasToRender) {
                const statusClass = oficina.status ? `status-${oficina.status.toLowerCase().replace(' ', '-')}` : '';
              
                const imageUrl = oficina.imagemUrl || 'https://via.placeholder.com/80x50?text=Sem+Imagem'; 

                const dataOficinaFormatada = oficina.dataInicio 
                    ? new Date(oficina.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR') 
                    : 'N/A'; 

                const row = `
                    <tr>
                        <td><img src="${imageUrl}" alt="Imagem da Oficina ${oficina.nome || ''}" class="office-table-image"></td>
                        <td>${oficina.nome || 'N/A'}</td>
                        <td>${oficina.descricao || 'N/A'}</td>
                        <td>${oficina.cargaHoraria || 'N/A'}h</td>
                        <td>${oficina.local || 'N/A'}</td>
                        <td>${dataOficinaFormatada}</td> <td><span class="${statusClass}">${oficina.status || 'N/A'}</span></td>
                        <td>
                            <button class="action-button ver-detalhes" data-oficina-id="${oficina.id}">Ver Detalhes</button>
                        </td>
                    </tr>
                `;
                oficinasTableBody.innerHTML += row;
            }

            document.querySelectorAll('.action-button.ver-detalhes').forEach(button => {
                button.addEventListener('click', (event) => {
                    const oficinaId = event.target.dataset.oficinaId;
                    handleVerDetalhesClick(oficinaId);
                });
            });
        }
    }

    async function fetchOficinas(searchTerm = '') {
        oficinasTableBody.innerHTML = '';
        if (noOficinasMessage) noOficinasMessage.style.display = 'none';
        loadingSpinner.style.display = 'block'; 

        try {
            const oficinasCollectionRef = collection(db, "oficinas");
            let q = query(oficinasCollectionRef); 
            
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
            oficinasTableBody.innerHTML = `<tr><td colspan="7" style="color: red; text-align: center;">Erro ao carregar oficinas.</td></tr>`; // Colspan ajustado para 7 colunas
            if (noOficinasMessage) noOficinasMessage.style.display = 'none';
        } finally {
            loadingSpinner.style.display = 'none'; 
        }
    }

    if (searchButton) { 
        searchButton.addEventListener('click', () => {
            fetchOficinas(searchInput.value.trim());
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                fetchOficinas(searchInput.value.trim());
            }
        });
    }

    async function handleVerDetalhesClick(oficinaId) {
        console.log("Botão Ver Detalhes clicado para oficina:", oficinaId);
        
        if (window.showScreen) { 
           window.showScreen('detalhes-oficina', { officeId: oficinaId });
        } else {
           console.warn("A função 'showScreen' não está definida globalmente para navegação.");
           alert(`Detalhes da Oficina (ID: ${oficinaId}). Função de navegação indisponível.`);
        }
    }

    fetchOficinas();
}
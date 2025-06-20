// src/screens/detalhes-oficina/detalhes-oficina.js
import { db } from "../../firebase/firebase-config.js";
import { doc, getDoc } from 'firebase/firestore';

// A função initDetalhesOficina agora aceita um objeto 'params'
// e extrai o 'officeId' dele.
export async function initDetalhesOficina(params) {
    // Extrai officeId do objeto params com segurança
    const officeId = params?.officeId; 

    console.log(`Inicializando tela de Detalhes da Oficina para ID: ${officeId}`);

    const officeTitle = document.getElementById('office-title');
    const officeImage = document.getElementById('office-image');
    const officeDescriptionText = document.getElementById('office-description-text');
    const officeHoursText = document.getElementById('office-hours-text');
    const officeLocationText = document.getElementById('office-location-text');
    const officeStatusText = document.getElementById('office-status-text');
    const officeCoordinatorText = document.getElementById('office-coordinator-text');
    const formMessage = document.getElementById('formMessage');
    const solicitarCertificadoBtn = document.getElementById('solicitarCertificadoBtn');
    const voltarParaListaBtn = document.getElementById('voltarParaLista');

    // Validação inicial para elementos do DOM (importante para evitar erros nulos)
    if (!officeTitle || !officeImage || !officeDescriptionText || !officeHoursText || 
        !officeLocationText || !officeStatusText || !officeCoordinatorText || 
        !formMessage || !solicitarCertificadoBtn || !voltarParaListaBtn) {
        console.error("Um ou mais elementos do DOM não foram encontrados na tela de detalhes da oficina. Verifique o HTML.");
        return; 
    }

    // Limpa mensagens de feedback e esconde o botão de solicitação inicialmente
    formMessage.textContent = '';
    formMessage.classList.remove('success', 'error');
    solicitarCertificadoBtn.style.display = 'none'; // Esconde o botão até os detalhes serem carregados com sucesso

    if (!officeId) {
        officeTitle.textContent = "Oficina não encontrada.";
        formMessage.textContent = "ID da oficina não fornecido. Por favor, selecione uma oficina na lista.";
        formMessage.classList.add('error');
        return;
    }

    try {
        const officeRef = doc(db, "oficinas", officeId);
        const docSnap = await getDoc(officeRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Dados da oficina carregados:", data);

            officeTitle.textContent = data.nome || 'Nome não disponível';
            officeImage.src = data.imagemUrl || 'https://via.placeholder.com/400x250?text=Sem+Imagem'; 
            officeImage.alt = `Imagem da oficina ${data.nome || ''}`;
            officeDescriptionText.textContent = data.descricao || 'Descrição não disponível';
            officeHoursText.textContent = data.cargaHoraria ? `${data.cargaHoraria}` : 'N/A';
            officeLocationText.textContent = data.local || 'N/A';
            officeStatusText.textContent = data.status || 'N/A';
            
            // Buscar o nome do coordenador (assumindo que 'coordenadorId' está na oficina)
            if (data.coordenadorId) {
                const coordinatorRef = doc(db, "coordenadores", data.coordenadorId);
                const coordinatorSnap = await getDoc(coordinatorRef);
                if (coordinatorSnap.exists()) {
                    officeCoordinatorText.textContent = coordinatorSnap.data().nome || 'Coordenador desconhecido';
                } else {
                    officeCoordinatorText.textContent = 'Coordenador não encontrado';
                }
            } else {
                officeCoordinatorText.textContent = 'N/A';
            }

            // Exibe o botão de solicitar certificado e configura o clique após carregar os detalhes
            solicitarCertificadoBtn.style.display = 'block';
            solicitarCertificadoBtn.onclick = () => {
                if (window.showScreen) {
                    // Navega para a tela de solicitação de certificado, passando o ID da oficina
                    window.showScreen('solicitar-certificado', { officeId: officeId });
                } else {
                    console.warn("A função 'showScreen' não está definida globalmente para navegação.");
                    alert(`Redirecionamento para solicitação de certificado (Oficina ID: ${officeId}). Função de navegação indisponível.`);
                }
            };

        } else {
            officeTitle.textContent = "Oficina não encontrada.";
            formMessage.textContent = "Nenhuma oficina encontrada com este ID.";
            formMessage.classList.add('error');
            solicitarCertificadoBtn.style.display = 'none'; // Garante que o botão não apareça
        }
    } catch (error) {
        console.error("Erro ao carregar detalhes da oficina:", error);
        officeTitle.textContent = "Erro ao carregar oficina.";
        formMessage.textContent = `Erro ao carregar detalhes: ${error.message}`;
        formMessage.classList.add('error');
        solicitarCertificadoBtn.style.display = 'none'; // Garante que o botão não apareça
    }

    // Configurar o botão de voltar
    voltarParaListaBtn.addEventListener('click', () => {
        if (window.showScreen) {
            window.showScreen('lista-oficinas'); // Volta para a tela de listagem de oficinas
        } else {
            console.warn("A função 'showScreen' não está definida globalmente para navegação.");
            alert("Redirecionamento para a lista de oficinas. Função de navegação indisponível.");
        }
    });
}
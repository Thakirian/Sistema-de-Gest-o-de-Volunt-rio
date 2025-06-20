import { db } from "../../firebase/firebase-config.js";
import { doc, getDoc } from 'firebase/firestore';

export async function initDetalhesOficina(params) {
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

    if (!officeTitle || !officeImage || !officeDescriptionText || !officeHoursText || 
        !officeLocationText || !officeStatusText || !officeCoordinatorText || 
        !formMessage || !solicitarCertificadoBtn || !voltarParaListaBtn) {
        console.error("Um ou mais elementos do DOM não foram encontrados na tela de detalhes da oficina. Verifique o HTML.");
        return; 
    }

    formMessage.textContent = '';
    formMessage.classList.remove('success', 'error');
    solicitarCertificadoBtn.style.display = 'none';

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
            officeCoordinatorText.textContent = data.departamento || 'N/A'; 

            solicitarCertificadoBtn.style.display = 'block';
            solicitarCertificadoBtn.onclick = () => {
                if (window.showScreen) {
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
            solicitarCertificadoBtn.style.display = 'none';
        }
    } catch (error) {
        console.error("Erro ao carregar detalhes da oficina:", error);
        officeTitle.textContent = "Erro ao carregar oficina.";
        formMessage.textContent = `Erro ao carregar detalhes: ${error.message}`;
        formMessage.classList.add('error');
        solicitarCertificadoBtn.style.display = 'none';
    }

    voltarParaListaBtn.addEventListener('click', () => {
        if (window.showScreen) {
            window.showScreen('lista-oficinas');
        } else {
            console.warn("A função 'showScreen' não está definida globalmente para navegação.");
            alert("Redirecionamento para a lista de oficinas. Função de navegação indisponível.");
        }
    });
}
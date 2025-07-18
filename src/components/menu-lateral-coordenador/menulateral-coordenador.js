import { auth_mod } from "../../firebase/firebase-config.js";
import { signOut } from 'firebase/auth';

// Exporta uma função de inicialização para ser chamada pelas telas do usuário
export function initMenuLateralCoordenador(loadScreenCallback, userName, userRole) {
    console.log("Inicializando menu lateral do coordenador...");

    const userNameSidebarDisplay = document.getElementById('user-name-sidebar');
    const userRoleSidebarDisplay = document.getElementById('user-role-sidebar');
    const logoutBtnSidebar = document.getElementById('logout-btn-sidebar');
    const menuItems = document.querySelectorAll('.sidebar .menu-item'); 

    // Preenche as informações do usuário
    if (userNameSidebarDisplay) userNameSidebarDisplay.textContent = userName || "Coordenador"; 
    if (userRoleSidebarDisplay) userRoleSidebarDisplay.textContent = userRole || "Coordenador"; 
    // Adiciona event listeners aos itens do menu
    menuItems.forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault();
            const screenId = item.dataset.screenId;
            if (loadScreenCallback) {
                loadScreenCallback(screenId);
            }

            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Configura o botão de Logout
    if (logoutBtnSidebar) {
        logoutBtnSidebar.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
                await signOut(auth_mod);
                alert("Você foi desconectado com sucesso!");
                window.location.href = '../../screans/login/login.html'; 
            } catch (error) {
                console.error("Erro ao fazer logout:", error);
                alert("Erro ao desconectar. Tente novamente.");
            }
        });
    }

    // Define o item "Dashboard" como ativo por padrão se nenhum estiver
    const initialActiveItem = document.querySelector('.sidebar .menu-item.active');
    if (!initialActiveItem) {
        const dashboardItem = document.querySelector('.sidebar .menu-item[data-screen-id="dashboard"]');
        if (dashboardItem) {
            dashboardItem.classList.add('active');
        }
    }
}
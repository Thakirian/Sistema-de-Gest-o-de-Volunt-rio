// src/screens/dashboard-voluntario/dashboard-voluntario.js
import { auth_mod, db } from "../../firebase/firebase-config.js";
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Importa a função de inicialização da tela de lista de oficinas
import { initListaOficinas } from '../lista-oficinas/lista-oficinas.js';

// Importa a função de inicialização da tela de histórico de solicitações
import { initHistoricoSolicitacoes } from '../historico-solicitacoes/historico-solicitacoes.js'; 

// Importa a função de inicialização da tela de solicitar certificado 
import { initSolicitarCertificado } from '../solicitar-certificado/solicitar-certificado.js';

// Importa a função de inicialização da tela de perfil do voluntário
import { initPerfilVoluntario } from '../perfil-voluntario/perfil-voluntario.js'; // Adicione esta linha


// Importa a função de inicialização do componente menu lateral do voluntário
import { initMenuLateralVoluntario } from '../../components/menu-lateral-voluntario/menulateral-voluntario.js';


document.addEventListener('DOMContentLoaded', async () => {
    const horasAcumuladasDisplay = document.getElementById('horas-acumuladas');
    const horasMesDisplay = document.getElementById('horas-mes');
    const totalOficinasListadasDisplay = document.getElementById('total-oficinas-listadas');
    const oficinasAtivasInfoDisplay = document.getElementById('oficinas-ativas-info');
    const solicitacoesPendentesDisplay = document.getElementById('solicitacoes-pendentes');
    const minhasSolicitacoesTableBody = document.getElementById('minhas-solicitacoes-table').querySelector('tbody');

    const sidebarContainer = document.getElementById('sidebar-container');

    // Define os caminhos para as outras telas que serão carregadas dinamicamente
    const screenPaths = {
        'lista-oficinas': '../lista-oficinas/lista-oficinas.html', 
        'historico-solicitacoes': '../historico-solicitacoes/historico-solicitacoes.html',
        'solicitar-certificado': '../solicitar-certificado/solicitar-certificado.html',
        'perfil': '../perfil-voluntario/perfil-voluntario.html'
    };

    // Define as funções de inicialização para as outras telas (se houver JS específico para elas)
    const screenInitializers = {
        'lista-oficinas': initListaOficinas,
        'historico-solicitacoes': initHistoricoSolicitacoes,
        'solicitar-certificado': initSolicitarCertificado,
        'perfil': initPerfilVoluntario
    };

    // Função para carregar o conteúdo HTML de uma tela secundária
    async function loadScreenContent(screenId, path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const htmlContent = await response.text();
            document.getElementById(screenId).innerHTML = htmlContent;
        } catch (error) {
            console.error(`Erro ao carregar o conteúdo da tela ${screenId} de ${path}:`, error);
            document.getElementById(screenId).innerHTML = `<p style="color: red;">Erro ao carregar esta seção.</p>`;
        }
    }

    // Função principal para mostrar uma tela 
    window.showScreen = async (screenId) => {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });

        const targetScreen = document.getElementById(screenId);
        targetScreen.classList.add('active');

        // Se a tela ainda não foi carregada e tem um caminho definido
        if (screenPaths[screenId] && !targetScreen.dataset.loaded) {
            await loadScreenContent(screenId, screenPaths[screenId]);
            targetScreen.dataset.loaded = 'true'; // Marca como carregada

            // Se houver uma função de inicialização para esta tela, chame-a
            if (screenInitializers[screenId]) {
                screenInitializers[screenId]();
            }
        } else if (screenInitializers[screenId] && targetScreen.dataset.loaded) {
            screenInitializers[screenId]();
        }

        // Atualiza a classe 'active' nos itens do menu lateral
        const menuItems = document.querySelectorAll('.sidebar .menu-item');
        menuItems.forEach(item => {
            if (item.dataset.screenId === screenId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    };

    // Lógica para carregar e inicializar o menu lateral do voluntário
    async function loadAndInitMenuLateralVoluntario(userName, userRole) {
        try {
            // Carrega o HTML do menu lateral
            const response = await fetch('../../components/menu-lateral-voluntario/menulateral-voluntario.html');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const htmlContent = await response.text();
            sidebarContainer.innerHTML = htmlContent;

            // Inicia o JavaScript do menu lateral, passando a função showScreen
            initMenuLateralVoluntario(window.showScreen, userName, userRole);
        } catch (error) {
            console.error("Erro ao carregar e inicializar o menu lateral do voluntário:", error);
            sidebarContainer.innerHTML = '<p style="color: red;">Erro ao carregar menu lateral.</p>';
        }
    }

    // Observa o estado de autenticação do usuário
    onAuthStateChanged(auth_mod, async (user) => {
        if (user) {
            console.log("Usuário logado:", user.email);

            try {
                const voluntarioRef = doc(db, "voluntarios", user.uid);
                let voluntarioSnap = await getDoc(voluntarioRef);
                let userData = voluntarioSnap.data();
                
                // Inicializa campos padrão se não existirem
                let needsUpdate = false;
                const defaultVoluntarioValues = {
                    horasAcumuladas: 0,
                    horasUltimoMes: 0,
                    solicitacoesPendentes: 0,
                };

                for (const key in defaultVoluntarioValues) {
                    if (userData[key] === undefined) {
                        userData[key] = defaultVoluntarioValues[key];
                        needsUpdate = true;
                    }
                }

                if (needsUpdate) {
                    console.log("Inicializando campos ausentes no perfil do voluntário...");
                    await updateDoc(voluntarioRef, userData);
                    voluntarioSnap = await getDoc(voluntarioRef);
                    userData = voluntarioSnap.data();
                }

                await loadAndInitMenuLateralVoluntario(userData.nome, "Voluntário");

                // Preenche os dados da dashboard com valores do Firestore
                if (horasAcumuladasDisplay) horasAcumuladasDisplay.textContent = userData.horasAcumuladas || 0;
                if (horasMesDisplay) horasMesDisplay.textContent = `Último mês: ${userData.horasUltimoMes || 0}h`;

                const oficinasCollectionRef = collection(db, "oficinas");
                const oficinasSnap = await getDocs(oficinasCollectionRef);
                const totalOficinas = oficinasSnap.size;
                if (totalOficinasListadasDisplay) totalOficinasListadasDisplay.textContent = totalOficinas;
                
                const qAtivas = query(oficinasCollectionRef, where("status", "==", "ativa"));
                const oficinasAtivasSnap = await getDocs(qAtivas);
                if (oficinasAtivasInfoDisplay) oficinasAtivasInfoDisplay.textContent = `Ativas: ${oficinasAtivasSnap.size}`;

                const solicitacoesCollectionRef = collection(db, "solicitacoesCertificado");
                const qMinhasSolicitacoesPendentes = query(
                    solicitacoesCollectionRef, 
                    where("voluntarioId", "==", user.uid),
                    where("status", "==", "pendente")
                );
                const solicitacoesPendentesSnap = await getDocs(qMinhasSolicitacoesPendentes);
                if (solicitacoesPendentesDisplay) solicitacoesPendentesDisplay.textContent = solicitacoesPendentesSnap.size;

                if (minhasSolicitacoesTableBody) {
                    minhasSolicitacoesTableBody.innerHTML = '';

                    const qRecentes = query(
                        solicitacoesCollectionRef, 
                        where("voluntarioId", "==", user.uid),
                    );
                    const recentesSnap = await getDocs(qRecentes);
                    let solicitacoesRecentes = recentesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    if (solicitacoesRecentes.length > 0) {
                        // Ordenar por data
                        solicitacoesRecentes.sort((a, b) => {
                            const dateA = a.dataSolicitacao ? a.dataSolicitacao.toDate() : new Date(0);
                            const dateB = b.dataSolicitacao ? b.dataSolicitacao.toDate() : new Date(0);
                            return dateB.getTime() - dateA.getTime();
                        });
                        
                        // Limitar a 5 para exibir na dashboard, se não usar limit no Firestore
                        const displayedSolicitations = solicitacoesRecentes.slice(0, 5);

                        for (const solicitacao of displayedSolicitations) {
                            let nomeOficina = "Oficina Desconhecida";
                            if (solicitacao.oficinaId) {
                                const oficinaDoc = await getDoc(doc(db, "oficinas", solicitacao.oficinaId));
                                if (oficinaDoc.exists()) {
                                    nomeOficina = oficinaDoc.data().nome;
                                }
                            }

                            const row = `
                                <tr>
                                    <td>${nomeOficina}</td>
                                    <td>${solicitacao.dataSolicitacao ? solicitacao.dataSolicitacao.toDate().toLocaleDateString('pt-BR') : 'N/A'}</td>
                                    <td><span class="status-${solicitacao.status}">${solicitacao.status}</span></td>
                                    <td>${solicitacao.cargaHoraria || 'N/A'}</td>
                                </tr>
                            `;
                            minhasSolicitacoesTableBody.innerHTML += row;
                        }
                    } else {
                        minhasSolicitacoesTableBody.innerHTML = `
                            <tr>
                                <td colspan="4" style="text-align: center;">Nenhuma solicitação recente.</td>
                            </tr>
                        `;
                    }
                }

            } catch (error) {
                console.error("Erro ao carregar ou inicializar dados do voluntário:", error);
                alert("Erro ao carregar seu perfil. Por favor, tente novamente. Se o problema persistir, contate o suporte.");
            }

        } else {
            console.log("Nenhum usuário logado. Redirecionando para login.");
            window.location.href = '../login/login.html';
        }
    });
});
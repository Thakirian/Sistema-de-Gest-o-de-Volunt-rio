// src/screens/dashboard-voluntario/dashboard-voluntario.js
import { auth_mod, db } from "../../firebase/firebase-config.js";
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Importa a função de inicialização das telas secundárias
import { initListaOficinas } from '../lista-oficinas/lista-oficinas.js';
import { initHistoricoSolicitacoes } from '../historico-solicitacoes/historico-solicitacoes.js'; 
import { initSolicitarCertificado } from '../solicitar-certificado/solicitar-certificado.js';
import { initPerfilVoluntario } from '../perfil-voluntario/perfil-voluntario.js';
import { initDetalhesOficina } from "../detalhes-oficina/detalhes-oficina.js";


// Importa a função de inicialização do componente menu lateral do voluntário
import { initMenuLateralVoluntario } from '../../components/menu-lateral-voluntario/menulateral-voluntario.js';


document.addEventListener('DOMContentLoaded', async () => {
    // Referências aos elementos da dashboard principal
    const horasAcumuladasDisplay = document.getElementById('horas-acumuladas');
    const horasMesDisplay = document.getElementById('horas-mes');
    const totalOficinasListadasDisplay = document.getElementById('total-oficinas-listadas');
    const oficinasAtivasInfoDisplay = document.getElementById('oficinas-ativas-info');
    const solicitacoesPendentesDisplay = document.getElementById('solicitacoes-pendentes');
    const minhasSolicitacoesTableBody = document.getElementById('minhas-solicitacoes-table')?.querySelector('tbody');

    const sidebarContainer = document.getElementById('sidebar-container');
    
    // Define os caminhos para as outras telas que serão carregadas dinamicamente
    const screenPaths = {
        'lista-oficinas': '../lista-oficinas/lista-oficinas.html', 
        'historico-solicitacoes': '../historico-solicitacoes/historico-solicitacoes.html',
        'solicitar-certificado': '../solicitar-certificado/solicitar-certificado.html',
        'perfil': '../perfil-voluntario/perfil-voluntario.html',
        'detalhes-oficina': '../detalhes-oficina/detalhes-oficina.html'
    };

    // Define as funções de inicialização para as outras telas
    const screenInitializers = {
        'lista-oficinas': initListaOficinas,
        'historico-solicitacoes': initHistoricoSolicitacoes,
        'solicitar-certificado': initSolicitarCertificado,
        'perfil': initPerfilVoluntario,
        'detalhes-oficina': initDetalhesOficina
    };

    // Função para carregar o conteúdo HTML de uma tela secundária
    async function loadScreenContent(screenId, path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const htmlContent = await response.text();
            const targetScreen = document.getElementById(screenId); 
            if (targetScreen) {
                targetScreen.innerHTML = htmlContent;
            } else {
                console.error(`[loadScreenContent] Erro: targetScreen para '${screenId}' é null. Isso não deveria acontecer se showScreen verificou.`);
            }
        } catch (error) {
            console.error(`Erro ao carregar o conteúdo da tela ${screenId} de ${path}:`, error);
            const targetScreen = document.getElementById(screenId);
            if (targetScreen) {
                targetScreen.innerHTML = `<p style="color: red;">Erro ao carregar esta seção.</p>`;
            }
        }
    }

    // Função principal para mostrar uma tela - AGORA ACEITA PARÂMETROS!
    window.showScreen = async (screenId, params = {}) => {
        console.log(`[showScreen] Tentando navegar para a tela: ${screenId} com params:`, params);

        const allScreens = document.querySelectorAll('.screen');
        if (allScreens.length === 0) {
            console.error("[showScreen] Nenhuma div com a classe 'screen' encontrada no DOM. O HTML pode não estar correto.");
            alert("Erro interno: Estrutura de tela principal não encontrada.");
            return;
        }

        // Esconde todas as telas
        allScreens.forEach(screen => {
            screen.classList.remove('active');
        });

        let targetScreen = document.getElementById(screenId);

        // *** VERIFICAÇÃO CRÍTICA DO ERRO DE NULL ***
        if (!targetScreen) {
            console.error(`[showScreen] ERRO: Div para a tela '${screenId}' NÃO ENCONTRADA no HTML. Verifique o ID: "${screenId}" e a presença da div no dashboard-voluntario.html.`);
            alert(`Erro interno: A tela "${screenId}" não pôde ser carregada. Por favor, tente novamente ou contate o suporte.`);
            return; // Sai da função para evitar o TypeError
        }
        console.log(`[showScreen] Div encontrada para '${screenId}':`, targetScreen); 

        // Se a tela ainda não foi carregada e tem um caminho definido
        if (screenPaths[screenId] && !targetScreen.dataset.loaded) {
            await loadScreenContent(screenId, screenPaths[screenId]);
            targetScreen.dataset.loaded = 'true'; // Marca como carregada
            console.log(`[showScreen] HTML da tela '${screenId}' carregado e injetado.`);

            // Chama a função de inicialização, passando os parâmetros
            if (screenInitializers[screenId]) {
                // Passa o objeto 'params' completo para a função de inicialização
                await screenInitializers[screenId](params); 
                console.log(`[showScreen] Função de inicialização para '${screenId}' executada com parâmetros.`);
            } else {
                console.warn(`[showScreen] Função de inicialização para a tela '${screenId}' não encontrada.`);
            }
        } else if (screenInitializers[screenId] && targetScreen.dataset.loaded) {
            // Se a tela já foi carregada, apenas reinicializa se necessário (passa params novamente)
            await screenInitializers[screenId](params); 
            console.log(`[showScreen] Função de inicialização para '${screenId}' re-executada.`);
        }
        
        targetScreen.classList.add('active'); 
        console.log(`[showScreen] Classe 'active' adicionada à tela '${screenId}'.`);

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
            const response = await fetch('../../components/menu-lateral-voluntario/menulateral-voluntario.html');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const htmlContent = await response.text();
            if (sidebarContainer) {
                sidebarContainer.innerHTML = htmlContent;
                initMenuLateralVoluntario(window.showScreen, userName, userRole);
            } else {
                console.error("Sidebar container não encontrado.");
            }
        } catch (error) {
            console.error("Erro ao carregar e inicializar o menu lateral do voluntário:", error);
            if (sidebarContainer) {
                sidebarContainer.innerHTML = '<p style="color: red;">Erro ao carregar menu lateral.</p>';
            }
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
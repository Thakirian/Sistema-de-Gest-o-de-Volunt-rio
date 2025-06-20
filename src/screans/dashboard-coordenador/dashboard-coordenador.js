// src/screens/dashboard-coordenador/dashboard-coordenador.js
import { auth_mod, db } from "../../firebase/firebase-config.js";
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

// Importa as funções de inicialização para as outras telas do Coordenador
import { initGerenciarOficinas } from '../gerenciar-oficinas/gerenciar-oficinas.js';
import { initVisualizarSolicitacoes } from '../visualizar-solicitacoes/visualizar-solicitacoes.js';
// import { initPerfilCoordenador } from '../perfil-coordenador/perfil-coordenador.js';

// Importa a função de inicialização do componente menu lateral do coordenador
import { initMenuLateralCoordenador } from '../../components/menu-lateral-coordenador/menulateral-coordenador.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Referências aos elementos HTML do dashboard do coordenador
    const totalOficinasAtivasDisplay = document.getElementById('total-oficinas-ativas');
    const oficinasMesDisplay = document.getElementById('oficinas-mes');
    const totalVoluntariosCadastradosDisplay = document.getElementById('total-voluntarios-cadastrados');
    const voluntariosNovosMesDisplay = document.getElementById('voluntarios-novos-mes');
    const totalSolicitacoesPendentesDisplay = document.getElementById('total-solicitacoes-pendentes'); // Se você tiver um display para isso
    const ultimasSolicitacoesCertificadosTableBody = document.getElementById('ultimas-solicitacoes-certificados-table').querySelector('tbody');
    const oficinasRecentesTableBody = document.getElementById('oficinas-recentes-table').querySelector('tbody');

    const sidebarContainer = document.getElementById('sidebar-container');

    // Define os caminhos para as outras telas que serão carregadas dinamicamente
    const screenPaths = {
        'gerenciar-oficinas': '../gerenciar-oficinas/gerenciar-oficinas.html',
        'visualizar-solicitacoes': '../visualizar-solicitacoes/visualizar-solicitacoes.html',
        // 'perfil-coordenador': '../perfil-coordenador/perfil-coordenador.html'
    };

    // Define as funções de inicialização para as outras telas (se houver JS específico para elas)
    const screenInitializers = {
        'gerenciar-oficinas': initGerenciarOficinas,
        'visualizar-solicitacoes': initVisualizarSolicitacoes,
        // 'perfil-coordenador': initPerfilCoordenador
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

    // Lógica para carregar e inicializar o menu lateral do coordenador
    async function loadAndInitMenuLateralCoordenador(userName, userRole) {
        try {
            // Carrega o HTML do menu lateral
            const response = await fetch ('../../components/menu-lateral-coordenador/menulateral-coordenador.html');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const htmlContent = await response.text();
            sidebarContainer.innerHTML = htmlContent;

            // Inicia o JavaScript do menu lateral, passando a função showScreen
            initMenuLateralCoordenador(window.showScreen, userName, userRole);
        } catch (error) {
            console.error("Erro ao carregar e inicializar o menu lateral do coordenador:", error);
            sidebarContainer.innerHTML = '<p style="color: red;">Erro ao carregar menu lateral.</p>';
        }
    }

    // Observa o estado de autenticação do usuário
    onAuthStateChanged(auth_mod, async (user) => {
        if (user) {
            console.log("Usuário logado:", user.email);

            try {
                const coordenadorRef = doc(db, "coordenadores", user.uid);
                let coordenadorSnap = await getDoc(coordenadorRef);
                let userData = coordenadorSnap.data();

                // Inicializa campos padrão se não existirem
                let needsUpdate = false;
                const defaultCoordenadorValues = {
                    nome: user.displayName || "Coordenador Desconhecido", 
                    tipo: "Coordenador",                                
                    dataCriacao: new Date(),
                };

                // Lógica para lidar com documentos que não existem ou estão vazios
                if (!coordenadorSnap.exists()) {
                    console.warn("Documento do coordenador não encontrado no Firestore. Criando um novo.");
                    userData = { ...defaultCoordenadorValues };
                    needsUpdate = true;
                } else if (!userData) { // Isso acontece se o documento existe mas não tem dados (é vazio)
                    console.warn("Documento do coordenador existe mas está vazio. Inicializando com dados padrão.");
                    userData = { ...defaultCoordenadorValues };
                    needsUpdate = true;
                } else {
                    // Verifica se algum campo de defaultCoordenadorValues está faltando no userData existente
                    for (const key in defaultCoordenadorValues) {
                        if (userData[key] === undefined) {
                            userData[key] = defaultCoordenadorValues[key];
                            needsUpdate = true;
                        }
                    }
                }

                if (needsUpdate) {
                    console.log("Atualizando perfil do coordenador com campos ausentes ou novos dados...");
                    await updateDoc(coordenadorRef, userData);
                    coordenadorSnap = await getDoc(coordenadorRef); // Recarrega os dados atualizados
                    userData = coordenadorSnap.data(); // Atualiza userData com os dados recém-gravados
                }

                await loadAndInitMenuLateralCoordenador(userData.nome, userData.tipo); 

                // --- Preenchimento dos cards de estatísticas ---
                if (totalOficinasAtivasDisplay) {
                    const oficinasCollectionRef = collection(db, "oficinas");
                    const qAtivas = query(oficinasCollectionRef, where("status", "==", "ativa"));
                    const oficinasAtivasSnap = await getDocs(qAtivas);
                    totalOficinasAtivasDisplay.textContent = oficinasAtivasSnap.size;

                    // Calcular oficinas novas este mês (exemplo: criado nos últimos 30 dias)
                    const umMesAtras = new Date();
                    umMesAtras.setMonth(umMesAtras.getMonth() - 1);
                    const umMesAtrasTimestamp = new Date(umMesAtras); // Converter para data JS para Timestamp do Firestore
                    
                    const qNovasMes = query(oficinasCollectionRef, where("dataCriacao", ">=", umMesAtrasTimestamp)); // Assumindo campo 'dataCriacao'
                    const oficinasNovasMesSnap = await getDocs(qNovasMes);
                    if (oficinasMesDisplay) oficinasMesDisplay.textContent = `Novas este mês: ${oficinasNovasMesSnap.size}`;
                }

                if (totalVoluntariosCadastradosDisplay) {
                    const voluntariosCollectionRef = collection(db, "voluntarios");
                    const voluntariosSnap = await getDocs(voluntariosCollectionRef);
                    totalVoluntariosCadastradosDisplay.textContent = voluntariosSnap.size;

                    // Calcular voluntários novos este mês
                    const umMesAtras = new Date();
                    umMesAtras.setMonth(umMesAtras.getMonth() - 1);
                    const umMesAtrasTimestamp = new Date(umMesAtras);

                    const qVoluntariosNovosMes = query(voluntariosCollectionRef, where("dataCadastro", ">=", umMesAtrasTimestamp)); // Usando dataCadastro
                    const voluntariosNovosMesSnap = await getDocs(qVoluntariosNovosMes);
                    if (voluntariosNovosMesDisplay) voluntariosNovosMesDisplay.textContent = `Novos este mês: ${voluntariosNovosMesSnap.size}`;
                }

                if (totalSolicitacoesPendentesDisplay) {
                    const solicitacoesCollectionRef = collection(db, "solicitacoesCertificado");
                    const qSolicitacoesPendentes = query(solicitacoesCollectionRef, where("status", "==", "pendente"));
                    const solicitacoesPendentesSnap = await getDocs(qSolicitacoesPendentes);
                    totalSolicitacoesPendentesDisplay.textContent = solicitacoesPendentesSnap.size;
                }

                // --- Preenchimento da tabela de Últimas Solicitações de Certificado ---
                if (ultimasSolicitacoesCertificadosTableBody) {
                    ultimasSolicitacoesCertificadosTableBody.innerHTML = ''; // Limpa antes de preencher

                    const solicitacoesCollectionRef = collection(db, "solicitacoesCertificado");
                    const qRecentesSolicitacoes = query(
                        solicitacoesCollectionRef, 
                        orderBy("dataSolicitacao", "desc"), 
                        limit(5) 
                    );
                    const recentesSolicitacoesSnap = await getDocs(qRecentesSolicitacoes);
                    let solicitacoesRecentes = recentesSolicitacoesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    if (solicitacoesRecentes.length > 0) {
                        for (const solicitacao of solicitacoesRecentes) {
                            let nomeOficina = "Oficina Desconhecida";
                            if (solicitacao.oficinaId) {
                                const oficinaDoc = await getDoc(doc(db, "oficinas", solicitacao.oficinaId));
                                if (oficinaDoc.exists()) {
                                    nomeOficina = oficinaDoc.data().nome;
                                }
                            }

                            let nomeVoluntario = "Voluntário Desconhecido";
                            if (solicitacao.voluntarioId) {
                                const voluntarioDoc = await getDoc(doc(db, "voluntarios", solicitacao.voluntarioId));
                                if (voluntarioDoc.exists()) {
                                    nomeVoluntario = voluntarioDoc.data().nome;
                                }
                            }

                            const row = `
                                <tr>
                                    <td>${nomeVoluntario}</td>
                                    <td>${nomeOficina}</td>
                                    <td>${solicitacao.dataSolicitacao ? solicitacao.dataSolicitacao.toDate().toLocaleDateString('pt-BR') : 'N/A'}</td>
                                    <td><span class="status-${solicitacao.status}">${solicitacao.status}</span></td>
                                    <td>${solicitacao.cargaHoraria || 'N/A'}</td>
                                </tr>
                            `;
                            ultimasSolicitacoesCertificadosTableBody.innerHTML += row;
                        }
                    } else {
                        ultimasSolicitacoesCertificadosTableBody.innerHTML = `
                            <tr>
                                <td colspan="5" style="text-align: center;">Nenhuma solicitação recente.</td>
                            </tr>
                        `;
                    }
                }

                // --- Preenchimento da tabela de Oficinas Recentes Cadastradas ---
                if (oficinasRecentesTableBody) {
                    oficinasRecentesTableBody.innerHTML = ''; // Limpa antes de preencher

                    const oficinasCollectionRef = collection(db, "oficinas");
                    const qRecentesOficinas = query(
                        oficinasCollectionRef, 
                        orderBy("dataCriacao", "desc"), 
                        limit(5) 
                    );
                    const recentesOficinasSnap = await getDocs(qRecentesOficinas);
                    let oficinasRecentes = recentesOficinasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    if (oficinasRecentes.length > 0) {
                        for (const oficina of oficinasRecentes) {
                            const row = `
                                <tr>
                                    <td>${oficina.nome || 'N/A'}</td>
                                    <td>${oficina.dataCriacao ? oficina.dataCriacao.toDate().toLocaleDateString('pt-BR') : 'N/A'}</td>
                                    <td>${oficina.cargaHoraria || 'N/A'}h</td>
                                    <td><span class="status-${oficina.status || 'desconhecido'}">${oficina.status || 'Desconhecido'}</span></td>
                                </tr>
                            `;
                            oficinasRecentesTableBody.innerHTML += row;
                        }
                    } else {
                        oficinasRecentesTableBody.innerHTML = `
                            <tr>
                                <td colspan="4" style="text-align: center;">Nenhuma oficina recente.</td>
                            </tr>
                        `;
                    }
                }

            } catch (error) {
                console.error("Erro ao carregar ou inicializar dados do coordenador:", error);
                alert("Erro ao carregar seu perfil. Por favor, tente novamente. Se o problema persistir, contate o suporte.");
            }

        } else {
            console.log("Nenhum usuário logado. Redirecionando para login.");
            window.location.href = '../login/login.html';
        }
    });
});
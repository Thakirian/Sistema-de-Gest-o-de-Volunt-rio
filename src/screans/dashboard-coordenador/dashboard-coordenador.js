import { auth_mod, db } from "../../firebase/firebase-config.js";
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';

import { initGerenciarOficinas } from '../gerenciar-oficinas/gerenciar-oficinas.js';
import { initVisualizarSolicitacoes } from '../visualizar-solicitacoes/visualizar-solicitacoes.js';
import { initPerfilCoordenador } from '../perfil-coordenador/perfil-coordenador.js';

import { initMenuLateralCoordenador } from '../../components/menu-lateral-coordenador/menulateral-coordenador.js';

document.addEventListener('DOMContentLoaded', async () => {
    const totalOficinasAtivasDisplay = document.getElementById('total-oficinas-ativas');
    const oficinasMesDisplay = document.getElementById('oficinas-mes');
    const totalVoluntariosCadastradosDisplay = document.getElementById('total-voluntarios-cadastrados');
    const voluntariosNovosMesDisplay = document.getElementById('voluntarios-novos-mes');
    const totalSolicitacoesPendentesDisplay = document.getElementById('total-solicitacoes-pendentes');
    const ultimasSolicitacoesCertificadosTableBody = document.getElementById('ultimas-solicitacoes-certificados-table').querySelector('tbody');
    const oficinasRecentesTableBody = document.getElementById('oficinas-recentes-table').querySelector('tbody');

    const sidebarContainer = document.getElementById('sidebar-container');

    const screenPaths = {
        'gerenciar-oficinas': '../gerenciar-oficinas/gerenciar-oficinas.html',
        'visualizar-solicitacoes': '../visualizar-solicitacoes/visualizar-solicitacoes.html',
        'perfil-coordenador': '../perfil-coordenador/perfil-coordenador.html'
    };

    const screenInitializers = {
        'gerenciar-oficinas': initGerenciarOficinas,
        'visualizar-solicitacoes': initVisualizarSolicitacoes,
        'perfil-coordenador': initPerfilCoordenador
    };

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

    window.showScreen = async (screenId) => {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });

        const targetScreen = document.getElementById(screenId);
        targetScreen.classList.add('active');

        if (screenPaths[screenId] && !targetScreen.dataset.loaded) {
            await loadScreenContent(screenId, screenPaths[screenId]);
            targetScreen.dataset.loaded = 'true';

            if (screenInitializers[screenId]) {
                screenInitializers[screenId]();
            }
        } else if (screenInitializers[screenId] && targetScreen.dataset.loaded) {
            screenInitializers[screenId]();
        }

        const menuItems = document.querySelectorAll('.sidebar .menu-item');
        menuItems.forEach(item => {
            if (item.dataset.screenId === screenId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    };

    async function loadAndInitMenuLateralCoordenador(userName, userRole) {
        try {
            const response = await fetch('../../components/menu-lateral-coordenador/menulateral-coordenador.html');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const htmlContent = await response.text();
            sidebarContainer.innerHTML = htmlContent;

            initMenuLateralCoordenador(window.showScreen, userName, userRole);
        } catch (error) {
            console.error("Erro ao carregar e inicializar o menu lateral do coordenador:", error);
            sidebarContainer.innerHTML = '<p style="color: red;">Erro ao carregar menu lateral.</p>';
        }
    }

    onAuthStateChanged(auth_mod, async (user) => {
        if (user) {
            console.log("Usuário logado:", user.email);

            try {
                const coordenadorRef = doc(db, "coordenadores", user.uid);
                let coordenadorSnap = await getDoc(coordenadorRef);
                let userData = coordenadorSnap.data();

                let needsUpdate = false;
                const defaultCoordenadorValues = {
                    nome: user.displayName || "Coordenador Desconhecido",
                    tipo: "Coordenador",
                    dataCriacao: Timestamp.now(),
                };

                if (!coordenadorSnap.exists() || !userData) {
                    console.warn("Documento do coordenador não encontrado ou está vazio. Criando/inicializando com dados padrão.");
                    userData = { ...defaultCoordenadorValues };
                    needsUpdate = true;
                } else {
                    for (const key in defaultCoordenadorValues) {
                        if (userData[key] === undefined) {
                            userData[key] = defaultCoordenadorValues[key];
                            needsUpdate = true;
                        }
                    }
                    if (userData.dataCriacao && !(userData.dataCriacao instanceof Timestamp)) {
                        userData.dataCriacao = Timestamp.fromDate(new Date(userData.dataCriacao));
                        needsUpdate = true;
                    }
                }

                if (needsUpdate) {
                    console.log("Atualizando perfil do coordenador com campos ausentes ou novos dados...");
                    await updateDoc(coordenadorRef, userData);
                    coordenadorSnap = await getDoc(coordenadorRef);
                    userData = coordenadorSnap.data();
                }

                await loadAndInitMenuLateralCoordenador(userData.nome, userData.tipo);

                if (totalOficinasAtivasDisplay) {
                    const oficinasCollectionRef = collection(db, "oficinas");
                    const qAtivas = query(oficinasCollectionRef, where("status", "==", "ativa"));
                    const oficinasAtivasSnap = await getDocs(qAtivas);
                    totalOficinasAtivasDisplay.textContent = oficinasAtivasSnap.size;

                    const umMesAtras = new Date();
                    umMesAtras.setMonth(umMesAtras.getMonth() - 1);
                    const umMesAtrasTimestamp = Timestamp.fromDate(umMesAtras);
                    
                    const qNovasMes = query(oficinasCollectionRef, where("dataCriacao", ">=", umMesAtrasTimestamp));
                    const oficinasNovasMesSnap = await getDocs(qNovasMes);
                    if (oficinasMesDisplay) oficinasMesDisplay.textContent = `Novas este mês: ${oficinasNovasMesSnap.size}`;
                }

                if (totalVoluntariosCadastradosDisplay) {
                    const voluntariosCollectionRef = collection(db, "voluntarios");
                    const voluntariosSnap = await getDocs(voluntariosCollectionRef);
                    totalVoluntariosCadastradosDisplay.textContent = voluntariosSnap.size;

                    const umMesAtras = new Date();
                    umMesAtras.setMonth(umMesAtras.getMonth() - 1);
                    const umMesAtrasTimestamp = Timestamp.fromDate(umMesAtras);

                    const qVoluntariosNovosMes = query(voluntariosCollectionRef, where("dataCadastro", ">=", umMesAtrasTimestamp));
                    const voluntariosNovosMesSnap = await getDocs(qVoluntariosNovosMes);
                    if (voluntariosNovosMesDisplay) voluntariosNovosMesDisplay.textContent = `Novos este mês: ${voluntariosNovosMesSnap.size}`;
                }

                if (totalSolicitacoesPendentesDisplay) {
                    const solicitacoesCollectionRef = collection(db, "solicitacoesCertificado");
                    const qSolicitacoesPendentes = query(solicitacoesCollectionRef, where("status", "==", "pendente"));
                    const solicitacoesPendentesSnap = await getDocs(qSolicitacoesPendentes);
                    totalSolicitacoesPendentesDisplay.textContent = solicitacoesPendentesSnap.size;
                }

                if (ultimasSolicitacoesCertificadosTableBody) {
                    ultimasSolicitacoesCertificadosTableBody.innerHTML = '';

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

                            const dataSolicitacaoFormatada = solicitacao.dataSolicitacao instanceof Timestamp
                                ? solicitacao.dataSolicitacao.toDate().toLocaleDateString('pt-BR')
                                : (solicitacao.dataSolicitacao || 'N/A');

                            const row = `
                                <tr>
                                    <td>${nomeVoluntario}</td>
                                    <td>${nomeOficina}</td>
                                    <td>${dataSolicitacaoFormatada}</td>
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

                if (oficinasRecentesTableBody) {
                    oficinasRecentesTableBody.innerHTML = '';

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
                            const dataCriacaoFormatada = oficina.dataCriacao instanceof Timestamp
                                ? oficina.dataCriacao.toDate().toLocaleDateString('pt-BR')
                                : (oficina.dataCriacao || 'N/A');

                            const row = `
                                <tr>
                                    <td>${oficina.nome || 'N/A'}</td>
                                    <td>${dataCriacaoFormatada}</td>
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
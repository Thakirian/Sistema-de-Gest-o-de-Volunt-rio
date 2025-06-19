// src/screens/dashboard-voluntario/dashboard-voluntario.js
import { auth_mod, db } from "../../firebase/firebase-config.js";
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', async () => {
    const userNameDisplay = document.getElementById('user-name');
    const userRoleDisplay = document.getElementById('user-role');
    const logoutBtn = document.getElementById('logout-btn');

    // Elementos dos cartões de estatísticas (ajustados para as novas métricas)
    const horasAcumuladasDisplay = document.getElementById('horas-acumuladas');
    const horasMesDisplay = document.getElementById('horas-mes'); // Para horas do último mês
    const totalOficinasListadasDisplay = document.getElementById('total-oficinas-listadas');
    const oficinasAtivasInfoDisplay = document.getElementById('oficinas-ativas-info');
    const solicitacoesPendentesDisplay = document.getElementById('solicitacoes-pendentes');

    // Tabela de solicitações recentes na dashboard
    const minhasSolicitacoesTableBody = document.getElementById('minhas-solicitacoes-table').querySelector('tbody');

    // Função para mostrar a tela correta (Dashboard, Lista de Oficinas, etc.)
    window.showScreen = (screenId) => {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');

        // Atualiza o estado "active" no menu lateral
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.classList.remove('active');
        });
        const activeMenuItem = document.querySelector(`.menu-item[onclick*="${screenId}"]`);
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }
    };

    // 1. Verificar Autenticação e Carregar Dados
    onAuthStateChanged(auth_mod, async (user) => {
        if (user) {
            console.log("Usuário logado:", user.email);

            try {
                const voluntarioRef = doc(db, "voluntarios", user.uid);
                let voluntarioSnap = await getDoc(voluntarioRef);
                let userData = voluntarioSnap.data();
                
                // --- Início da lógica de inicialização de dados
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
                // --- Fim da lógica de inicialização de dados ---

                userNameDisplay.textContent = userData.nome || "Voluntário";
                userRoleDisplay.textContent = "Voluntário";

                // --- Preencher os dados da dashboard com valores do Firestore ---

                // Card: Horas Acumuladas
                horasAcumuladasDisplay.textContent = userData.horasAcumuladas || 0;
                horasMesDisplay.textContent = `Último mês: ${userData.horasUltimoMes || 0}h`;

                // Card: Oficinas Listadas 
                const oficinasCollectionRef = collection(db, "oficinas");
                const oficinasSnap = await getDocs(oficinasCollectionRef);
                const totalOficinas = oficinasSnap.size;
                totalOficinasListadasDisplay.textContent = totalOficinas;
                
                // Contar oficinas ativas (assumindo campo 'status' no documento da oficina)
                const qAtivas = query(oficinasCollectionRef, where("status", "==", "ativa"));
                const oficinasAtivasSnap = await getDocs(qAtivas);
                oficinasAtivasInfoDisplay.textContent = `Ativas: ${oficinasAtivasSnap.size}`;

                // Card: Solicitações Pendentes
                const solicitacoesCollectionRef = collection(db, "solicitacoesCertificado");
                const qMinhasSolicitacoesPendentes = query(
                    solicitacoesCollectionRef, 
                    where("voluntarioId", "==", user.uid),
                    where("status", "==", "pendente") 
                );
                const solicitacoesPendentesSnap = await getDocs(qMinhasSolicitacoesPendentes);
                solicitacoesPendentesDisplay.textContent = solicitacoesPendentesSnap.size;

                // --- Preencher tabela de Solicitações Recentes na Dashboard ---
                if (minhasSolicitacoesTableBody) {
                    minhasSolicitacoesTableBody.innerHTML = '';

                    // Buscar as solicitações do usuário 
                    const qRecentes = query(
                        solicitacoesCollectionRef, 
                        where("voluntarioId", "==", user.uid),
                    );
                    const recentesSnap = await getDocs(qRecentes);
                    let solicitacoesRecentes = recentesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    if (solicitacoesRecentes.length > 0) {
                        solicitacoesRecentes.sort((a, b) => {
                            const dateA = a.dataSolicitacao ? a.dataSolicitacao.toDate() : new Date(0);
                            const dateB = b.dataSolicitacao ? b.dataSolicitacao.toDate() : new Date(0);
                            return dateB.getTime() - dateA.getTime();
                        });
                        
                        const displayedSolicitations = solicitacoesRecentes.slice(0, 5); // Pega as 5 mais recentes

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
                signOut(auth_mod); 
                window.location.href = '../login/login.html';
            }

        } else {
            console.log("Nenhum usuário logado. Redirecionando para login.");
            window.location.href = '../login/login.html';
        }
    });

    // 2. Configurar o botão de Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
                await signOut(auth_mod);
                alert("Você foi desconectado com sucesso!");
                window.location.href = '../login/login.html';
            } catch (error) {
                console.error("Erro ao fazer logout:", error);
                alert("Erro ao desconectar. Tente novamente.");
            }
        });
    }
});
// src/screens/historico-solicitacoes/historico-solicitacoes.js

import { auth_mod, db } from "../../firebase/firebase-config.js";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; // Para garantir que o usuário esteja logado

export async function initHistoricoSolicitacoes() {
    console.log('Inicializando tela de Histórico de Solicitações...');
    const tableBody = document.querySelector('.solicitacoes-table tbody');

    tableBody.innerHTML = '';

    // Observa o estado de autenticação para garantir que temos o UID do usuário
    onAuthStateChanged(auth_mod, async (user) => {
        if (user) {
            const voluntarioId = user.uid;
            console.log(`Carregando histórico para o voluntário: ${voluntarioId}`);

            try {
                const solicitacoesCollectionRef = collection(db, "solicitacoesCertificado");

                // Cria uma consulta para pegar todas as solicitações deste voluntário
                // Ordenadas pela data da solicitação, mais recente primeiro
                const q = query(
                    solicitacoesCollectionRef,
                    where("voluntarioId", "==", voluntarioId),
                    orderBy("dataSolicitacao", "desc") 
                );

                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Nenhuma solicitação encontrada.</td></tr>';
                    console.log('Nenhuma solicitação encontrada para este usuário.');
                    return;
                }

                // Para cada solicitação, vamos buscar o nome da oficina
                for (const docSnapshot of querySnapshot.docs) {
                    const solicitacao = docSnapshot.data();
                    let nomeOficina = "Oficina Desconhecida";

                    // Se houver um oficinaId, busca o nome da oficina
                    if (solicitacao.oficinaId) {
                        try {
                            const oficinaDocRef = doc(db, "oficinas", solicitacao.oficinaId);
                            const oficinaSnap = await getDoc(oficinaDocRef);
                            if (oficinaSnap.exists()) {
                                nomeOficina = oficinaSnap.data().nome;
                            }
                        } catch (oficinaError) {
                            console.error("Erro ao buscar nome da oficina:", oficinaError);
                            nomeOficina = "Erro ao carregar Oficina";
                        }
                    }

                    // Formata a data
                    let formattedDate = 'N/A';
                    if (solicitacao.dataSolicitacao && solicitacao.dataSolicitacao.toDate) {
                        formattedDate = solicitacao.dataSolicitacao.toDate().toLocaleDateString('pt-BR');
                    } else if (typeof solicitacao.dataSolicitacao === 'string') {
                        formattedDate = solicitacao.dataSolicitacao;
                    }

                    // Cria a linha da tabela
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${formattedDate}</td>
                        <td>${nomeOficina}</td>
                        <td><span class="status ${solicitacao.status ? 'status-' + solicitacao.status.toLowerCase() : ''}">${solicitacao.status || 'N/A'}</span></td>
                        <td>${solicitacao.cargaHoraria || 'N/A'}</td>
                    `;
                    tableBody.appendChild(row);
                }
                console.log('Histórico de solicitações carregado do Firebase com sucesso.');

            } catch (error) {
                console.error('Erro ao carregar solicitações do Firebase:', error);
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: red;">Erro ao carregar suas solicitações. Tente novamente mais tarde.</td></tr>';
            }
        } else {
            console.log('Usuário não logado. Redirecionando ou exibindo mensagem.');
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Por favor, faça login para ver seu histórico de solicitações.</td></tr>';
        }
    });
}
// Importações do Firebase
import { auth, createUserWithEmailAndPassword } from './firebase-config.js';
import { db, addDoc, collection } from "./firebase-config.js";

document.getElementById('cadastro-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    event.stopPropagation(); 
    
    // Coletar dados do formulário
    const nome = document.getElementById('nome').value;
    const ra = document.getElementById('ra').value;
    const periodo = document.getElementById('periodo').value;
    const curso = document.getElementById('curso').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;

    // Validação básica
    if (senha !== confirmarSenha) {
        alert('As senhas não coincidem!');
        return;
    }

    // Validação de senha forte
    const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!senhaRegex.test(senha)) {
        alert('A senha não atende aos requisitos mínimos!');
        return;
    }

    try {
        // Criar usuário no Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        // Adicionar dados do usuário ao Firestore
        await addDoc(collection(db, "usuarios"), {
            uid: user.uid,
            nome: nome,
            ra: ra,
            periodo: periodo,
            curso: curso,
            email: email,
            tipo: "voluntario"
        });
        
        // Feedback visual sem redirecionamento
        alert('Cadastro realizado com sucesso!\nUID: ' + userCredential.user.uid);
        console.log('Usuário cadastrado:', userCredential.user);
        

    } catch (error) {
        console.error('Erro no cadastro:', error);
        let errorMessage = 'Erro ao cadastrar: ';
        
        switch(error.code) {
            case 'auth/email-already-in-use':
                errorMessage += 'E-mail já cadastrado';
                break;
            case 'auth/invalid-email':
                errorMessage += 'E-mail inválido';
                break;
            case 'auth/weak-password':
                errorMessage += 'Senha fraca (mínimo 6 caracteres)';
                break;
            default:
                errorMessage += error.message;
        }
        
        alert(errorMessage);
    }
});


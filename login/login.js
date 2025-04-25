document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    alert('Login realizado com sucesso!Bem-Vindo(a)!');
    window.location.href = '/index.html';
});
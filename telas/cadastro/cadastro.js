document.getElementById('cadastro-form').addEventListener('submit', function(event) {
    event.preventDefault();
    alert('Cadastro realizado com sucesso!');
    window.location.href = '/index.html';
});
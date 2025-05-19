document.getElementById('recuperar-form').addEventListener('submit', function(event) {
    event.preventDefault();
    alert('Acompanhe seu e-mail cadastrado para recuperação de senha.');
    window.location.href = '/src/screans/login/login.html';
});
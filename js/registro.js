// --- ARQUIVO COMPLETO: registro.js ---
document.getElementById('formRegistro').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Captura o perfil (Motorista ou Embarcador) selecionado na tela
    // ATENÇÃO: Verifique se o seu HTML tem um <select id="tipoUsuario">
    const roleSelect = document.getElementById('tipoUsuario');
    const role = roleSelect ? roleSelect.value : 'motorista'; 

    const dados = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        senha: document.getElementById('senha').value,
        telefone: document.getElementById('telefone') ? document.getElementById('telefone').value : '',
        role: role // Agora enviamos a ROLE correta pro servidor!
    };

    try {
        const response = await fetch('https://bom-frete-api-cleison.onrender.com/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Cadastro realizado com sucesso! Faça login.');
            window.location.href = 'login.html';
        } else {
            alert('Erro: ' + (result.msg || 'Erro ao cadastrar'));
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro de conexão com o servidor.');
    }
});
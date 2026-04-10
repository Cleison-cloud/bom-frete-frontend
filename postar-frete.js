document.getElementById('formPostarFrete').addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    
    // Trava de segurança: Exige o login
    if (!token) {
        alert("Erro: Você precisa estar logado como Empresa/Embarcador para postar!");
        window.location.href = 'login.html';
        return;
    }

    // Coleta dos dados do formulário
    const dados = {
        origem: document.getElementById('origem').value,
        destino: document.getElementById('destino').value,
        // Caso o ID do HTML seja diferente, ele não quebra o código
        produto: document.getElementById('produto') ? document.getElementById('produto').value : document.querySelector('textarea').value,
        valor: parseFloat(document.getElementById('valor').value) || 0,
        peso: document.getElementById('peso') ? parseFloat(document.getElementById('peso').value) : 0
    };

    try {
        // Rota ajustada exatamente para o que o seu painel está pedindo (/api/cargas)
        const response = await fetch('https://bom-frete-api-cleison.onrender.com/api/cargas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dados)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Sucesso! Sua carga já está visível para os motoristas.');
            window.location.href = 'dashboard.html'; // Volta pro painel
        } else {
            console.error('Erro do servidor:', result);
            alert('Erro: ' + (result.msg || 'Não foi possível publicar.'));
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
        alert('Erro de conexão: Verifique sua internet ou se o servidor está online.');
    }
});
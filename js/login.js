// ==========================================
// CONFIGURAÇÕES GERAIS
// ==========================================
const API_URL = 'https://bom-frete-api-cleison.onrender.com/api';

// ==========================================
// CONTROLE VISUAL DAS ABAS (Embarcador / Motorista)
// ==========================================
function selecionarPerfil(perfil) {
    const botoes = document.querySelectorAll('.tab-btn');
    botoes.forEach(btn => btn.classList.remove('active'));
    
    const emailInput = document.getElementById('email');
    
    if(perfil === 'embarcador') {
        botoes[0].classList.add('active');
        emailInput.placeholder = "E-mail do Embarcador";
    } else {
        botoes[1].classList.add('active');
        emailInput.placeholder = "E-mail do Motorista";
    }
}

// ==========================================
// SISTEMA DE LOGIN
// ==========================================
document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const erroMsg = document.getElementById('mensagem-erro');
    const btnSubmit = document.getElementById('btnSubmit');

    // Estado de Carregamento (UX)
    btnSubmit.innerText = "Processando...";
    btnSubmit.style.opacity = "0.7";
    btnSubmit.disabled = true;
    erroMsg.style.display = 'none';

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, senha: senha })
        });

        const data = await response.json();

        if (response.ok) {
            // Salva as credenciais no navegador
            localStorage.setItem('token', data.token);
            localStorage.setItem('bomfrete_token', data.token); // Redundância segura para o dashboard
            localStorage.setItem('role', data.role);
            
            // Redireciona para o Painel
            window.location.href = 'dashboard.html';
        } else {
            erroMsg.innerText = "❌ " + (data.msg || "Credenciais inválidas.");
            erroMsg.style.display = 'block';
            
            btnSubmit.innerText = "ACESSAR PAINEL";
            btnSubmit.style.opacity = "1";
            btnSubmit.disabled = false;
        }
    } catch (error) {
        console.error('Erro:', error);
        erroMsg.innerText = "❌ Falha de comunicação com o servidor.";
        erroMsg.style.display = 'block';
        
        btnSubmit.innerText = "ACESSAR PAINEL";
        btnSubmit.style.opacity = "1";
        btnSubmit.disabled = false;
    }
});

// ==========================================
// SISTEMA DE RECUPERAÇÃO DE SENHA
// ==========================================
function abrirModalRecuperacao() {
    document.getElementById('modal-esqueci-senha').style.display = 'flex';
    document.getElementById('passo-1-email').style.display = 'block';
    document.getElementById('passo-2-pin').style.display = 'none';
    document.getElementById('recupera-email').value = '';
    document.getElementById('recupera-pin').value = '';
    document.getElementById('recupera-nova-senha').value = '';
}

function fecharModalRecuperacao() {
    document.getElementById('modal-esqueci-senha').style.display = 'none';
}

// Passo 1: Pede o PIN
async function solicitarPin() {
    const email = document.getElementById('recupera-email').value;
    if (!email) {
        alert("Por favor, digite seu e-mail.");
        return;
    }

    const btn = document.getElementById('btn-solicitar');
    btn.innerText = "Aguarde...";
    btn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/auth/esqueci-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        const data = await response.json();

        if (response.ok) {
            // PARA O MVP: Como não temos envio real de e-mail, mostramos o PIN num alert para você testar.
            if (data.pin_de_teste) {
                alert(`[MODO DE TESTE MVP]\nO seu código PIN é: ${data.pin_de_teste}\n(Num app real, isso iria para o e-mail do usuário).`);
            } else {
                alert("Código enviado! Verifique sua caixa de entrada.");
            }
            // Avança para a próxima tela
            document.getElementById('passo-1-email').style.display = 'none';
            document.getElementById('passo-2-pin').style.display = 'block';
        } else {
            alert("Erro: " + data.msg);
        }
    } catch (error) {
        alert("Erro de conexão com o servidor.");
    } finally {
        btn.innerText = "Receber Código";
        btn.disabled = false;
    }
}

// Passo 2: Troca a Senha (com validação de segurança do backend)
async function resetarSenha() {
    const email = document.getElementById('recupera-email').value;
    const pin = document.getElementById('recupera-pin').value;
    const nova_senha = document.getElementById('recupera-nova-senha').value;

    if (!pin || !nova_senha) {
        alert("Preencha o PIN e a nova senha.");
        return;
    }

    const btn = document.getElementById('btn-resetar');
    btn.innerText = "Salvando...";
    btn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/auth/resetar-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, pin: pin, nova_senha: nova_senha })
        });
        const data = await response.json();

        if (response.ok) {
            alert("✅ " + data.msg);
            fecharModalRecuperacao();
        } else {
            // Aqui o backend vai devolver o aviso caso a senha seja fraca!
            alert("⚠️ Atenção:\n" + data.msg);
        }
    } catch (error) {
        alert("Erro de conexão com o servidor.");
    } finally {
        btn.innerText = "Salvar Nova Senha";
        btn.disabled = false;
    }
}
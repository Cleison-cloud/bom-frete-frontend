console.log("🚀 Módulo Dashboard Carregado");

const app = (function() {
    const API_URL = 'https://bom-frete-api-cleison.onrender.com/api'; 
    let currentUser = null;
    let historyStack = []; 
    let chatAtivoId = null;
    let chatInterval = null;
    let cachedMessages = {}; 
    let pollingInterval = null;

    // --- NOVO: FUNÇÃO DE LOADING DOS BOTÕES ---
    function setLoading(btnElement, isLoading, originalText) {
        if (!btnElement) return;
        if (isLoading) {
            btnElement.disabled = true;
            btnElement.innerHTML = `<span class="spinner"></span> Processando...`;
        } else {
            btnElement.disabled = false;
            btnElement.innerHTML = originalText;
        }
    }

    function showToast(msg, type = 'success') {
        const container = document.getElementById('toast-container');
        if(!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icone = type === 'success' ? '<svg width="20" height="20" fill="none" stroke="#10b981" stroke-width="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' : 
                   (type === 'error' ? '<svg width="20" height="20" fill="none" stroke="#ef4444" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>' : 
                   '<svg width="20" height="20" fill="none" stroke="#3b82f6" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>');
        
        toast.innerHTML = `<div>${icone}</div><div>${msg}</div>`;
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3500); 
    }

    function toggleSidebar() {
        document.getElementById('app-sidebar').classList.toggle('active');
        document.getElementById('mobile-overlay').classList.toggle('active');
    }

    function closeSidebar() {
        document.getElementById('app-sidebar').classList.remove('active');
        document.getElementById('mobile-overlay').classList.remove('active');
    }

    function getToken() { return localStorage.getItem('token') || localStorage.getItem('bomfrete_token'); }

    async function apiFetch(endpoint, options = {}) {
        const token = getToken();
        if (!token) { window.location.href = 'login.html'; throw new Error('Não autenticado'); }
        const config = { ...options, headers: { 'Authorization': `Bearer ${token}`, ...options.headers } };
        
        if (!(options.body instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, config);
            if (!response.ok) {
                if (response.status === 401) { logout(); throw new Error('Sessão expirada.'); }
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            return await response.json();
        } catch (error) { throw error; }
    }

    function navigate(viewId, isVoltar = false) {
        closeSidebar();

        const currentActive = document.querySelector('.view-section.active');
        if (currentActive && !isVoltar) {
            const currentId = currentActive.id.replace('view-', '');
            if (currentId !== viewId) historyStack.push(currentId);
        }
        document.querySelectorAll('.view-section').forEach(section => section.classList.remove('active'));
        const targetView = document.getElementById(`view-${viewId}`);
        if (targetView) targetView.classList.add('active');

        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active-nav'));
        const activeBtn = document.querySelector(`.nav-btn[data-target="${viewId}"]`);
        if(activeBtn) activeBtn.classList.add('active-nav');

        if (viewId === 'minhas-cargas') carregarMinhasCargas();
        if (viewId === 'perfil') preencherDadosPerfil();
        if (viewId === 'gestao-cargas') carregarCargasDisponiveis(); 
        if (viewId === 'minhas-viagens') carregarMinhasViagens(); 
        if (viewId === 'historico-viagens') carregarHistoricoViagens(); 
    }

    function voltar() { if (historyStack.length > 0) { navigate(historyStack.pop(), true); } else { irParaInicio(); } }
    
    function irParaInicio() { 
        const isEmbarcador = currentUser && (currentUser.role === 'embarcador' || currentUser.role === 'empresa');
        navigate(isEmbarcador ? 'minhas-cargas' : 'gestao-cargas'); 
    }

    async function init() {
        try {
            currentUser = await apiFetch('/auth/me'); 
            const userRole = currentUser.role || localStorage.getItem('role') || 'motorista';
            
            document.getElementById('user-name').textContent = currentUser.nome;
            document.getElementById('user-role').textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1);

            const embEls = document.querySelectorAll('.embarcador-only');
            const motEls = document.querySelectorAll('.motorista-only');
            const todosElementos = document.querySelectorAll('a, li, div, section, button');

            if (userRole === 'embarcador' || userRole === 'empresa') {
                embEls.forEach(el => el.classList.remove('hidden')); 
                motEls.forEach(el => el.classList.add('hidden')); 
                todosElementos.forEach(el => {
                    const texto = el.textContent.trim();
                    if (texto === 'Procurar Fretes' || texto === 'Minhas Viagens' || texto === 'Painel de Fretes da Rede' || texto === '✅ Histórico') el.style.display = 'none';
                    if (texto === 'Gestão de Cargas' || texto === '+ Nova Carga') if(el.tagName !== 'DIV') el.style.display = 'block'; 
                });
                irParaInicio(); 
            } else {
                embEls.forEach(el => el.classList.add('hidden')); 
                motEls.forEach(el => el.classList.remove('hidden')); 
                todosElementos.forEach(el => {
                    const texto = el.textContent.trim();
                    if (texto === 'Gestão de Cargas' || texto === '+ Nova Carga') el.style.display = 'none';
                });
                irParaInicio();
            }
            preencherDadosPerfil();
            iniciarRadarNotificacoes();
        } catch (error) { logout(); }
    }

    function logout() { localStorage.removeItem('token'); localStorage.removeItem('bomfrete_token'); localStorage.removeItem('role'); window.location.href = 'login.html'; }

    function preencherDadosPerfil() {
        document.getElementById('perfil-nome').value = currentUser.nome || '';
        document.getElementById('perfil-email').value = currentUser.email || '';
        document.getElementById('perfil-telefone').value = currentUser.telefone || '';
        if (currentUser.role === 'motorista') { 
            const placaField = document.getElementById('perfil-placa');
            if(placaField) placaField.value = currentUser.placa_veiculo || ''; 
        }

        let fotoUrl;
        if (currentUser.foto_perfil && currentUser.foto_perfil !== 'default.png') {
            fotoUrl = `${API_URL.replace('/api','')}/uploads/${currentUser.foto_perfil}`;
        } else {
            let nomeAvatar = currentUser.nome ? currentUser.nome.replace(' ', '+') : 'User';
            fotoUrl = `https://ui-avatars.com/api/?name=${nomeAvatar}&background=003D7C&color=FF6D00&size=128&bold=true`;
        }

        if(document.getElementById('perfil-foto-preview')) document.getElementById('perfil-foto-preview').src = fotoUrl;
        if (document.getElementById('avatar-header')) {
            document.getElementById('avatar-header').src = fotoUrl;
            document.getElementById('avatar-header').style.display = 'block';
            document.getElementById('avatar-fallback').style.display = 'none';
        }
    }

    async function uploadFoto(event) {
        const file = event.target.files[0]; if(!file) return;
        
        if(file.size > 5 * 1024 * 1024) {
            showToast("A imagem é muito grande. Escolha uma de até 5MB.", "error");
            return;
        }

        const formData = new FormData(); 
        formData.append('foto', file);
        
        showToast("Enviando foto... aguarde.", "info");

        try {
            const response = await fetch(`${API_URL}/auth/upload-foto`, { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${getToken()}` }, 
                body: formData 
            });
            const data = await response.json();
            if (response.ok) { 
                currentUser.foto_perfil = data.foto_perfil; 
                preencherDadosPerfil(); 
                showToast("Foto atualizada com sucesso!", "success"); 
            } else {
                showToast("Erro: " + data.msg, "error");
            }
        } catch (error) { 
            showToast("Falha ao conectar com o servidor para enviar a foto.", "error"); 
        }
    }

    function toggleEditPerfil() {
        const isEditing = !document.getElementById('perfil-nome').readOnly;
        document.querySelectorAll('#form-perfil input').forEach(input => { if (input.id !== 'perfil-email') input.readOnly = isEditing; });
        document.getElementById('btn-edit-perfil').classList.toggle('hidden'); document.getElementById('btn-save-perfil').classList.toggle('hidden');
    }

    async function salvarPerfil(event) {
        const btn = event.target;
        setLoading(btn, true, "Gravar");

        const payload = { nome: document.getElementById('perfil-nome').value, telefone: document.getElementById('perfil-telefone').value };
        if (currentUser.role === 'motorista') {
            const placaField = document.getElementById('perfil-placa');
            if(placaField) payload.placa_veiculo = placaField.value;
        }
        try {
            await apiFetch('/auth/me', { method: 'PUT', body: JSON.stringify(payload) });
            showToast("Dados do perfil atualizados!", "success"); 
            toggleEditPerfil();
            currentUser.nome = payload.nome; currentUser.telefone = payload.telefone; document.getElementById('user-name').textContent = currentUser.nome;
            preencherDadosPerfil();
        } catch (error) { 
            showToast("Erro ao salvar os dados.", "error"); 
        } finally {
            setLoading(btn, false, "Gravar");
        }
    }

    async function postarCarga(event) {
        event.preventDefault();
        
        const btn = document.getElementById('btn-postar');
        setLoading(btn, true, "Transmitir Frete");

        const origemEl = document.getElementById('carga-origem');
        const destinoEl = document.getElementById('carga-destino');
        const valorEl = document.getElementById('carga-valor');
        const produtoEl = document.getElementById('carga-descricao');
        
        const body = { 
            origem: origemEl ? origemEl.value : '', 
            destino: destinoEl ? destinoEl.value : '', 
            valor: valorEl ? parseFloat(valorEl.value) : 0, 
            produto: produtoEl ? produtoEl.value : 'Diversos'
        };

        try { 
            await apiFetch('/cargas', { method: 'POST', body: JSON.stringify(body) }); 
            showToast('Carga transmitida com sucesso para a rede!', 'success'); 
            document.getElementById('form-nova-carga').reset(); 
            navigate('minhas-cargas'); 
        } catch (error) { 
            showToast('Falha ao postar a carga no sistema.', 'error'); 
        } finally {
            setLoading(btn, false, "Transmitir Frete");
        }
    }

    async function carregarMinhasCargas() {
        const c = document.getElementById('lista-minhas-cargas'); 
        if(!c) return;
        c.innerHTML = '<p>Buscando...</p>';
        try {
            const cargas = await apiFetch('/cargas/minhas'); c.innerHTML = '';
            if (cargas.length === 0) { c.innerHTML = '<p>Nenhuma carga postada ainda.</p>'; return; }
            cargas.forEach(carga => {
                const div = document.createElement('div'); div.className = 'card';
                let corStatus = carga.status === 'ENTREGUE' ? '#10b981' : (carga.status === 'CANCELADO' ? '#ef4444' : 'var(--bf-orange)');
                let html = `<div style="display:flex; justify-content:space-between;"><h3>Frete #${carga.id} - ${carga.produto}</h3><span style="color:${corStatus}; font-weight:bold;">${carga.status}</span></div><p><strong>Rota:</strong> ${carga.origem} ➔ ${carga.destino}</p><p><strong>Valor:</strong> R$ ${parseFloat(carga.valor).toFixed(2)}</p>`;
                
                let botoes = '';
                if (carga.status === 'ACEITO' && carga.motorista) {
                    botoes += `<button class="btn btn-outline" style="margin-right: 10px;" onclick="app.abrirRastreio(${carga.id}, '${carga.origem}', '${carga.destino}', '${carga.motorista.nome}')">📍 Rastrear Carga</button>`;
                }
                
                if (carga.status === 'disponivel' || carga.status === 'ACEITO') {
                    botoes += `<button class="btn btn-danger" style="margin:0; padding: 12px 24px;" onclick="app.cancelarCarga(${carga.id}, this)">❌ Cancelar Frete</button>`;
                }

                if(botoes !== '') {
                    html += `<div class="carga-actions" style="border-top: 1px solid var(--border-color); padding-top:15px; margin-top:15px;">${botoes}</div>`;
                }

                div.innerHTML = html; c.appendChild(div);
            });
        } catch (error) { c.innerHTML = '<p style="color:red;">Erro ao carregar cargas.</p>'; }
    }

    async function carregarCargasDisponiveis() {
        const c = document.getElementById('lista-cargas-disponiveis'); 
        if(!c) return;
        c.innerHTML = '<p>Buscando...</p>';
        try {
            const cargas = await apiFetch('/cargas/disponiveis'); c.innerHTML = '';
            if (cargas.length === 0) { c.innerHTML = '<div class="card"><p>Nenhum frete disponível no momento.</p></div>'; return; }
            cargas.forEach(carga => {
                const div = document.createElement('div'); div.className = 'card';
                div.innerHTML = `<h3>Frete #${carga.id} - ${carga.produto} (R$ ${parseFloat(carga.valor).toFixed(2)})</h3><p><strong>De:</strong> ${carga.origem} <br><strong>Para:</strong> ${carga.destino}</p>
                    <button class="btn btn-primary" style="margin-top:15px;" onclick="app.aceitarCarga(${carga.id}, this)">✅ Aceitar este Frete</button>`;
                c.appendChild(div);
            });
        } catch (error) { c.innerHTML = '<p style="color:red;">Erro ao buscar cargas.</p>'; }
    }

    async function aceitarCarga(id, btnElement) {
        if(!confirm("Aceitar este frete? Você ficará responsável pela entrega.")) return;
        setLoading(btnElement, true, "✅ Aceitar este Frete");
        try { 
            await apiFetch(`/cargas/${id}/aceitar`, { method: 'POST' }); 
            showToast("Frete aceito! Verifique suas 'Minhas Viagens'.", "success"); 
            navigate('minhas-viagens'); 
        } catch (error) { 
            showToast("Erro ao tentar aceitar o frete.", "error"); 
            setLoading(btnElement, false, "✅ Aceitar este Frete");
        }
    }

    async function finalizarViagem(id, btnElement) {
        if(!confirm("Confirmar que a mercadoria foi entregue no destino final?")) return;
        setLoading(btnElement, true, "✅ Finalizar");
        try {
            await apiFetch(`/cargas/${id}/finalizar`, { method: 'POST' });
            showToast("Viagem finalizada! A carga foi para o Histórico.", "success");
            carregarMinhasViagens(); 
        } catch (error) {
            showToast("Erro ao tentar finalizar a viagem.", "error");
            setLoading(btnElement, false, "✅ Finalizar");
        }
    }

    async function cancelarCarga(id, btnElement) {
        if(!confirm("⚠️ ATENÇÃO: Tem certeza que deseja CANCELAR este frete? Esta ação não pode ser desfeita.")) return;
        setLoading(btnElement, true, "❌ Cancelar");
        try {
            await apiFetch(`/cargas/${id}/cancelar`, { method: 'POST' });
            showToast("Frete cancelado no sistema.", "info");
            if (currentUser.role === 'embarcador' || currentUser.role === 'empresa') {
                carregarMinhasCargas();
            } else {
                carregarMinhasViagens();
            }
        } catch (error) {
            showToast("Erro ao processar o cancelamento.", "error");
            setLoading(btnElement, false, "❌ Cancelar");
        }
    }

    async function carregarMinhasViagens() {
        const c = document.getElementById('lista-minhas-viagens'); 
        if(!c) return;
        c.innerHTML = '<p>Buscando viagens...</p>';
        try {
            const todasAsCargas = await apiFetch('/cargas/minhas-viagens'); 
            const ativas = todasAsCargas.filter(carga => carga.status === 'ACEITO');
            
            c.innerHTML = '';
            if (ativas.length === 0) { c.innerHTML = '<div class="card"><p>Você não tem nenhuma viagem em andamento.</p></div>'; return; }
            
            ativas.forEach(carga => {
                const div = document.createElement('div'); div.className = 'card';
                div.innerHTML = `<div style="display:flex; justify-content:space-between;"><h3>Viagem #${carga.id}</h3><span style="color:#f59e0b; font-weight:bold;">${carga.status}</span></div><p><strong>📍 De:</strong> ${carga.origem} <br><strong>🏁 Para:</strong> ${carga.destino}</p>
                    <div class="carga-actions" style="border-top: 1px solid var(--border-color); padding-top:15px; margin-top:15px; display: flex; gap: 10px;">
                        <button class="btn btn-primary" onclick="app.abrirRotaMaps('${carga.origem}', '${carga.destino}')">🧭 Navegar</button>
                        <button class="btn btn-success" onclick="app.finalizarViagem(${carga.id}, this)">✅ Finalizar</button>
                        <button class="btn btn-danger" style="margin:0; padding:12px 15px;" onclick="app.cancelarCarga(${carga.id}, this)">❌ Cancelar</button>
                    </div>`;
                c.appendChild(div);
            });
        } catch (error) { c.innerHTML = '<p style="color:red;">Erro ao buscar suas viagens.</p>'; }
    }

    async function carregarHistoricoViagens() {
        const c = document.getElementById('lista-historico-viagens'); 
        if(!c) return;
        c.innerHTML = '<p>Buscando histórico...</p>';
        try {
            const todasAsCargas = await apiFetch('/cargas/minhas-viagens'); 
            const historico = todasAsCargas.filter(carga => carga.status === 'ENTREGUE' || carga.status === 'CANCELADO'); 
            
            c.innerHTML = '';
            if (historico.length === 0) { c.innerHTML = '<div class="card"><p>Você ainda não possui viagens no histórico.</p></div>'; return; }
            
            historico.forEach(carga => {
                const isCancelado = (carga.status === 'CANCELADO');
                const corStatus = isCancelado ? '#ef4444' : '#10b981';
                const msgStatus = isCancelado ? 'Esta viagem foi cancelada antes da conclusão.' : 'Serviço concluído com sucesso!';

                const div = document.createElement('div'); div.className = 'card';
                div.style.borderColor = corStatus; 
                div.innerHTML = `<div style="display:flex; justify-content:space-between;"><h3>Viagem #${carga.id}</h3><span style="color:${corStatus}; font-weight:bold;">${carga.status}</span></div><p style="color: var(--text-muted)"><strong>📍 De:</strong> ${carga.origem} <br><strong>🏁 Para:</strong> ${carga.destino}</p>
                <p style="font-size: 13px; color: ${corStatus};">${msgStatus}</p>`;
                c.appendChild(div);
            });
        } catch (error) { c.innerHTML = '<p style="color:red;">Erro ao ler o histórico.</p>'; }
    }

    function abrirRotaMaps(origem, destino) { window.open(`https://www.google.com/maps/dir/?api=1&origin=$${encodeURIComponent(origem)}&destination=${encodeURIComponent(destino)}`, '_blank'); }

    function abrirRastreio(id, origem, destino, motoristaNome) {
        document.getElementById('rastreio-info').innerHTML = `<p style="margin-bottom: 25px;">Frete <strong>#${id}</strong> por <strong>${motoristaNome}</strong></p><div style="border-left: 2px dashed #ccc; padding-left: 20px; margin-left: 10px; position: relative;"><div style="position: absolute; left:-11px; top:0; background:#10b981; width:20px; height:20px; border-radius:50%;"></div><p style="margin:0 0 35px 0;"><strong>Origem</strong><br><span>${origem}</span></p><div style="position: absolute; left:-11px; top:80px; background:#3b82f6; width:20px; height:20px; border-radius:50%; box-shadow:0 0 10px #3b82f6;"></div><p style="margin:0 0 35px 0;"><strong>Status</strong><br><span>Em deslocamento 🚚</span></p><div style="position: absolute; left:-9px; bottom:5px; background:#fff; border:2px solid #ccc; width:16px; height:16px; border-radius:50%;"></div><p style="margin:0;"><strong>Destino Final</strong><br><span>${destino}</span></p></div>`;
        document.getElementById('modal-rastreio').classList.remove('hidden');
    }
    function fecharRastreio() { document.getElementById('modal-rastreio').classList.add('hidden'); }

    function tocarSomNotificacao() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime); 
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start(); gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3); osc.stop(ctx.currentTime + 0.3);
        } catch(e) {}
    }

    async function iniciarRadarNotificacoes() {
        pollingInterval = setInterval(async () => {
            if(!currentUser) return;
            try {
                let endpoint = (currentUser.role === 'embarcador' || currentUser.role === 'empresa') ? '/cargas/minhas' : '/cargas/minhas-viagens';
                const fretes = await apiFetch(endpoint);
                const ativos = fretes.filter(f => f.status === 'ACEITO');
                let temNovidade = false;

                for(let f of ativos) {
                    const msgs = await apiFetch(`/cargas/${f.id}/chat`);
                    if(msgs.length > 0) {
                        const ultimaMsg = msgs[msgs.length - 1];
                        const lastKnownId = cachedMessages[f.id] || 0;
                        if(ultimaMsg.id > lastKnownId) {
                            cachedMessages[f.id] = ultimaMsg.id;
                            if(ultimaMsg.remetente_id !== currentUser.id) temNovidade = true;
                        }
                    }
                }
                if(temNovidade) {
                    tocarSomNotificacao();
                    const badge = document.getElementById('chat-badge');
                    if(badge) badge.classList.remove('hidden');
                }
            } catch(e) {}
        }, 5000);
    }

    async function abrirListaChats() {
        const badge = document.getElementById('chat-badge');
        if(badge) badge.classList.add('hidden');
        document.getElementById('modal-chat').classList.remove('hidden');
        document.getElementById('chat-view-list').classList.remove('hidden');
        document.getElementById('chat-view-messages').classList.add('hidden');

        const c = document.getElementById('lista-de-contatos-chat');
        c.innerHTML = '<p style="text-align:center;">Buscando conversas...</p>';
        
        try {
            let endpoint = (currentUser.role === 'embarcador' || currentUser.role === 'empresa') ? '/cargas/minhas' : '/cargas/minhas-viagens';
            const fretes = await apiFetch(endpoint);
            const ativos = fretes.filter(f => f.status === 'ACEITO');
            
            c.innerHTML = '';
            if(ativos.length === 0) {
                c.innerHTML = '<p style="text-align:center; padding: 20px 0;">Nenhum frete em andamento para conversar.</p>';
                return;
            }

            ativos.forEach(f => {
                const outroNome = (currentUser.role === 'embarcador' || currentUser.role === 'empresa') ? (f.motorista ? f.motorista.nome : 'Motorista') : f.embarcador_nome || 'Embarcador';
                const div = document.createElement('div');
                div.className = 'chat-list-item';
                div.innerHTML = `<strong>Frete #${f.id}</strong><br><span style="font-size: 14px;">Falar sobre esta carga</span>`;
                div.onclick = () => abrirChat(f.id, `Frete #${f.id}`);
                c.appendChild(div);
            });
        } catch(e) { c.innerHTML = '<p style="color:red;">Erro ao carregar conversas.</p>'; }
    }

    function voltarParaListaChats() {
        chatAtivoId = null;
        clearInterval(chatInterval);
        document.getElementById('chat-view-messages').classList.add('hidden');
        document.getElementById('chat-view-list').classList.remove('hidden');
    }

    async function abrirChat(freteId, titulo) {
        document.getElementById('chat-view-list').classList.add('hidden');
        document.getElementById('chat-view-messages').classList.remove('hidden');
        chatAtivoId = freteId;
        document.getElementById('chat-titulo').textContent = titulo;
        await carregarMensagens();
        chatInterval = setInterval(carregarMensagens, 3000); 
    }

    function fecharChat() {
        chatAtivoId = null;
        clearInterval(chatInterval);
        document.getElementById('modal-chat').classList.add('hidden');
    }

    async function carregarMensagens() {
        if(!chatAtivoId) return;
        try {
            const msgs = await apiFetch(`/cargas/${chatAtivoId}/chat`);
            const box = document.getElementById('chat-box');
            box.innerHTML = '';
            msgs.forEach(m => {
                const ehMinha = (m.remetente_id === currentUser.id);
                box.innerHTML += `
                    <div class="msg-bubble ${ehMinha ? 'msg-minha' : 'msg-outra'}">
                        <strong>${ehMinha ? 'Você' : m.remetente_nome}</strong><br>${m.texto}<span class="msg-time">${m.hora}</span>
                    </div>`;
            });
            box.scrollTop = box.scrollHeight; 
            if(msgs.length > 0) cachedMessages[chatAtivoId] = msgs[msgs.length - 1].id;
        } catch(e) { console.error("Erro no chat", e); }
    }

    async function enviarMensagem(e) {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        const texto = input.value.trim();
        if(!texto || !chatAtivoId) return;
        try {
            await apiFetch(`/cargas/${chatAtivoId}/chat`, { method: 'POST', body: JSON.stringify({ texto }) });
            input.value = '';
            carregarMensagens();
        } catch(e) { showToast("Erro ao enviar a mensagem.", "error"); }
    }

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
    
    return { navigate, logout, toggleEditPerfil, salvarPerfil, postarCarga, voltar, irParaInicio, uploadFoto, aceitarCarga, finalizarViagem, cancelarCarga, abrirRastreio, fecharRastreio, abrirRotaMaps, abrirListaChats, voltarParaListaChats, abrirChat, fecharChat, enviarMensagem, showToast, toggleSidebar, closeSidebar };
})();
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function MeusFretes() {
  const [fretes, setFretes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarFretes = async () => {
      try {
        // Se já estiver usando JWT no frontend, descomente as linhas abaixo:
        // const token = localStorage.getItem('token');
        // const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // Fazendo a requisição para a sua API Flask (ajuste a porta se necessário)
        const resposta = await axios.get('http://localhost:5000/loads'); 
        
        setFretes(resposta.data);
      } catch (erro) {
        console.error("Erro ao buscar fretes:", erro);
        // Opcional: mostrar um alerta ou mensagem de erro na tela
      } finally {
        setLoading(false);
      }
    };

    buscarFretes();
  }, []);

  if (loading) {
    return <div className="loading-msg">Carregando suas viagens... 🚚</div>;
  }

  return (
    <div className="page-container">
      <h2 className="page-title">Meus Fretes</h2>
      
      {fretes.length === 0 ? (
        <div className="empty-msg">
          <p>Você ainda não tem nenhum frete vinculado.</p>
        </div>
      ) : (
        <div className="fretes-grid">
          {fretes.map((frete) => (
            <div key={frete.id} className="frete-card">
              <div className="frete-header">
                <h3>{frete.origin} ➔ {frete.destination}</h3>
                <span className="status-badge">{frete.status}</span>
              </div>
              <div className="frete-body">
                <p className="frete-price">R$ {frete.price}</p>
                <button className="btn-detalhes">Ver Detalhes</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
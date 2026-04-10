import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { LogOut, Package, MapPin, DollarSign } from 'lucide-react';

const Dashboard = () => {
  const [loads, setLoads] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = async () => {
    try {
      const response = await api.get('/api/loads');
      setLoads(response.data.loads);
    } catch (err) {
      setError('Erro ao carregar os fretes disponíveis.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // NOVA FUNÇÃO: Aceitar o Frete
  const handleAcceptLoad = async (loadId) => {
    try {
      await api.put(`/api/loads/${loadId}/accept`);
      alert('Frete aceito com sucesso! Boa viagem!');
      
      // Atualiza a tela removendo a carga que acabou de ser aceita
      setLoads(loads.filter((load) => load.id !== loadId));
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao aceitar o frete.';
      alert(`Ops: ${errorMessage}`);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logoContainer}>
          <Package size={28} color="#2563eb" />
          <h1 style={styles.title}>Painel de Fretes</h1>
        </div>
        <button onClick={handleLogout} style={styles.logoutButton}>
          <LogOut size={18} /> Sair
        </button>
      </header>

      <main style={styles.main}>
        <div style={styles.headerSection}>
          <h2>Cargas Disponíveis</h2>
          <button onClick={() => window.location.href = '/create-load'} style={styles.primaryButton}>
            + Publicar Carga
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.grid}>
          {loads.length === 0 ? (
            <p style={styles.empty}>Nenhuma carga disponível no momento.</p>
          ) : (
            loads.map((load) => (
              <div key={load.id} style={styles.card}>
                <div style={styles.route}>
                  <MapPin size={18} color="#dc2626" />
                  <span><strong>Origem:</strong> {load.origin}</span>
                </div>
                <div style={styles.route}>
                  <MapPin size={18} color="#16a34a" />
                  <span><strong>Destino:</strong> {load.destination}</span>
                </div>
                <div style={styles.price}>
                  <DollarSign size={18} color="#2563eb" />
                  <span><strong>Valor:</strong> R$ {load.price.toFixed(2)}</span>
                </div>
                
                {/* BOTÃO ATUALIZADO */}
                <button 
                  onClick={() => handleAcceptLoad(load.id)} 
                  style={styles.acceptButton}
                >
                  Aceitar Frete
                </button>

              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '1rem 2rem', borderBottom: '1px solid #e5e7eb' },
  logoContainer: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  title: { fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1f2937' },
  logoutButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'transparent', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', color: '#4b5563' },
  main: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
  headerSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  primaryButton: { padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' },
  card: { backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '1rem' },
  route: { display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151' },
  price: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: '#1f2937', marginTop: '0.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' },
  acceptButton: { width: '100%', padding: '0.75rem', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem', transition: '0.2s' },
  error: { color: '#dc2626', backgroundColor: '#fee2e2', padding: '1rem', borderRadius: '6px' },
  empty: { color: '#6b7280', fontStyle: 'italic' }
};

export default Dashboard;
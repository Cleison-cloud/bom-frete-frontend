import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, PackagePlus } from 'lucide-react';

const CreateLoad = () => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreateLoad = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Faz a requisição POST para o backend
      await api.post('/api/loads', {
        origin,
        destination,
        price: parseFloat(price) // Garante que o preço vá como número
      });
      
      // Se der certo, volta para o painel
      navigate('/dashboard');
   } catch (err) {
      // Isso vai exibir o erro real vindo do Flask na sua tela
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(`Erro do servidor: ${errorMessage}`);
      console.error("Erro completo:", err);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
          <ArrowLeft size={20} /> Voltar
        </button>

        <div style={styles.header}>
          <PackagePlus size={40} color="#2563eb" style={{ marginBottom: '10px' }} />
          <h2 style={styles.title}>Publicar Novo Frete</h2>
          <p style={styles.subtitle}>Preencha os dados da carga abaixo</p>
        </div>
        
        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleCreateLoad} style={styles.form}>
          <input
            type="text"
            placeholder="Cidade de Origem (Ex: São Paulo, SP)"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="text"
            placeholder="Cidade de Destino (Ex: Rio de Janeiro, RJ)"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Valor do Frete (R$)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button}>
            Publicar Carga
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' },
  card: { padding: '2.5rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', width: '100%', maxWidth: '500px', position: 'relative' },
  backButton: { position: 'absolute', top: '1.5rem', left: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.9rem' },
  header: { textAlign: 'center', marginBottom: '2rem', marginTop: '1rem' },
  title: { fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' },
  subtitle: { color: '#6b7280', margin: '0', fontSize: '0.95rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: { width: '100%', padding: '0.875rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '1rem', boxSizing: 'border-box' },
  button: { width: '100%', padding: '0.875rem', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s' },
  errorBox: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }
};

export default CreateLoad;
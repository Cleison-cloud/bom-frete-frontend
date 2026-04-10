import React, { useState } from 'react';
import api from '../services/api';
import { Truck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Salva o token no navegador
      localStorage.setItem('token', response.data.token);
      
      // A CORREÇÃO ESTÁ AQUI: Força a página a recarregar e ir para o painel,
      // garantindo que o App.jsx leia o token novo imediatamente.
      window.location.href = '/dashboard';
      
    } catch (err) {
      setError('E-mail ou senha incorretos. Tente novamente.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <Truck size={40} color="#2563eb" style={{ marginBottom: '10px' }} />
          <h2 style={styles.title}>Bom Frete</h2>
          <p style={styles.subtitle}>Acesse sua conta para continuar</p>
        </div>
        
        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button}>
            Entrar no Sistema
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' },
  card: { padding: '2.5rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
  header: { textAlign: 'center', marginBottom: '2rem' },
  title: { fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' },
  subtitle: { color: '#6b7280', margin: '0', fontSize: '0.95rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: { width: '100%', padding: '0.875rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '1rem', boxSizing: 'border-box' },
  button: { width: '100%', padding: '0.875rem', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s' },
  errorBox: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }
};

export default Login;
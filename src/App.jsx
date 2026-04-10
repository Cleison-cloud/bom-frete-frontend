import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// Importando suas telas (Pages)
import MeusFretes from './pages/MeusFretes';
// import Dashboard from './pages/Dashboard';
// import PublicarCarga from './pages/PublicarCarga';

function App() {
  return (
    <BrowserRouter>
      {/* Um Menu de Navegação Simples (Fica visível em todas as telas) */}
      <nav className="bg-blue-600 p-4 text-white flex gap-4">
        <Link to="/" className="hover:underline">Início</Link>
        <Link to="/publicar" className="hover:underline">Publicar Carga</Link>
        <Link to="/meus-fretes" className="hover:underline">Meus Fretes</Link>
      </nav>

      {/* Área onde as telas vão aparecer dependendo da URL */}
      <div className="container mx-auto mt-4">
        <Routes>
          {/* Defina aqui qual componente abre em qual URL */}
          <Route path="/" element={<div>Tela Inicial do Bom Frete</div>} />
          <Route path="/publicar" element={<div>Tela de Publicar Carga</div>} />
          <Route path="/meus-fretes" element={<MeusFretes />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
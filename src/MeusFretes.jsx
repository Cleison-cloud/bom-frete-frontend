import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MeusFretes = () => {
  const [fretes, setFretes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeusFretes = async () => {
      try {
        const token = localStorage.getItem('token'); // Recuperando seu JWT
        const response = await axios.get('http://localhost:5000/api/meus-fretes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFretes(response.data);
      } catch (error) {
        console.error("Erro ao buscar fretes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeusFretes();
  }, []);

  if (loading) return <div className="text-center mt-10">Carregando seus fretes...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Meus Fretes Aceitos</h1>
      
      {fretes.length === 0 ? (
        <p className="text-gray-500">Você ainda não aceitou nenhum frete.</p>
      ) : (
        <div className="grid gap-4">
          {fretes.map((frete) => (
            <div key={frete.id} className="border p-4 rounded-lg shadow-sm bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{frete.origem} → {frete.destino}</h3>
                  <p className="text-sm text-gray-600">Produto: {frete.produto}</p>
                  <p className="text-blue-600 font-medium">Valor: R$ {frete.valor}</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  {frete.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MeusFretes;
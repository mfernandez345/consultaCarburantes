import React, { useState } from 'react';
import Estaciones from './components/Estaciones';
import Postes from './components/Postes';
import Precio from './components/Precio';

function App() {
  const [vista, setVista] = useState('estaciones');

  return (
    <div className="app-container">
      <nav className="navbar">
        <button
          onClick={() => setVista('estaciones')}
          className={`btn-menu ${vista === 'estaciones' ? 'active' : ''}`}
        >
          ⛽ Estaciones de servicio
        </button>
        <button
          onClick={() => setVista('postes')}
          className={`btn-menu ${vista === 'postes' ? 'active' : ''}`}
        >
          🚢 Postes marítimos
        </button>
        <button
          onClick={() => setVista('precio')}
          className={`btn-menu ${vista === 'precio' ? 'active' : ''}`}
        >
          💰 Precios de los combustibles
        </button>
      </nav>

      <div className="main-content">
        {vista === 'estaciones' && <Estaciones />}

        {vista === 'postes' && <Postes />}

        {vista === 'precio' && <Precio />}
      </div>
    </div>
  );
}
export default App;
import React, { useState, useEffect } from 'react';
import {fetchSeguro} from "../api";

const Precio = () => {
  const [fecha, setFecha] = useState('');
  const [fechaBloqueada, setFechaBloqueada] = useState(false);
  const [datosBrutos, setDatosBrutos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [carburantes, setCarburantes] = useState([]);
  const [provinciaSel, setProvinciaSel] = useState('');
  const [carburanteSel, setCarburanteSel] = useState('');
  const [resultadoTexto, setResultadoTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [orden, setOrden] = useState({ columna: null, direccion: 'asc' });
  const [filtrosHabilitados, setFiltrosHabilitados] = useState(false);
  const hoy = new Date();
  hoy.setDate(hoy.getDate() - 1);
  const maxFecha = hoy.toISOString().split("T")[0];

  // URL del Backend Inteligente (Netlify en producción o local en PyCharm)
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // CAMBIO FECHA
  const handleFechaChange = (e) => {
    const nuevaFecha = e.target.value;
    setFecha(nuevaFecha);

    setProvinciaSel("");
    setCarburanteSel("");
    setResultados([]);
    setResultadoTexto("");
    setOrden({ columna: null, direccion: "asc" });

    setFiltrosHabilitados(false);
    setFechaBloqueada(false);
  };


  //CLIC CALENDARIO
  const handleFechaClick = () => {
    setFiltrosHabilitados(false);
    setFechaBloqueada(false);
  };


  //DATOS
  const cargarDatos = async () => {
    if (!fecha) return;
    const [year, month, day] = fecha.split('-');
    const fechaFormateada = `${day}-${month}-${year}`;

    setLoading(true);
    setResultadoTexto('');
    setResultados([]);

    const data = await fetchSeguro(`${API_BASE_URL}/precio/fecha/${fechaFormateada}`);

    if (!data) {
      setLoading(false);
      return;
    }
    const lista = Array.isArray(data) ? data : (data.ListaEESSPrecio || []);
    setDatosBrutos(lista);

      // provincias ordenadas
      const nombresProvincias = [...new Set(lista.map(item => item.Provincia?.trim()))].filter(Boolean);
      const provsOrdenadas = nombresProvincias.sort((a, b) =>
        a.localeCompare(b, 'es', { sensitivity: 'base' })
      );

      setProvincias([...provsOrdenadas]);

      setFiltrosHabilitados(true);
      setFechaBloqueada(true);
      setLoading(false);
  };

  // CAMBIAR PROVINCIA
  useEffect(() => {
    if (provinciaSel && datosBrutos.length > 0) {
      const muestra = datosBrutos.find(e => e.Provincia?.trim() === provinciaSel);
      if (muestra) {
        const claves = Object.keys(muestra).filter(key => key.startsWith('Precio ') && muestra[key] !== "");
        setCarburantes(claves);
      }
    }

    setCarburanteSel('');
    setResultadoTexto('');
    setResultados([]);
  }, [provinciaSel, datosBrutos]);


  // CAMBIAR CARBURANTE
  useEffect(() => {
    if (fecha && provinciaSel && carburanteSel) {
      const [year, month, day] = fecha.split('-');
      const fechaTxt = `${day}-${month}-${year}`;

      const filtrado = datosBrutos.filter(e =>
        e.Provincia?.trim() === provinciaSel &&
        e[carburanteSel] &&
        e[carburanteSel] !== ""
      );

      const transformado = filtrado.map(e => ({
        estacion: e["Rótulo"],
        localidad: e.Localidad,
        municipio: e.Municipio,
        precio: parseFloat(e[carburanteSel].replace(",", ".")),
        direccion: e.Dirección,
        lat: parseFloat(e.Latitud.replace(",", ".")),
        lng: parseFloat(e["Longitud (WGS84)"].replace(",", "."))
      }));

      transformado.sort((a, b) => {
        return (
          a.municipio.localeCompare(b.municipio, "es") ||
          a.localidad.localeCompare(b.localidad, "es") ||
          a.estacion.localeCompare(b.estacion, "es") ||
          a.precio - b.precio
        );
      });
    // Agrupar por localidad + municipio
    const grupos = {};
    transformado.forEach(item => {
      const clave = `${item.localidad}||${item.municipio}`;
      if (!grupos[clave]) grupos[clave] = [];
      grupos[clave].push(item);
    });

    // Detectar mínimo y máximo por grupo
    Object.values(grupos).forEach(grupo => {
      if (grupo.length > 1) {
        const precios = grupo.map(g => g.precio);
        const min = Math.min(...precios);
        const max = Math.max(...precios);

        grupo.forEach(g => {
          g.esMinimo = g.precio === min;
          g.esMaximo = g.precio === max;
        });
      } else {
        grupo[0].esMinimo = false;
        grupo[0].esMaximo = false;
      }
    });

      setResultados(transformado);

      const nombreCarburante = carburanteSel.replace("Precio ", "");
      setResultadoTexto(`${fechaTxt} — ${provinciaSel} — ${nombreCarburante}`);
    }
  }, [carburanteSel, provinciaSel, fecha, datosBrutos]);


  // ORDENAR TABLA
  const ordenarPor = (col) => {
    let direccion = 'asc';

    if (orden.columna === col && orden.direccion === 'asc') {
      direccion = 'desc';
    }

    setOrden({ columna: col, direccion });

    const sorted = [...resultados].sort((a, b) => {
      let x = a[col];
      let y = b[col];

      if (typeof x === 'string') {
        const comp = x.localeCompare(y, 'es', { sensitivity: 'base' });
        return direccion === 'asc' ? comp : -comp;
      }

      if (typeof x === 'number') {
        return direccion === 'asc' ? x - y : y - x;
      }

      return 0;
    });

    setResultados(sorted);
  };


  return (
    <div className="main-content">
      <div className="consulta-precios-container">
        <header style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h2 style={{ color: '#2c3e50', margin: 0 }}>Consulta de Precios</h2>
          <p style={{ color: '#7f8c8d' }}>Consulta el precio oficial del combustible por provincia y fecha</p>
        </header>

        <div className="filtros-grid">
          <div className="filter-group">
            <label>Fecha:</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="date"
                value={fecha}
                onChange={handleFechaChange}
                onClick={handleFechaClick}
                onKeyDown={(e)=>e.preventDefault()}
                disabled={loading}
                max={maxFecha}
              />

              <button
                className={`btn-menu ${!fecha ? "btn-disabled" : ""}`}
                style={{ background: '#3498db', minWidth: '80px' }}
                onClick={cargarDatos}
                disabled={!fecha || loading || fechaBloqueada}
              >
                {loading ? '...' : 'Cargar'}
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label>Provincia:</label>
            <select
              value={provinciaSel}
              onChange={(e) => setProvinciaSel(e.target.value)}
              disabled={!filtrosHabilitados || loading}
            >
              <option value="">Selecciona provincia...</option>
              {provincias.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Carburante:</label>
            <select
              value={carburanteSel}
              onChange={(e) => setCarburanteSel(e.target.value)}
              disabled={!filtrosHabilitados || loading}
            >
              <option value="">Selecciona tipo...</option>
              {carburantes.map(c => (
                <option key={c} value={c}>
                  {c.replace('Precio ', '')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!resultadoTexto && !loading && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#bdc3c7' }}>
            <div style={{ fontSize: '50px', marginBottom: '10px' }}>🔍</div>
            <p>Selecciona los filtros para ver el resultado</p>
          </div>
        )}

        {resultadoTexto && (
          <div className="resultado-precio">
            <div style={{ fontSize: '1.4rem', letterSpacing: '0.5px', color: '#2c3e50' }}>
              {resultadoTexto}
            </div>
          </div>
        )}

        {resultados.length > 0 && (
          <table className="tabla-precios" style={{ marginTop: "25px", width: "100%" }}>
            <thead>
              <tr>
                <th onClick={() => ordenarPor('municipio')}>
                  Municipio {orden.columna === 'municipio' && (orden.direccion === 'asc' ? '▲' : '▼')}
                </th>

                <th onClick={() => ordenarPor('localidad')}>
                  Localidad {orden.columna === 'localidad' && (orden.direccion === 'asc' ? '▲' : '▼')}
                </th>

                <th onClick={() => ordenarPor('estacion')}>
                  Estación {orden.columna === 'estacion' && (orden.direccion === 'asc' ? '▲' : '▼')}
                </th>

                <th
                  onClick={() => ordenarPor('precio')}
                  style={{ textAlign: "center", width: "120px" }}
                >
                  €/L {orden.columna === 'precio' && (orden.direccion === 'asc' ? '▲' : '▼')}
                </th>

                <th style={{ width: "40px" }}></th>
              </tr>
            </thead>

            <tbody>
              {resultados.map((r, i) => (
                <tr key={i}>
                  <td>{r.municipio.toUpperCase()}</td>
                  <td>{r.localidad}</td>
                  <td>{r.estacion}</td>

                  <td style={{ textAlign: "center" }}>
                    {r.precio.toFixed(3).replace('.',',')}
                  </td>

                  <td style={{ textAlign: "center" }}>
                    {r.esMinimo && (
                      <img
                        src="/si.png"
                        alt="mínimo"
                        style={{ width: "22px", height: "22px" }}
                      />
                    )}

                    {r.esMaximo && (
                      <img
                        src="/no.png"
                        alt="máximo"
                        style={{ width: "22px", height: "22px" }}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {loading && (
          <div className="placeholder-msg">
            <div className="spinner"></div>
            <p>Obteniendo datos...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Precio;

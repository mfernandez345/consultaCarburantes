import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import {fetchSeguro} from "../api";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

//CONFIGURACIÓN DE ICONOS
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Mover cámara en el mapa + arreglo de mosaico roto
function ChangeView({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
    // Forzamos al mapa a recolocar las teselas rotas esperando un instante a que el DOM se asiente
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [center, zoom, map]);

  return null;
}

function Estaciones() {
  const [geoData, setGeoData] = useState(null);
  const [gasolineras, setGasolineras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapConfig, setMapConfig] = useState({ center: [40.4167, -3.7037], zoom: 5 });

  // Obtener la URL del Backend (Usa la variable de Netlify o cae a localhost si estás en PyCharm)
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // 1. Cargar el GeoJSON de las Comunidades Autónomas
  useEffect(() => {
    fetchSeguro('https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/spain-communities.geojson')
  .then(data => {
    if (data) setGeoData(data);
  });
  }, []);

  // 2. Función para obtener gasolineras por CCAA desde tu Backend
  const fetchGasolineras = async (idCCAA) => {
    setGasolineras([]);
    setLoading(true);
     const data = await fetchSeguro(`${API_BASE_URL}/gasolineras/comunidad/${idCCAA}`);
     if (!data) {
        setLoading(false);
        return;
     }
    const lista = data.map(g => ({
    id: g.IDEESS || Math.random(),
    rotulo: g.Rótulo || g.rotulo || "Sin nombre",
    direccion: g.Dirección || g.direccion,
    municipio: g.Municipio || "N/A",
    provincia: g.Provincia || "N/A",
    lat: typeof g.Latitud === 'string' ? parseFloat(g.Latitud.replace(',', '.')) : g.Latitud,
    lng: typeof g['Longitud (WGS84)'] === 'string' ? parseFloat(g['Longitud (WGS84)'].replace(',', '.')) : g['Longitud (WGS84)'],
  }));

  setGasolineras(lista);

  if (lista.length > 0) {
    setMapConfig({ center: [lista[0].lat, lista[0].lng], zoom: 7 });
  }

  setLoading(false);
};

  // 3. Lógica de interacción con cada comunidad del mapa
  const onEachFeature = (feature, layer) => {
    const nombreRegion = feature.properties.name || feature.properties.NAME_1;

    layer.bindTooltip(nombreRegion, { sticky: true, className: 'label-ccaa-hover' });

    layer.on({
      mouseover: (e) => e.target.setStyle({ fillOpacity: 0.5, weight: 3 }),
      mouseout: (e) => e.target.setStyle({ fillOpacity: 0.2, weight: 1 }),
      click: (e) => {
        // Evitar foco de selección
        const path = e.target._path;
        if (path) path.blur();

        const mapping = {
          "Andalucia": "01", "Aragon": "02", "Asturias": "03", "Baleares": "04",
          "Canarias": "05", "Cantabria": "06", "Castilla-La Mancha": "07",
          "Castilla-Leon": "08", "Cataluña": "09", "Valencia": "10",
          "Extremadura": "11", "Galicia": "12", "Madrid": "13", "Murcia": "14",
          "Navarra": "15", "Pais Vasco": "16", "La Rioja": "17", "Ceuta": "18", "Melilla": "19"
        };
        const id = mapping[nombreRegion];
        if (id) fetchGasolineras(id);
      }
    });
  };

  return (
    <div style={{ height: 'calc(100vh - 60px)', width: '100%', position: 'relative' }}>

      {/* SPINNER DE CARGA */}
      {loading && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 2000, background: 'white', padding: '20px', borderRadius: '10px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <div className="spinner"></div>
          <span style={{ fontWeight: 'bold' }}>Buscando estaciones...</span>
        </div>
      )}

      {/* BOTÓN VOLVER A ESPAÑA*/}
      {!loading && gasolineras.length > 0 && (
        <button
          onClick={() => {
            setGasolineras([]);
            setMapConfig({ center: [40.4167, -3.7037], zoom: 5 });
          }}
          style={{
            position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 1000, padding: '12px 28px', background: '#2c3e50', color: 'white',
            border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(0,0,0,0.4)', transition: 'all 0.3s'
          }}
        >
          ⬅ Volver al mapa de España
        </button>
      )}
        {/* INSTRUCCIÓN FLOTANTE UX */}
        {!loading && gasolineras.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            backgroundColor: '#2c3e50',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '25px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            Selecciona una Comunidad Autónoma para ver sus estaciones de servicio
          </div>
        )}

      <MapContainer center={mapConfig.center} zoom={mapConfig.zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ChangeView center={mapConfig.center} zoom={mapConfig.zoom} />

        {/* Capa de Comunidades Autónomas */}
        {geoData && (
          <GeoJSON
            data={geoData}
            style={{ color: '#3388ff', weight: 1, fillOpacity: 0.2 }}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Marcadores de Gasolineras */}
        {gasolineras.map(g => (
          <Marker key={g.id} position={[g.lat, g.lng]}>
           <Popup>
              <div style={{
                minWidth: '180px',
                fontFamily: 'Arial, sans-serif',
                padding: '5px'
              }}>
              {/* Título: Nombre de la estación */}
              <div style={{
                  color: '#2c3e50',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  borderBottom: '1px solid #eee',
                  paddingBottom: '4px',
                  textTransform: 'uppercase'
              }}>
                  {g.rotulo}
              </div>

                {/* Dirección*/}
                <div style={{ marginBottom: '6px', color: '#555', fontSize: '13px' }}>
                  <span style={{ marginRight: '5px' }}>📍</span>
                  {g.direccion}
                </div>

                {/* Municipio y Provincia*/}
                <div style={{
                  fontSize: '12px',
                  color: '#7f8c8d',
                  backgroundColor: '#f8f9fa',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  marginTop: '8px',
                  display: 'inline-block'
                }}>
                  <strong>{g.municipio}</strong>, {g.provincia}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default Estaciones;
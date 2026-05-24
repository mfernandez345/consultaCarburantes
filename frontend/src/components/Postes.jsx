import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  useMap
} from "react-leaflet";
import { fetchSeguro } from "../api";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Iconos Leaflet
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Provincias costeras
const provinciasCosteras = {
  "A Coruña": "15",
  Lugo: "27",
  Pontevedra: "36",
  Asturias: "33",
  Cantabria: "39",
  "Bizkaia/Vizcaya": "48",
  "Gipuzkoa/Guipúzcoa": "20",
  Girona: "17",
  Barcelona: "08",
  Tarragona: "43",
  "Castelló/Castellón": "12",
  "València/Valencia": "46",
  "Alacant/Alicante": "03",
  Murcia: "30",
  Almería: "04",
  Granada: "18",
  Málaga: "29",
  Cádiz: "11",
  Huelva: "21",
  "Las Palmas": "35",
  "Santa Cruz De Tenerife": "38",
  "Illes Balears": "07",
  Ceuta:"51",
  Melilla:"52"
};

// Mover cámara + Forzar reajuste de mosaico
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    // Truco del temporizador para recalcular el tamaño real del mapa en el DOM
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [center, zoom, map]);
  return null;
}

function Postes() {
  const [geoData, setGeoData] = useState(null);
  const [postes, setPostes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [haConsultadoProvincia, setHaConsultadoProvincia] = useState(false);
  const [sinPostes, setSinPostes] = useState(false);
  const [mapConfig, setMapConfig] = useState({
    center: [40.4167, -3.7037],
    zoom: 5
  });

// URL del Backend Inteligente (Netlify o local)
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// TEMPORIZADOR VUELTA AL ESTADO INICIAL
  useEffect(() => {
    if (sinPostes) {
      const timer = setTimeout(() => {
        setSinPostes(false);
        setHaConsultadoProvincia(false);
        setMapConfig({
        center: [40.4167, -3.7037],
        zoom: 5
      });
      setPostes([]);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [sinPostes]);

  // Cargar provincias desde GeoJSON
  useEffect(() => {
    fetchSeguro(
      "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/spain-provinces.geojson"
    ).then((data) => {
      if (data) setGeoData(data);
    });
  }, []);

  // Obtener postes marítimos
  const fetchPostes = async (idProvincia) => {
    setLoading(true);
    setHaConsultadoProvincia(true);
    setSinPostes(false);
    setPostes([]);

   const lista = await fetchSeguro(
      `${API_BASE_URL}/postes/provincia/${idProvincia}`
    );

    if (!lista) {
      // Backend apagado
      setLoading(false);
      return;
    }
      //Controlar provincias marítimas sin postes
      if (!lista || lista.length === 0) {
          setSinPostes(true);
          setPostes([]);
          setLoading(false);
          return;
      }
      const data = lista
          .map((p) => {
            const lat = parseFloat(
              p.Latitud.replace(",", ".").replace(" ", "").replace(";", "").trim()
            );
            const lng = parseFloat(
              p["Longitud (WGS84)"].replace(",", ".").replace(" ", "").replace(";", "").trim()
            );
            return {
              id: p.IDPosteMaritimo || Math.random(),
              puerto: p.Puerto,
              direccion: p.Dirección,
              localidad: p.Localidad,
              municipio: p.Municipio,
              lat,
              lng
            };
          })
          .filter((p) => !isNaN(p.lat) && !isNaN(p.lng));

      setPostes(data);

      if (data.length > 0) {
        setMapConfig({ center: [data[0].lat, data[0].lng], zoom: 9 });
      }
  setLoading(false);
  };

  // Interacción con provincias
  const onEachFeature = (feature, layer) => {
    const nombreProv = feature.properties.name;
    const esCostera = provinciasCosteras[nombreProv];

    layer.bindTooltip(nombreProv, {
      sticky: true,
      className: "label-ccaa-hover"
    });

    if (!esCostera) return;

    layer.on({
      mouseover: (e) => e.target.setStyle({ fillOpacity: 0.5, weight: 3 }),
      mouseout: (e) => e.target.setStyle({ fillOpacity: 0.2, weight: 1 }),
      click: () => fetchPostes(esCostera)
    });
  };
  const estilosMensaje = {
    position: "absolute",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,
    backgroundColor: "#2c3e50",
    color: "white",
    padding: "10px 20px",
    borderRadius: "25px",
    fontSize: "14px",
    fontWeight: "500",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
    pointerEvents: "none"
  };
  return (
    <div style={{ height: "calc(100vh - 60px)", width: "100%", position: "relative" }}>

      {/* SPINNER */}
      {loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2000,
            background: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <div className="spinner"></div>
          <span style={{ fontWeight: "bold" }}>Cargando postes marítimos...</span>
        </div>
      )}

     {!loading && !haConsultadoProvincia && (
        <div style={estilosMensaje}>
          Selecciona una provincia costera para ver los postes marítimos
        </div>
      )}

      {!loading && haConsultadoProvincia && sinPostes && (
        <div style={estilosMensaje}>
          No hay postes marítimos registrados en esta provincia
        </div>
      )}

      {!loading && postes.length > 0 && (
        <button
          onClick={() => {
            setPostes([]);
            setHaConsultadoProvincia(false);
            setSinPostes(false);
            setMapConfig({ center: [40.4167, -3.7037], zoom: 5 });
          }}
          style={{
            position: "absolute",
            bottom: "40px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            padding: "12px 28px",
            background: "#2c3e50",
            color: "white",
            border: "none",
            borderRadius: "30px",
            cursor: "pointer",
            fontWeight: "bold",
            boxShadow: "0 4px 15px rgba(0,0,0,0.4)"
          }}
        >
          ⬅ Volver al mapa de España
        </button>
      )}


      <MapContainer
        center={mapConfig.center}
        zoom={mapConfig.zoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ChangeView center={mapConfig.center} zoom={mapConfig.zoom} />

        {/* Provincias */}
        {geoData && (
          <GeoJSON
            data={geoData}
            style={(feature) => {
              const nombreProv = feature.properties.name;
              const esCostera = provinciasCosteras[nombreProv];

              return esCostera
                ? {
                    color: "#3388ff",
                    weight: 1,
                    fillOpacity: 0.25,
                    fillColor: "#3498db",
                    cursor: "pointer"
                  }
                : {
                    color: "#bdc3c7",
                    weight: 1,
                    fillOpacity: 0.3,
                    fillColor: "#dcdde1",
                    cursor: "not-allowed"
                  };
            }}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Marcadores */}
        {postes.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]}>
            <Popup>
                <div style={{ minWidth: "180px", fontFamily: "Arial, sans-serif" }}>
                    <div style={{
                      color: "#2c3e50",
                      fontSize: "15px",
                      fontWeight: "bold",
                      marginBottom: "8px",
                      borderBottom: "1px solid #eee",
                      paddingBottom: "4px"
                    }}>
                    {p.puerto}
                </div>

                <div style={{ marginBottom: "6px", color: "#555", fontSize: "13px" }}>
                  📍 {p.direccion}
                </div>

                <div style={{
                  fontSize: "12px",
                  color: "#7f8c8d",
                  backgroundColor: "#f8f9fa",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  display: "inline-block",
                  marginBottom: "4px"
                }}>
                  <strong>{p.localidad}</strong>
                </div>

                <div style={{
                  fontSize: "12px",
                  color: "#7f8c8d",
                  backgroundColor: "#f8f9fa",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  display: "inline-block"
                }}>
                Municipio: <strong>{p.municipio}</strong>
                </div>

              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default Postes;

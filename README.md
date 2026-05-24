# 🛢️ Consulta de Carburantes
Aplicación web para la consulta de datos procedentes de las API REST del portal de datos abiertos del Gobierno de España, utilizando como fuente principal el **Geoportal de Hidrocarburos**.

---

## 📌 Características principales

- 🗺️ Mapa interactivo.  
- ⛽ Consulta de estaciones por comunidad autónoma.  
- ⚓ Consulta de postes marítimos por provincia costera.  
- 💶 Consulta del precio de carburante seleccionado por fecha y provincia (limitado a *hasta ayer*).  
- 🛡️ Manejo robusto de errores.  
- 🧪 Tests automáticos del backend con pytest.  
- 🚀 Backend desplegado en Render.  
- 📱 Interfaz clara, accesible e intuitiva.

---

## 🧩 Tecnologías utilizadas

### **Frontend**
- React + Vite  
- Leaflet  
- Fetch con manejo de errores  
- CSS modular y optimizado

### **Backend**
- FastAPI  
- Python 3.10+  
- Requests  
- CORS Middleware  
- Variables de entorno (.env)

---

## 🧱 Requisitos del sistema

- Python 3.10 o superior  
- Node.js 18+  
- npm 9+  
- FastAPI  
- Vite  
- Navegador moderno compatible con ES Modules  

---

## 📁 Estructura del proyecto
```
consultaCarburantes/
│
├── backend/
│   ├── __init__.py              # Convierte backend en un paquete Python
│   ├── main.py                  # Backend FastAPI
│   ├── .env                     # Variables de entorno del backend
│   ├── requirements.txt         # Dependencias del backend
│   ├── .venv/                   # Entorno virtual de Python (local al backend)
│   └── tests/
│       ├── test_estaciones.py
│       ├── test_postes.py
│       ├── test_precio.py
│       └── test_root.py
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── .env                     # URL del backend
│   ├── public/
│   ├── node_modules/
│   └── src/
│       ├── main.jsx
│       ├── api.js
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       ├── assets/
│       └── components/
│           ├── Estaciones.jsx
│           ├── Postes.jsx
│           └── Precio.jsx
│
├── conftest.py                  # Añade la raíz del proyecto al PYTHONPATH para pytest
└── README.md                    # README principal del proyecto

```

---
## ⚙️ Instalación y ejecución

### **1. Clonar el repositorio**
```bash
git clone https://github.com/mfernandez345/consultaCarburantes.git
cd consultaCarburantes
```
## 🖥️ Backend (FastAPI)

### 2. Crear entorno virtual
```bash
python -m venv .venv
source .venv/bin/activate   # Linux/Mac
.\.venv\Scripts\activate    # Windows
```
### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```
### 4. Configurar variables de entorno

Crear un archivo `.env` dentro de la carpeta `backend` con el siguiente contenido:
```
# Punto 1: Estaciones por CCAA
API_URL_ESTACIONES_CCAA=https://energia.serviciosmin.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroCCAA/

# Punto 2: Postes Marítimos por provincia
API_URL_POSTES=https://energia.serviciosmin.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/PostesMaritimos/FiltroProvincia/

# Punto 3: Precios por Día
API_URL_PRECIO_DIA=	https://energia.serviciosmin.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestresHist/

# Configuración del servidor
PORT=8000
```
### 3. Ejecutar backend
```bash
uvicorn main:app --reload
```
---
# 🌐 Frontend (React + Vite)

## 1. Instalar dependencias

```bash
cd frontend
npm install
````
### 2. Configurar variable de entorno

Crear un archivo `.env` dentro de la carpeta `frontend` con el siguiente contenido:
```
VITE_API_URL=http://localhost:8000
```
### 3. Ejecutar frontend

```bash
npm run dev
```
---
## 🧪 Tests automáticos (Backend)

El backend incluye un conjunto de tests desarrollados con **pytest** para validar el correcto funcionamiento
de los endpoints internos y el manejo de errores.

### ✔️ Cobertura de los tests

- **tests/test_root.py**  
  Verifica que la ruta raíz (`/`) responde correctamente y que el backend está operativo.

- **tests/test_estaciones.py**  
   Verifica el funcionamiento correcto del endpoint `/gasolineras/comunidad/12`

- **tests/test_postes.py**  
  Contiene dos pruebas relacionadas con el endpoint `/postes/provincia/{id_provincia}`:

  - `test_postes_asturias()`  
    Verifica el caso exitoso para Asturias (id_provincia = 33)
  - `test_postes_ceuta_sin_postes()`  
    Valida el comportamiento esperado cuando una provincia no tiene postes marítimos (Ceuta, id_provincia = 51)
   
- **tests/test_precio.py**  
  Contiene la prueba del endpoint `/precio/fecha/18-05-2026`

---
### ✔️ Comportamiento ante fallos externos

El backend está diseñado para devolver **HTTP 503** cuando:

- La API externa devuelve texto no válido.
- La API externa devuelve HTML en lugar de JSON.
- La API externa devuelve un error.
- La API externa no responde o produce timeout.

Este comportamiento se refleja en el test de Ceuta.

---

### ▶️ Ejecutar tests

Los tests deben ejecutarse desde la **carpeta raíz del proyecto**, con el entorno virtual activado:

```bash
pytest -v
```
---

## ⚡ Endpoints del backend

### 🏠 `/` — GET  
**Test del backend.**  
Comprueba que el servicio está operativo.

---

### 🛢️ `/gasolineras/comunidad/{id_ccaa}` — GET  
Devuelve las **estaciones de servicio** de una comunidad autónoma.

---

### ⚓ `/postes/provincia/{id_provincia}` — GET  
Obtiene los **postes marítimos** de una provincia.

---

### 💶 `/precio/fecha/{fecha}` — GET  
Consulta el **precio de carburantes** para una fecha concreta (DD‑MM‑AAAA).

---

> Todos los endpoints consultan la API oficial del Ministerio y devuelven datos procesados.

---
## ⚠️ Limitaciones conocidas

- La API del Ministerio solo ofrece datos del **día anterior**, por lo que el calendario está limitado automáticamente.
- Algunas provincias no tienen postes marítimos y pueden devolver listas vacías.
- La API externa puede tardar en responder en horas punta.
- Los datos dependen completamente del servicio externo; si está caído, la aplicación no puede ofrecer información actualizada.

---
## 🖼️ Créditos

- Iconos utilizados en la aplicación:
  - **Iconos creados por juicy_fish – Flaticon**  
    https://www.flaticon.es/iconos-gratis/si

- Datos obtenidos de:
  - **Geoportal de Hidrocarburos – Ministerio para la Transición Ecológica y el Reto Demográfico**  
    https://geoportalgasolineras.es/

- Librerías y frameworks:
  - React + Vite
  - Leaflet
  - FastAPI
  - Python Requests
  - Pytest

---
## 📄 Licencia de Uso Académico

Este proyecto ha sido desarrollado exclusivamente con fines **académicos**.

Se permite:

- Usar el código con fines educativos o de investigación.
- Consultar, estudiar y ejecutar el proyecto para aprendizaje personal.



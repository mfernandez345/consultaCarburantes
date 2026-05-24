import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests

# Cargamos las variables de entorno
load_dotenv()

app = FastAPI(title="API Carburantes")

# Configuración de CORS para que React pueda consultar la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constantes extraídas del .env
URL_ESTACIONES_CCAA = os.getenv("API_URL_ESTACIONES_CCAA")
URL_POSTES = os.getenv("API_URL_POSTES")
URL_PRECIO_DIA = os.getenv("API_URL_PRECIO_DIA")

def realizar_peticion(url: str):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
    }

    try:
        print(f"Consultando: {url}")
        response = requests.get(url, headers=headers, timeout=25)
        response.raise_for_status()

        # Intentar parsear JSON
        try:
            data = response.json()
        except ValueError:
            raise HTTPException(
                status_code=503,
                detail="La API externa devolvió un formato no válido."
            )

        # Extraer listas válidas
        lista = (
            data.get('ListaEESSPrecio') or
            data.get('ListaPostes') or
            data.get('Postes')
        )

        # Si no hay lista devolver lista vacía
        if lista is None:
            raise HTTPException(
                status_code=503,
                detail="La API externa no devolvió datos válidos."
            )

        return lista

    except Exception as e:
        print("ERROR REAL:", e)
        raise HTTPException(
            status_code=503,
            detail="No se pudo conectar con la API externa."
        )


# --- PUNTO 1: Estaciones por CCAA ---
@app.get("/gasolineras/comunidad/{id_ccaa}")
def get_estaciones_ccaa(id_ccaa: str):
    return realizar_peticion(f"{URL_ESTACIONES_CCAA}{id_ccaa}")

# --- PUNTO 2: Postes Marítimos por Provincia ---
@app.get("/postes/provincia/{id_provincia}")
def get_postes_maritimos(id_provincia: str):
    return realizar_peticion(f"{URL_POSTES}{id_provincia}")

# --- PUNTO 3: Precio por Fecha ---
@app.get("/precio/fecha/{fecha}")
def get_precio_fecha(fecha: str):
    url_completa = f"{URL_PRECIO_DIA}{fecha}"
    return realizar_peticion(url_completa)

# Ruta de test para comprobar que el backend está vivo
@app.get("/")
def read_root():
    return {"message": "Backend de Carburantes funcionando correctamente"}
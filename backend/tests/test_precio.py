from fastapi.testclient import TestClient
from backend.main import app


client = TestClient(app)

def test_precio_fecha_valida():
    #PF3 – Consulta de precio por fecha.
    #Entrada: Fecha = 18-05-2026
    #Resultado esperado: listado de precios para todas las provincias.

    response = client.get("/precio/fecha/18-05-2026")
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

from fastapi.testclient import TestClient
from backend.main import app


client = TestClient(app)

def test_estaciones_galicia():

    #PF1 – Consulta de estaciones por comunidad autónoma (Galicia).
    #Entrada: IDCCAA = 12
    #Resultado esperado: listado de estaciones en Galicia.

    response = client.get("/gasolineras/comunidad/12")
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

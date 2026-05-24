from fastapi.testclient import TestClient
from backend.main import app


client = TestClient(app)

def test_postes_asturias():
    #PF2 – Consulta de postes marítimos por provincia (Asturias).
    #Entrada: ID Provincia = 33
    #Resultado esperado: listado de postes marítimos.

    response = client.get("/postes/provincia/33")
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

def test_postes_ceuta_sin_postes():
    # Caso adicional: Ceuta no tiene postes marítimos.
    # La API externa devuelve texto no válido, por lo que el backend debe responder 503.

    response = client.get("/postes/provincia/51")
    assert response.status_code == 503


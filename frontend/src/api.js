export async function fetchSeguro(url) {
  try {
    const response = await fetch(url);

    // ESCENARIO 1: El servidor responde con un error de red (503, 404, 500)
    if (!response.ok) {
      // Si el estado es 503, es un error controlado
      if (response.status === 503) {
        console.warn("Aviso: El servidor reporta código 503 (Servicio no disponible/Datos vacíos).");
        // Devolvemos una lista vacía
        return [];
      }
      throw new Error("Servidor no disponible");
    }

    // Leemos la respuesta primero como texto plano para auditar qué contiene realmente
    const textoRespuesta = await response.trimText ? response.trim() : await response.text();

    // ESCENARIO 2: El servidor devuelve un 200 OK pero el contenido es un HTML o XML de error
    if (textoRespuesta.startsWith("<") || textoRespuesta.includes("<html>") || textoRespuesta.includes("xmlns")) {
      console.warn("Detección: La respuesta contiene marcado XML/HTML en lugar de JSON.");
      // Devuelve una lista vacía para activar el temporizador del componente
      return [];
    }

    // ESCENARIO 3: Flujo normal, es un JSON válido
    return JSON.parse(textoRespuesta);

  } catch (error) {
    console.error("Error de conexión:", error);

    // Si el servidor está COMPLETAMENTE APAGADO
    // o no hay conexión de internet
    alert("❌ No se puede conectar con el servidor.\n\nVerifica que el backend está encendido.");
    return null;
  }
}
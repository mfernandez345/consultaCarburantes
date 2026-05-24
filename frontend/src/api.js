export async function fetchSeguro(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Servidor no disponible");
    }

    return await response.json();

  } catch (error) {
    console.error("Error de conexión:", error);
    alert("❌ No se puede conectar con el servidor.\n\nVerifica que el backend está encendido.");
    // Devolvemos null para que el componente sepa que falló
    return null;
  }
}

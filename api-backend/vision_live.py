import cv2
import requests
import time
import os
import glob

URL_ANALISIS_IOT = "http://127.0.0.1:8000/analisis-iot"
URL_ALERTA = "http://127.0.0.1:8000/registrar-alerta-iot"

# --- CARGA DE FOTOS DE REFERENCIA (Ruta arreglada) ---
# Esto asegura que busque dentro de api-backend/data/fotos/
CARPETA_FOTOS = os.path.join(os.path.dirname(__file__), "data", "fotos")

# ¡CORRECCIÓN CLAVE! Añadido *.jpeg porque en tu VS Code la imagen es foto1.jpeg
fotos = sorted(glob.glob(os.path.join(CARPETA_FOTOS, "*.jpg")) +
               glob.glob(os.path.join(CARPETA_FOTOS, "*.jpeg")) + 
               glob.glob(os.path.join(CARPETA_FOTOS, "*.png")))

if not fotos:
    print(f"❌ No hay fotos en {CARPETA_FOTOS}")
    print("👉 Revisa que la carpeta 'fotos' esté dentro de 'data' y tenga imágenes.")
    exit()

print(f"📸 {len(fotos)} fotos cargadas correctamente desde {CARPETA_FOTOS}")
print("🏙️  SIMULACIÓN CÁMARA URBANA RIOBAMBA - MODO DEMO")

indice_foto = 0
INTERVALO_AUTO = 12  # segundos entre análisis automático

estado_pantalla = "Esperando análisis..."
gravedad_pantalla = "0"
accion_pantalla = "Ninguna"
objeto_pantalla = "-"
anomalias_pantalla = "-"
ultimo_analisis = time.time() - INTERVALO_AUTO  # analiza de inmediato al inicio

def analizar_frame(frame):
    """Envía el frame al backend y retorna datos_admin o None."""
    _, buffer = cv2.imencode('.jpg', frame)
    try:
        res = requests.post(
            URL_ANALISIS_IOT,
            files={'file': ('foto.jpg', buffer.tobytes(), 'image/jpeg')},
            timeout=20
        )
        data = res.json()
        if res.status_code == 200 and data.get("status") == "success":
            return data.get("datos_admin")
    except Exception as e:
        print("❌ Error conexión:", e)
    return None

while True:
    # Cargar foto actual
    frame_original = cv2.imread(fotos[indice_foto])
    if frame_original is None:
        print(f"⚠️ No se pudo leer la foto: {fotos[indice_foto]}")
        indice_foto = (indice_foto + 1) % len(fotos)
        continue

    # Redimensionar para que quepa en pantalla (HUD)
    frame = cv2.resize(frame_original, (800, 500))

    ahora = time.time()
    segundos_restantes = max(0, INTERVALO_AUTO - int(ahora - ultimo_analisis))
    es_momento_auto = (ahora - ultimo_analisis) >= INTERVALO_AUTO

    key = cv2.waitKey(30) & 0xFF
    capturar = (key == ord('c')) or es_momento_auto

    if capturar:
        ultimo_analisis = ahora
        nombre_foto = os.path.basename(fotos[indice_foto])
        estado_pantalla = "Analizando con IA..."
        gravedad_pantalla = "..."
        accion_pantalla = "Consultando IA..."
        objeto_pantalla = "Pensando..."
        anomalias_pantalla = "..."

        # Refrescar la UI inmediatamente para mostrar "Analizando..."
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (800, 195), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
        cv2.putText(frame, "ANALIZANDO...", (300, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
        cv2.imshow('EcoRuta AI - Camara Urbana Riobamba (DEMO)', frame)
        cv2.waitKey(1)

        print(f"\n📡 Analizando: {nombre_foto}")

        datos_admin = analizar_frame(frame)

        if datos_admin:
            estado_pantalla   = datos_admin.get("estado_via", "Normal")
            gravedad_pantalla = str(datos_admin.get("nivel_gravedad_alerta", "0"))
            accion_pantalla   = datos_admin.get("accion_recomendada", "Ninguna")
            objeto_pantalla   = datos_admin.get("objeto_detectado", "Desconocido")
            anomalias_pantalla = datos_admin.get("anomalias_detectadas", "Ninguna")

            print(f"✅ Objeto: {objeto_pantalla}")
            print(f"   Vía: {estado_pantalla} | Gravedad: {gravedad_pantalla}/5")
            print(f"   Anomalías: {anomalias_pantalla}")
            print(f"   Acción: {accion_pantalla}")

            # Registrar alerta en el dashboard admin de Alfonso
            requests.post(URL_ALERTA, json={
                "ubicacion": f"Cámara Urbana #{indice_foto + 1} - Riobamba",
                "tipo_residuo": f"Obj: {objeto_pantalla} | {estado_pantalla} (Grav {gravedad_pantalla})"
            }, timeout=5)

            # Avanzar a la siguiente foto automáticamente después del análisis
            indice_foto = (indice_foto + 1) % len(fotos)
        else:
            estado_pantalla = "Error IA"
            objeto_pantalla = "Fallo de conexión"

    # --- UI OVERLAY (HUD) ---
    gravedad_segura = int(gravedad_pantalla) if gravedad_pantalla.isdigit() else 0
    color_alerta = (0, 200, 0) if gravedad_segura < 3 else (0, 0, 255)

    # Barra superior negra semitransparente
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (800, 195), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.8, frame, 0.2, 0, frame)

    # Indicador de foto actual
    foto_label = f"📷 Camara #{indice_foto + 1}/{len(fotos)}: {os.path.basename(fotos[indice_foto])}"
    cv2.putText(frame, foto_label,
                (15, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 200), 1)
    cv2.putText(frame, f"'C' analizar ahora | 'N' siguiente foto | 'Q' salir | Auto en: {segundos_restantes}s",
                (15, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (255, 255, 0), 1)

    cv2.putText(frame, f"OBJETO:   {objeto_pantalla}",
                (15, 85),  cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)
    cv2.putText(frame, f"VIA:      {estado_pantalla}",
                (15, 113), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 255), 2)
    cv2.putText(frame, f"GRAVEDAD: Nivel {gravedad_pantalla}/5",
                (15, 141), cv2.FONT_HERSHEY_SIMPLEX, 0.65, color_alerta, 2)
    cv2.putText(frame, f"ANOMALIA: {anomalias_pantalla}",
                (15, 166), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 180, 0), 1)
    cv2.putText(frame, f"ACCION:   {accion_pantalla}",
                (15, 190), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (180, 180, 180), 1)

    cv2.imshow('EcoRuta AI - Camara Urbana Riobamba (DEMO)', frame)

    # Tecla N para cambiar foto manualmente sin analizar
    if key == ord('n'):
        indice_foto = (indice_foto + 1) % len(fotos)
        ultimo_analisis = ahora # Reinicia el contador para que no salte doble

    if key == ord('q'):
        break

cv2.destroyAllWindows()
print("\n🏁 Simulación finalizada. ¡Éxito en el pitch!")
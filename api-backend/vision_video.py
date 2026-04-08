import cv2
import requests
import time
import os

URL_ANALISIS_IOT = "http://127.0.0.1:8000/analisis-iot"
URL_ALERTA = "http://127.0.0.1:8000/registrar-alerta-iot"

# --- BÚSQUEDA SEGURA DEL VIDEO ---
# Esto asegura que busque el video en la carpeta api-backend/data/
CARPETA_DATA = os.path.join(os.path.dirname(__file__), "data")
ruta_video = os.path.join(CARPETA_DATA, "test_route.mp4") # ASEGÚRATE QUE TU VIDEO SE LLAME ASÍ

cap = cv2.VideoCapture(ruta_video)

if not cap.isOpened():
    print(f"❌ Error: No se pudo abrir el video en:\n   {ruta_video}")
    print("👉 Revisa que el video esté en la carpeta 'data' y se llame 'test_route.mp4'.")
    exit()

print("📼 ECO-RUTA AI: SIMULADOR DE RUTA MUNICIPAL INICIADO")

fps = int(cap.get(cv2.CAP_PROP_FPS))
if fps == 0 or fps > 60: fps = 30 
frame_count = 0

# Variables para el HUD (pantalla)
estado_v = "Escaneando entorno..."
gravedad_v = "0"
accion_v = "Analizando..."
anomalia_v = "Ninguna"
objeto_v = "Buscando..."

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("🏁 Fin de la ruta simulada. (Video terminado o en bucle)")
        # Si quieres que el video se repita en bucle infinito, descomenta las siguientes 2 líneas:
        # cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        # continue
        break

    # Analizar 1 cuadro cada 3 segundos para eficiencia de API
    if frame_count % (fps * 3) == 0:
        print("\n🔍 Analizando punto de control...")
        _, buffer = cv2.imencode('.jpg', frame)
        
        try:
            # Enviamos al cerebro logístico (/analisis-iot)
            res = requests.post(URL_ANALISIS_IOT, files={'file': ('camion.jpg', buffer.tobytes(), 'image/jpeg')}, timeout=15)
            data = res.json()
            
            if data.get("status") == "success":
                info = data.get("datos_admin")
                
                # Actualizamos variables del HUD
                estado_v = info.get("estado_via", "Normal")
                gravedad_v = str(info.get("nivel_gravedad_alerta", "0"))
                accion_v = info.get("accion_recomendada", "Seguir ruta")
                anomalia_v = info.get("anomalias_detectadas", "Ninguna")
                objeto_v = info.get("objeto_detectado", "Ninguno")

                print(f"📍 Detectado: {objeto_v} | Vía: {estado_v} (G:{gravedad_v}) -> {accion_v}")

                # 3. Registrar alerta para Alfonso si es grave (Nivel 3 o más)
                if int(gravedad_v) >= 3:
                    requests.post(URL_ALERTA, json={
                        "ubicacion": "Ruta Simulada IA - Sector Norte",
                        "tipo_residuo": f"ALERTA {gravedad_v}/5: {objeto_v} / {anomalia_v}. Acción: {accion_v}"
                    })
            else:
                 print("⚠️ Error de API:", data.get("message"))
        except Exception as e:
            print(f"⚠️ Error de conexión (Asegúrate que uvicorn esté corriendo): {e}")

    # --- DISEÑO DEL HUD PARA EL JURADO ---
    frame = cv2.resize(frame, (1024, 576)) # Hacemos el video un poco más grande para el demo
    
    # Rectángulo de fondo para telemetría
    overlay = frame.copy()
    cv2.rectangle(overlay, (15, 15), (700, 180), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)

    # Colores dinámicos según gravedad
    gravedad_int = 0
    if gravedad_v.isdigit(): gravedad_int = int(gravedad_v)
    
    color_g = (0, 255, 0) # Verde
    if gravedad_int >= 3: color_g = (0, 165, 255) # Naranja
    if gravedad_int >= 5: color_g = (0, 0, 255) # Rojo

    # Textos en pantalla
    cv2.putText(frame, f"SISTEMA: ECO-RUTA AI | CAMION 404 (SIMULACION)", (30, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
    cv2.putText(frame, f"OBJETO: {objeto_v.upper()}", (30, 75), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 255), 2)
    cv2.putText(frame, f"VIA: {estado_v.upper()}", (30, 105), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
    cv2.putText(frame, f"GRAVEDAD: Nivel {gravedad_v}/5", (30, 135), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color_g, 2)
    cv2.putText(frame, f"ACCION: {accion_v}", (30, 165), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)

    # Mostrar ventana
    cv2.imshow('EcoRuta AI - Analisis de Ruta (Video IA)', frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
    
    frame_count += 1

cap.release()
cv2.destroyAllWindows()
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
from openai import OpenAI
import datetime
import os
from dotenv import load_dotenv
import json

load_dotenv()

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

api_key_segura = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key_segura)

alertas_municipales = []

# --- 1. APP CIUDADANA ---
@app.post("/reporte-ciudadano")
async def reporte_ciudadano(file: UploadFile = File(...)):
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode('utf-8')
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "Eres el asistente de la app EcoRuta AI de Riobamba. Eres amigable, educativo y experto en gestión de residuos. Debes responder SIEMPRE en formato JSON válido."},
                {"role": "user", "content": [
                    {"type": "text", "text": """Analiza esta imagen de basura o residuos y devuelve un JSON con esta estructura exacta:
                    {
                        "categoria": "Orgánico, Reciclable, No Reciclable, o Acumulación Ilegal",
                        "mensaje_ciudadano": "Un mensaje corto (1 oración) motivador o educativo para el usuario.",
                        "nivel_alerta_admin": "Bajo, Medio, o Alto",
                        "eco_puntos": Número entero (Ej: 50 si está bien separado, 0 si es ilegal)
                    }"""},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                ]}
            ],
            max_tokens=150
        )
        resultado_ia = json.loads(response.choices[0].message.content)
        return {"status": "success", "datos": resultado_ia}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- 2. IOT CAMIONES ---
@app.post("/analisis-iot")
async def analisis_iot(file: UploadFile = File(...)):
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode('utf-8')
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "Eres un sistema de visión artificial instalado en camiones de recolección de basura de Riobamba. Tu trabajo es auditar las calles y optimizar rutas. Responde SIEMPRE en formato JSON válido."},
                {"role": "user", "content": [
                    {"type": "text", "text": """Analiza esta imagen capturada por la cámara del camión y devuelve un JSON con esta estructura exacta para el Dashboard del Municipio:
                    {
                        "objeto_detectado": "Ej: Botella de plástico (Reciclable), Restos de comida (Orgánico), o Ninguno",
                        "estado_via": "Limpia, Residuos Normales, o Acumulación Severa",
                        "volumen_estimado": "Bajo, Medio, o Alto",
                        "nivel_gravedad_alerta": Número entero del 1 al 5,
                        "anomalias_detectadas": "Menciona si hay escombros, muebles, o basura fuera de fundas (Si no hay, pon 'Ninguna')",
                        "accion_recomendada": "Ruta normal, Enviar cuadrilla de limpieza especial, o Inspección por multa"
                    }"""},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                ]}
            ],
            max_tokens=200
        )
        resultado_iot = json.loads(response.choices[0].message.content)
        return {"status": "success", "datos_admin": resultado_iot}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- 3. REGISTRO DE ALERTAS ---
class AlertaIoT(BaseModel):
    ubicacion: str
    tipo_residuo: str

@app.post("/registrar-alerta-iot")
async def registrar_alerta(alerta: AlertaIoT):
    nueva_alerta = {
        "id": len(alertas_municipales) + 1,
        "hora": datetime.datetime.now().strftime("%H:%M:%S"),
        "ubicacion": alerta.ubicacion,
        "tipo": alerta.tipo_residuo
    }
    alertas_municipales.append(nueva_alerta)
    return {"status": "success", "message": "Alerta registrada en el panel municipal"}

# --- 4. DASHBOARD ADMIN ---
@app.get("/obtener-alertas")
async def obtener_alertas():
    return {"alertas": alertas_municipales}
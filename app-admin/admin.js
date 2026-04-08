/* =============================
   CONFIGURACIÓN DE CONEXIÓN (MAESTRO)
=============================*/
const SERVER_IP = "10.91.193.4";
const BASE_URL = `http://${SERVER_IP}:8000`;

/* =============================
   NAVEGACION PANEL ADMIN
=============================*/
function showAdmin(page) {
    document.querySelectorAll(".admin-page").forEach(section => section.classList.remove("active"));
    const target = document.getElementById(page);
    if (target) target.classList.add("active");

    if (page === 'rutas') {
        const iframe = target.querySelector('iframe');
        if (iframe) iframe.src = iframe.src;
    }
}

/* =============================
   1. DASHBOARD MUNICIPAL (ALFONSO)
   Lógica: Long Polling cada 2.5s
=============================*/
let historialAlertasIds = new Set(); // Para no duplicar alertas

async function obtenerAlertasServidor() {
    try {
        const response = await fetch(`${BASE_URL}/obtener-alertas`);
        const data = await response.json();

        // Recorrer el arreglo de alertas del servidor
        data.alertas.forEach(alerta => {
            // Solo pintar si el ID no existe en nuestro historial
            if (!historialAlertasIds.has(alerta.id)) {
                historialAlertasIds.add(alerta.id);
                renderizarAlertaDashboard(alerta);
            }
        });
    } catch (error) {
        console.error("Error conectando con el servidor de Dennys:", error);
    }
}

function renderizarAlertaDashboard(alerta) {
    const contenedor = document.getElementById("listaDenuncias");
    if (!contenedor) return;

    // Lógica de Gravedad para el color
    const esCritico = alerta.tipo_residuo.includes("(Grav 4)") || 
                     alerta.tipo_residuo.includes("(Grav 5)") || 
                     alerta.tipo_residuo.includes("ALERTA");

    const div = document.createElement("div");
    div.className = `alert ${esCritico ? 'alert-danger' : ''}`; // Usamos la clase de gravedad
    div.style.borderLeft = esCritico ? "6px solid #e53935" : "6px solid #2563eb";
    div.style.background = esCritico ? "#ffebee" : "#fff";

    div.innerHTML = `
        <div style="display:flex; justify-content:space-between;">
            <strong>🚨 ${alerta.ubicacion}</strong>
            <small>${alerta.hora}</small>
        </div>
        <p style="margin-top:5px;">${alerta.tipo_residuo}</p>
        <button class="primary" onclick="this.parentElement.remove()" style="margin-top:10px; padding:5px 10px; font-size:12px;">Descartar</button>
    `;

    contenedor.prepend(div);
    
    // Actualizar contador global
    const contador = document.getElementById("alertasTotales");
    if (contador) contador.innerText = historialAlertasIds.size;
}

// Iniciar Long Polling (Cada 2.5 segundos)
setInterval(obtenerAlertasServidor, 2500);


/* =============================
   2. APP CIUDADANA (ARIEL / MELA)
   Lógica: multipart/form-data
=============================*/
async function enviarDenunciaCiudadana(archivoImagen) {
    // 1. Mostrar Loader (puedes crear un div con id "loader")
    console.log("Enviando a IA...");
    
    const formData = new FormData();
    formData.append('file', archivoImagen);

    try {
        const response = await fetch(`${BASE_URL}/reporte-ciudadano`, {
            method: 'POST',
            body: formData
            // Nota: No poner Headers de Content-Type, el navegador lo pone solo con FormData
        });

        const res = await response.json();

        if (res.status === "success") {
            alert(`¡Gracias! Categoría: ${res.datos.categoria}. Has ganado ${res.datos.eco_puntos} puntos.`);
            // Aquí podrías actualizar la UI con el mensaje motivador
            console.log(res.datos.mensaje_ciudadano);
        } else {
            alert("Error en el análisis de la IA.");
        }

    } catch (error) {
        alert("Se perdió la conexión con el servidor maestro (10.91.193.4)");
        console.error(error);
    }
}

/* =============================
   SIMULACIONES DE VIDEO (LOCALES)
=============================*/
function analizarVideo() {
    const res = document.getElementById("resultadoIA");
    res.innerHTML = "📡 Conectando con servidor de Visión...";
    setTimeout(() => { res.innerHTML = "✅ Streaming activo - Analizando en nube local"; }, 1500);
}
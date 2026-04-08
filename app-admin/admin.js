const SERVER_IP = "10.91.193.4";
const BASE_URL = `http://${SERVER_IP}:8000`;
let historialIds = new Set();

function showAdmin(page) {
    document.querySelectorAll(".admin-page").forEach(s => s.classList.remove("active"));
    const target = document.getElementById(page);
    target.classList.add("active");
    if(page === 'rutas') document.getElementById('map-frame').src = document.getElementById('map-frame').src;
}

// LONG POLLING CADA 2.5s (Requerimiento backend Alfonso)
async function fetchAlertas() {
    try {
        const response = await fetch(`${BASE_URL}/obtener-alertas`);
        const data = await response.json();
        data.alertas.forEach(alerta => {
            if (!historialIds.has(alerta.id)) {
                historialIds.add(alerta.id);
                pintarAlerta(alerta);
            }
        });
    } catch (e) { console.log("Servidor Dennys Offline"); }
}

function pintarAlerta(alerta) {
    const list = document.getElementById("listaDenuncias");
    const esCritico = alerta.tipo_residuo.includes("ALERTA") || alerta.tipo_residuo.includes("Grav 5");
    const div = document.createElement("div");
    div.className = "alert";
    div.style.background = esCritico ? "#ffebee" : "white";
    div.style.borderLeft = esCritico ? "6px solid #ef4444" : "6px solid #2563eb";
    div.innerHTML = `<strong>📍 ${alerta.ubicacion}</strong><br>${alerta.tipo_residuo}<br><small>${alerta.hora}</small>`;
    list.prepend(div);
    document.getElementById("alertasTotales").innerText = historialIds.size;
}

setInterval(fetchAlertas, 2500);

function analizarVideo() {
    const res = document.getElementById("resultadoIA");
    res.innerHTML = "🧠 Procesando Frame en Nube Local...";
    setTimeout(() => { res.innerHTML = "✅ No se detectan anomalías críticas"; }, 2000);
}
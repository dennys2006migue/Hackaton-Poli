/* =============================
   NAVEGACION PANEL ADMIN
=============================*/
function showAdmin(page) {
    // Ocultar todas las páginas
    const sections = document.querySelectorAll(".admin-page");
    sections.forEach(section => {
        section.classList.remove("active");
    });

    // Mostrar la página seleccionada
    const target = document.getElementById(page);
    if (target) {
        target.classList.add("active");
    }

    // Refrescar iframe si es el mapa para evitar errores de carga
    if (page === 'rutas') {
        const iframe = target.querySelector('iframe');
        if (iframe) iframe.src = iframe.src;
    }
}

/* =============================
   CONTADOR GLOBAL ALERTAS
=============================*/
let totalAlertas = 0;

function crearAlerta(data) {
    totalAlertas++;
    const contador = document.getElementById("alertasTotales");
    if (contador) contador.innerText = totalAlertas;

    const contenedor = document.getElementById("listaDenuncias");
    if (!contenedor) return;

    const alerta = document.createElement("div");
    alerta.className = "alert";
    alerta.innerHTML = `
        <strong>🚨 Alerta detectada</strong><br>
        Tipo: ${data.tipo_residuo || data.evento}<br>
        Nivel: ${data.nivel_contaminacion || data.nivel}<br>
        Zona: ${data.zona || data.ubicacion || "Desconocida"}
        <br><br>
        <button class="primary" onclick="marcarAtendido(this)" style="padding:5px 10px; font-size:12px;">✔ Atendido</button>
    `;
    contenedor.prepend(alerta);
}

function marcarAtendido(btn) {
    const card = btn.parentElement;
    card.style.background = "#d4edda";
    card.style.borderLeft = "6px solid #28a745";
    card.innerHTML += "<br><strong>✅ Caso atendido</strong>";
    btn.remove();
}

/* =============================
   MQTT TIEMPO REAL
=============================*/
const client = new Paho.MQTT.Client(
    "broker.hivemq.com",
    8000,
    "admin_" + Math.random()
);

client.onMessageArrived = function(message) {
    try {
        const data = JSON.parse(message.payloadString);
        crearAlerta(data);
    } catch (e) {
        console.error("Error al parsear MQTT:", e);
    }
};

client.connect({
    onSuccess: function() {
        console.log("Admin conectado MQTT");
        client.subscribe("ecoruta/alertas");
    },
    useSSL: false
});

/* =============================
   SIMULACIONES IA
=============================*/
function analizarVideo() {
    const resultado = document.getElementById("resultadoIA");
    resultado.innerHTML = "🧠 Analizando video con IA...";
    setTimeout(() => {
        resultado.innerHTML = "🚨 IA detectó acumulación crítica de residuos";
        crearAlerta({ evento: "Contaminación por cámara", nivel: "ALTO", ubicacion: "Zona Centro" });
    }, 2000);
}

function analizarCamion() {
    const resultado = document.getElementById("resultadoCamion");
    resultado.innerHTML = "🚛 Analizando ruta del camión...";
    setTimeout(() => {
        resultado.innerHTML = "⚠ Ruta ineficiente detectada";
        crearAlerta({ evento: "Ruta ineficiente", nivel: "MEDIO", ubicacion: "Ruta Camión 3" });
    }, 2000);
}

function demoAlertasAutomaticas() {
    setInterval(() => {
        const niveles = ["BAJO", "MEDIO", "ALTO"];
        const zonas = ["Centro", "Norte", "Sur", "Mercado", "Terminal"];
        crearAlerta({
            evento: "Detección automática IA",
            nivel: niveles[Math.floor(Math.random() * 3)],
            ubicacion: zonas[Math.floor(Math.random() * 5)]
        });
    }, 15000);
}

demoAlertasAutomaticas();
/* =============================
   NAVEGACION PANEL ADMIN
=============================*/

function showAdmin(page){

    document.querySelectorAll(".admin-page")
        .forEach(section => section.classList.remove("active"));

    document.getElementById(page)
        .classList.add("active");
}


/* =============================
   CONTADOR GLOBAL ALERTAS
=============================*/

let totalAlertas = 0;


/* =============================
   CREAR TARJETA ALERTA
=============================*/

function crearAlerta(data){

    totalAlertas++;

    document.getElementById("alertasTotales")
        .innerText = totalAlertas;

    const contenedor = document.getElementById("listaDenuncias");

    const alerta = document.createElement("div");
    alerta.className = "alert";

    alerta.innerHTML = `
        <strong>🚨 Alerta detectada</strong><br>
        Tipo: ${data.tipo_residuo || data.evento}<br>
        Nivel: ${data.nivel_contaminacion || data.nivel}<br>
        Zona: ${data.zona || data.ubicacion || "Desconocida"}
        <br><br>
        <button onclick="marcarAtendido(this)">✔ Atendido</button>
    `;

    contenedor.prepend(alerta);
}


/* =============================
   MARCAR DENUNCIA ATENDIDA
=============================*/

function marcarAtendido(btn){

    const card = btn.parentElement;

    card.style.background = "#d4edda";
    card.innerHTML += "<br>✅ Caso atendido";
}


/* =============================
   MQTT TIEMPO REAL
=============================*/

const client = new Paho.MQTT.Client(
    "broker.hivemq.com",
    8000,
    "admin_" + Math.random()
);

client.onConnectionLost = function(){
    console.log("Conexión perdida MQTT");
};

client.onMessageArrived = function(message){

    console.log("Mensaje recibido:", message.payloadString);

    const data = JSON.parse(message.payloadString);

    crearAlerta(data);
};

client.connect({
    onSuccess: function(){
        console.log("Admin conectado MQTT");
        client.subscribe("ecoruta/alertas");
    }
});


/* =============================
   SIMULACION IA CAMARAS
=============================*/

function analizarVideo(){

    const resultado = document.getElementById("resultadoIA");

    resultado.innerHTML =
        "🧠 Analizando video con IA...";

    setTimeout(()=>{

        resultado.innerHTML =
        "🚨 IA detectó acumulación crítica de residuos";

        crearAlerta({
            evento:"Contaminación detectada por cámara",
            nivel:"ALTO",
            ubicacion:"Zona Centro"
        });

    },2000);
}


/* =============================
   SIMULACION IA CAMIONES
=============================*/

function analizarCamion(){

    const resultado = document.getElementById("resultadoCamion");

    resultado.innerHTML =
        "🚛 Analizando ruta del camión...";

    setTimeout(()=>{

        resultado.innerHTML =
        "⚠ Ruta ineficiente detectada";

        crearAlerta({
            evento:"Ruta ineficiente",
            nivel:"MEDIO",
            ubicacion:"Ruta Camión 3"
        });

    },2000);
}


/* =============================
   DEMO AUTOMATICA (WOW HACKATHON)
=============================*/

function demoAlertasAutomaticas(){

    setInterval(()=>{

        const niveles=["BAJO","MEDIO","ALTO"];
        const zonas=["Centro","Norte","Sur","Mercado","Terminal"];

        crearAlerta({
            evento:"Detección automática IA",
            nivel:niveles[Math.floor(Math.random()*3)],
            ubicacion:zonas[Math.floor(Math.random()*5)]
        });

    },15000);
}

// activar demo automática
demoAlertasAutomaticas();
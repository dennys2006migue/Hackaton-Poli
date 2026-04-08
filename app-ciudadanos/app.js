const SERVER_IP = "10.91.193.4";
const BASE_URL = `http://${SERVER_IP}:8000`;
let stream;
const video = document.getElementById('webcam');
const canvas = document.getElementById('photo-canvas');

/* =============================
   NAVEGACIÓN (CORREGIDA)
=============================*/
function showSection(sectionId, element) {
    // 1. Ocultar todas las secciones
    document.querySelectorAll('.app-section').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });

    // 2. Mostrar la sección seleccionada
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
    }

    // 3. Cambiar estado visual de los botones
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    element.classList.add('active');
}

/* =============================
   CÁMARA (VISUALIZACIÓN CORREGIDA)
=============================*/
async function triggerCamera() {
    document.getElementById('camera-overlay').classList.remove('hidden');
    video.classList.remove('hidden');
    canvas.classList.add('hidden');
    document.getElementById('btn-capture').classList.remove('hidden');
    document.getElementById('btn-upload').classList.add('hidden');

    try {
        // Configuramos para que use la cámara trasera en móviles
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" }, 
            audio: false 
        });
        video.srcObject = stream;
        video.play(); // Aseguramos que el video inicie
    } catch (err) {
        alert("No se pudo activar la cámara: " + err);
        closeCamera();
    }
}

function takePhoto() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    video.classList.add('hidden');
    canvas.classList.remove('hidden');
    
    document.getElementById('btn-capture').classList.add('hidden');
    document.getElementById('btn-upload').classList.remove('hidden');
}

async function confirmReport() {
    document.getElementById('loader-ia').classList.remove('hidden');
    
    canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append('file', blob, 'reporte_ia.jpg');

        try {
            const response = await fetch(`${BASE_URL}/reporte-ciudadano`, {
                method: 'POST',
                body: formData
            });
            const res = await response.json();

            if (res.status === "success") {
                // ENVIAR AL SUBMENU DE ALERTAS (No alert del navegador)
                agregarAlertaAlSubmenu(res.datos);
                actualizarHistorial(res.datos);
                closeCamera();
            }
        } catch (e) {
            alert("Error de conexión con el servidor maestro.");
        } finally {
            document.getElementById('loader-ia').classList.add('hidden');
        }
    }, 'image/jpeg');
}

/* =============================
   SUBMENU DE ALERTAS Y RECORDATORIOS
=============================*/
function agregarAlertaAlSubmenu(datos) {
    const list = document.getElementById('notif-list');
    const item = document.createElement('div');
    item.className = 'alert';
    item.style.borderLeft = "6px solid #10b981";
    item.style.background = "#f0fdf4";
    
    item.innerHTML = `
        <strong>✅ IA: ${datos.categoria}</strong><br>
        ${datos.mensaje_ciudadano}<br>
        <small>Has ganado ${datos.eco_puntos} EcoPuntos</small>
    `;
    list.prepend(item);
}

function actualizarHistorial(datos) {
    const list = document.getElementById('history-list');
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <strong>${datos.categoria}</strong><br>
        <small>${new Date().toLocaleString()}</small>
    `;
    list.prepend(card);
}

function closeCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    document.getElementById('camera-overlay').classList.add('hidden');
}
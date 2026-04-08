let map;
let userMarker;
let stream; 

// --- ELEMENTOS DEL DOM ---
const video = document.getElementById('webcam');
const canvas = document.getElementById('photo-canvas');
const placeholder = document.getElementById('camera-placeholder');
const cameraText = document.getElementById('camera-text');

// 1. INICIAR MAPA
function initMap() {
    map = L.map('map', { zoomControl: false }).setView([-1.6709, -78.6477], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    drawTruckRoutes();
}

// 2. RUTAS DE CAMIONES
function drawTruckRoutes() {
    const routeCoordinates = [
        [-1.6700, -78.6500],
        [-1.6750, -78.6550],
        [-1.6800, -78.6450],
        [-1.6850, -78.6500]
    ];

    L.polyline(routeCoordinates, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.7
    }).addTo(map);
}

// 3. LÓGICA DE CÁMARA
async function triggerCamera() {
    document.getElementById('camera-overlay').classList.remove('hidden');
    
    document.getElementById('btn-capture').classList.remove('hidden');
    document.getElementById('btn-upload').classList.add('hidden');
    video.classList.add('hidden');
    canvas.classList.add('hidden');
    placeholder.classList.remove('hidden');
    cameraText.innerText = "Preparando cámara...";

    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            placeholder.classList.add('hidden');
            cameraText.classList.add('hidden');
            video.classList.remove('hidden');
        };
    } catch (err) {
        cameraText.innerText = "Error al acceder a la cámara";
    }
}

function closeCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    document.getElementById('camera-overlay').classList.add('hidden');
}

// 4. FLUJO DE FOTO
function takePhoto() {
    if (!stream) return;

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    video.classList.add('hidden');
    canvas.classList.remove('hidden');

    document.getElementById('btn-capture').classList.add('hidden');
    document.getElementById('btn-upload').classList.remove('hidden');
}

function confirmReport() {
    const time = new Date().toLocaleTimeString();
    
    // A. Marcador en el Mapa
    L.circleMarker([map.getCenter().lat, map.getCenter().lng], {
        radius: 10, fillColor: "#10b981", color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.8
    }).addTo(map).bindPopup("Reporte realizado a las " + time).openPopup();

    // B. Llamar a funciones de actualización
    updateHistory(time);
    sendNotifications(time);

    closeCamera();
    alert("¡Reporte enviado con éxito! Revisa tus notificaciones.");
}

// 5. ACTUALIZACIÓN DE INTERFAZ (HISTORIAL Y ALERTAS)
function updateHistory(time) {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    const newCard = `
        <div class="card">
            <p><strong>Sector:</strong> Reporte IA Riobamba</p>
            <p>Fecha: ${new Date().toLocaleDateString()} - ${time}</p>
            <span class="badge" style="background:#dcfce7; color:#166534; font-weight:bold;">Completado ✅</span>
        </div>`;
    historyList.insertAdjacentHTML('afterbegin', newCard);
}

function sendNotifications(time) {
    const notifList = document.querySelector('#notifications-section .list-container');
    if (!notifList) return;

    setTimeout(() => {
        notifList.insertAdjacentHTML('afterbegin', `
            <div class="notif-item">
                <span class="material-icons" style="color:#10b981;">task_alt</span>
                <p>Tu reporte de las ${time} ha sido registrado.</p>
            </div>`);
    }, 1000);

    setTimeout(() => {
        notifList.insertAdjacentHTML('afterbegin', `
            <div class="notif-item">
                <span class="material-icons" style="color:#2563eb;">local_shipping</span>
                <p>⚠️ Alerta: Un camión pasará mañana a las 9:00 AM cerca de tu zona.</p>
            </div>`);
    }, 3000);

    setTimeout(() => {
        notifList.insertAdjacentHTML('afterbegin', `
            <div class="notif-item">
                <span class="material-icons" style="color:#10b981;">published_with_changes</span>
                <p>¡Limpieza completada! El municipio verificó la recolección.</p>
            </div>`);
    }, 5000);
}

// 6. NAVEGACIÓN Y ACCESO
function handleLogin() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    setTimeout(() => { map.invalidateSize(); }, 300);
}

function showSection(sectionId, element) {
    document.querySelectorAll('.app-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    element.classList.add('active');
    
    if(sectionId === 'map-section') {
        setTimeout(() => { map.invalidateSize(); }, 100);
    }
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            map.flyTo([latitude, longitude], 16);
            if (userMarker) map.removeLayer(userMarker);
            userMarker = L.marker([latitude, longitude]).addTo(map)
                .bindPopup("Tu ubicación actual").openPopup();
        });
    }
}

function logout() { location.reload(); }

window.onload = initMap;
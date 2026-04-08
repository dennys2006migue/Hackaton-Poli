let map;
let userMarker;

// Iniciar Mapa de Riobamba
function initMap() {
    map = L.map('map', { zoomControl: false }).setView([-1.6709, -78.6477], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

// Lógica de Login
function handleLogin() {
    const role = document.getElementById('role-selector').value;
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    
    // Si es admin, podrías redirigir o cambiar la vista
    if(role === 'admin') {
        alert("Modo Administrador Activo");
        // window.location.href = "../app-admin/dashboard.html"; // Ejemplo
    }
    
    setTimeout(() => { map.invalidateSize(); }, 200); // Ajuste de Leaflet
}

// Navegación entre secciones
function showSection(sectionId, element) {
    document.querySelectorAll('.app-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    element.classList.add('active');
    
    if(sectionId === 'map-section') setTimeout(() => { map.invalidateSize(); }, 100);
}

// Obtener Ubicación Real
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            map.flyTo([latitude, longitude], 16);
            if (userMarker) map.removeLayer(userMarker);
            userMarker = L.marker([latitude, longitude]).addTo(map)
                .bindPopup("Estás aquí").openPopup();
        });
    }
}

// Simulación de Cámara
function triggerCamera() {
    alert("Iniciando Cámara con IA (YOLOv8)... Analizando entorno de Riobamba.");
}

function logout() {
    location.reload();
}

window.onload = initMap;
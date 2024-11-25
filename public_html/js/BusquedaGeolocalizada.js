
document.addEventListener('DOMContentLoaded', function () {
    console.log("Página cargada.");

    // Mostrar la foto del usuario almacenada en sessionStorage
    const fotoUsuario = sessionStorage.getItem('foto');
    const fotoUsuarioElement = document.getElementById("fotoUsuario");

    if (fotoUsuarioElement && fotoUsuario) {
        fotoUsuarioElement.src = fotoUsuario;
        console.log("Foto de usuario cargada desde sessionStorage.");
    } else {
        console.warn("No se encontró la foto del usuario en sessionStorage.");
    }

    // Botón para volver al inicio
    document.getElementById("volverAlInicioBtn").addEventListener('click', function () {
        console.log("Volviendo al inicio...");
        window.location.href = 'logeado.html';
    });

    // Botón para cerrar sesión
    document.getElementById("botonCerrarSesion").addEventListener('click', function () {
        console.log("Cerrando sesión...");

        // Limpiar la información del usuario de sessionStorage
        sessionStorage.clear();

        // Redirigir a la página de inicio de sesión
        window.location.href = 'index.html';
    });

    // Inicializar el mapa
    initMap();
});

// Variable global para el círculo
let zonaCirculo;

// Función inicial para configurar el mapa
function initMap() {
    console.log("Inicializando el mapa...");

    const opcionesMapa = {
        zoom: 15,
        center: { lat: 0, lng: 0 }, // Coordenadas iniciales (0,0)
    };

    const mapa = new google.maps.Map(document.getElementById("map"), opcionesMapa);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (posicion) => {
                const ubicacion = {
                    lat: posicion.coords.latitude,
                    lng: posicion.coords.longitude,
                };

                console.log("Ubicación del usuario obtenida:", ubicacion);

                mapa.setCenter(ubicacion);

                // Crear un marcador en la ubicación actual del usuario
                new google.maps.Marker({
                    position: ubicacion,
                    map: mapa,
                    title: "Estás aquí",
                });

                // Crear un círculo inicial alrededor de la ubicación actual
                zonaCirculo = new google.maps.Circle({
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: "#FF0000",
                    fillOpacity: 0.35,
                    map: mapa,
                    center: ubicacion,
                    radius: 50, // Radio inicial en metros (0.05 km)
                });

                // Configurar el slider para ajustar el radio dinámicamente
                configurarSlider(mapa, ubicacion);

                // Obtener y mostrar usuarios desde IndexedDB
                agregarUsuariosAlMapa(mapa, ubicacion);
            },
            (error) => {
                console.error("Error al obtener la ubicación del usuario:", error.message);
                Swal.fire("No se pudo obtener la ubicación.");
            }
        );
    } else {
        console.error("El navegador no soporta geolocalización.");
        Swal.fire("Tu navegador no soporta geolocalización.");
    }
}

// Función para configurar el slider
function configurarSlider(mapa, ubicacion) {
    const slider = document.getElementById("radius-slider");
    const radiusValue = document.getElementById("radius-value");

    // Actualizar el valor mostrado del slider y el radio del círculo
    slider.addEventListener("input", function () {
        const nuevoRadioKm = parseFloat(slider.value); // Leer valor en kilómetros
        radiusValue.textContent = nuevoRadioKm.toFixed(2); // Mostrar valor con 2 decimales

        // Actualizar dinámicamente el radio del círculo en el mapa
        if (zonaCirculo) {
            zonaCirculo.setRadius(nuevoRadioKm * 1000); // Convertir kilómetros a metros
        }
    });

    console.log("Slider configurado.");
}

// Función para agregar usuarios al mapa desde IndexedDB
function agregarUsuariosAlMapa(mapa, ubicacionUsuarioActual) {
    console.log("Obteniendo usuarios geolocalizados desde IndexedDB...");

    const request = indexedDB.open('vitomaitebd', 1);

    // Obtener el nombre del usuario actual desde sessionStorage
    const usuarioActual = sessionStorage.getItem('nombre');
    console.log("Usuario logeado actualmente:", usuarioActual);

    request.onsuccess = function (event) {
        const db = event.target.result;

        console.log("Base de datos abierta con éxito.");

        const transaccion = db.transaction(['Usuarios'], 'readonly');
        const usuariosStore = transaccion.objectStore('Usuarios');

        const cursorRequest = usuariosStore.openCursor();

        cursorRequest.onsuccess = function (event) {
            const cursor = event.target.result;

            if (cursor) {
                const usuario = cursor.value;

                console.log("Procesando usuario:", usuario);

                // Omitir al usuario actual según su nombre
                if (usuario.nombre === usuarioActual) {
                    console.log(`Omitiendo al usuario actual: ${usuario.nombre}`);
                    cursor.continue();
                    return;
                }

                // Verificar coordenadas válidas
                if (usuario.lat && usuario.long) {
                    const ubicacionUsuario = {
                        lat: parseFloat(usuario.lat),
                        lng: parseFloat(usuario.long),
                    };

                    console.log("Agregando marcador para el usuario:", usuario.nombre, ubicacionUsuario);

                    // Crear un marcador con una ventana de información
                    const marcador = new google.maps.Marker({
                        position: ubicacionUsuario,
                        map: mapa,
                        title: usuario.nombre,
                    });

                    // Ventana de información
                    const infoWindow = new google.maps.InfoWindow({
                        content: `<div>
                            <h3>${usuario.nombre}</h3>
                            <p>Edad: ${usuario.edad}</p>
                        </div>`,
                    });

                    // Mostrar ventana de información al hacer clic
                    marcador.addListener('click', () => {
                        infoWindow.open(mapa, marcador);
                    });

                    // Mostrar ventana al pasar el ratón (opcional)
                    marcador.addListener('mouseover', () => {
                        infoWindow.open(mapa, marcador);
                    });

                    // Cerrar ventana al mover el ratón fuera
                    marcador.addListener('mouseout', () => {
                        infoWindow.close();
                    });
                } else {
                    console.warn("Coordenadas inválidas para el usuario:", usuario.nombre);
                }

                cursor.continue();
            } else {
                console.log("No hay más usuarios para procesar.");
            }
        };

        cursorRequest.onerror = function (event) {
            console.error("Error al abrir el cursor:", event.target.error);
        };
    };

    request.onerror = function (event) {
        console.error("Error al abrir la base de datos:", event.target.error);
    };
}

// Inicializar IndexedDB (opcional)
document.addEventListener('DOMContentLoaded', inicializarIndexedDB);

function inicializarIndexedDB() {
    const request = indexedDB.open('vitomaitebd', 1);

    request.onupgradeneeded = function (event) {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('Usuarios')) {
            const usuariosStore = db.createObjectStore('Usuarios', { keyPath: 'id', autoIncrement: true });
            usuariosStore.createIndex('nombre', 'nombre', { unique: false });
            usuariosStore.createIndex('lat', 'lat', { unique: false });
            usuariosStore.createIndex('long', 'long', { unique: false });

            console.log("IndexedDB configurada correctamente.");
        }
    };

    request.onsuccess = function () {
        console.log("IndexedDB abierta correctamente.");
    };

    request.onerror = function (event) {
        console.error("Error al abrir IndexedDB:", event.target.error);
    };
}









document.getElementById("volverAlInicioBtn").addEventListener('click', function () {
    
    window.location.href = 'logeado.html';
}
);



document.getElementById("busquedaAficionesBtn").addEventListener('click', function () {
    
    window.location.href = 'BusquedaAficiones.html';
}
);

document.getElementById("busquedaGeolocalizadaBtn").addEventListener('click', function () {
    
    window.location.href = 'BusquedaGeolocalizada.html';
}
);


document.addEventListener('DOMContentLoaded', function () {
    // Mostrar mensaje de bienvenida
    var nombreUsuario = sessionStorage.getItem('nombre');
    var fotoUsuario = sessionStorage.getItem('foto');
    var fotoUsuarioElement = document.getElementById("fotoUsuario");

    if (fotoUsuarioElement && fotoUsuario) {
        fotoUsuarioElement.src = fotoUsuario;
    }

    // Cargar los desplegables de edades
    var edadMinSelect = document.getElementById('edadMin');
    var edadMaxSelect = document.getElementById('edadMax');

    for (var i = 18; i <= 99; i++) {
        var optionMin = document.createElement('option');
        optionMin.value = i;
        optionMin.textContent = i;
        edadMinSelect.appendChild(optionMin);

        var optionMax = document.createElement('option');
        optionMax.value = i;
        optionMax.textContent = i;
        edadMaxSelect.appendChild(optionMax);
    }
});

// Cerrar sesión
document.getElementById("botonCerrarSesion").addEventListener('click', function () {
    sessionStorage.clear();
    window.location.href = 'index.html';
});

// Botón para buscar usuarios
document.getElementById("buscarBtn").addEventListener('click', function () {
    var contenedorUsuarios = document.getElementById("contenedorUsuarios");
    contenedorUsuarios.innerHTML = '';
    mostrarUsuarios();
});

// Función para mostrar usuarios
function mostrarUsuarios() {
    var contenedorUsuarios = document.getElementById("contenedorUsuarios");
    contenedorUsuarios.innerHTML = "";

    var solicitud = indexedDB.open("vitomaitebd", 1);

    solicitud.onsuccess = function (evento) {
        var db = evento.target.result;
        var transaccion = db.transaction(["Usuarios"], "readonly");
        var usuariosStore = transaccion.objectStore("Usuarios");

        var cursor = usuariosStore.index("edad").openCursor();

        var hayUsuarios = false;
        var hayUsuariosEnTabla = false;

        cursor.onsuccess = function (eventoCursor) {
            var resultado = eventoCursor.target.result;

            if (resultado) {
                hayUsuariosEnTabla = true;
                var usuario = resultado.value;

                var genero = document.getElementById('genero').value;
                var ciudad = document.getElementById('ciudad').value;
                var edadMin = parseInt(document.getElementById('edadMin').value);
                var edadMax = parseInt(document.getElementById('edadMax').value);

                // Filtro condicional para mostrar usuarios que cumplen los criterios
                var cumpleCriterios =
                    (usuario.genero === genero || !genero) &&
                    (usuario.ciudad === ciudad || !ciudad) &&
                    usuario.edad >= edadMin &&
                    usuario.edad <= edadMax;

                if (cumpleCriterios) {
                    var emailUsuario = sessionStorage.getItem('email');
                    if (emailUsuario !== usuario.email) {
                        agregarUsuarioALaInterfaz(usuario);
                        hayUsuarios = true;
                    }
                }

                resultado.continue();
            } else {
                if (!hayUsuariosEnTabla) {
                    Swal.fire("No hay usuarios!");
                } else if (!hayUsuarios) {
                    Swal.fire("No hay usuarios con ese perfil!");
                }
            }
        };

        cursor.onerror = function () {
            console.error("Error al abrir el cursor.");
        };
    };

    solicitud.onerror = function () {
        console.error("Error al abrir la base de datos");
    };
}

// Función para agregar usuarios a la interfaz
function agregarUsuarioALaInterfaz(usuario) {
    var contenedorUsuarios = document.getElementById("contenedorUsuarios");

    // Verificar si ya existe la tabla
    var tablaUsuarios = document.querySelector(".tabla-usuarios");

    if (!tablaUsuarios) {
        // Crear la tabla si no existe
        tablaUsuarios = document.createElement("table");
        tablaUsuarios.className = "tabla-usuarios";

        // Crear cabecera de la tabla
        var filaCabecera = document.createElement("tr");
        var nombreCabecera = document.createElement("th");
        nombreCabecera.textContent = "Nombre";
        var edadCabecera = document.createElement("th");
        edadCabecera.textContent = "Edad";
        var ciudadCabecera = document.createElement("th");
        ciudadCabecera.textContent = "Ciudad";
        var fotoCabecera = document.createElement("th");
        fotoCabecera.textContent = "Foto";

        filaCabecera.appendChild(nombreCabecera);
        filaCabecera.appendChild(edadCabecera);
        filaCabecera.appendChild(ciudadCabecera);
        filaCabecera.appendChild(fotoCabecera);
        tablaUsuarios.appendChild(filaCabecera);

        contenedorUsuarios.appendChild(tablaUsuarios);
    }

    // Crear fila para el usuario
    var filaUsuario = document.createElement("tr");

    var nombreCelda = document.createElement("td");
    nombreCelda.textContent = usuario.nombre;

    var edadCelda = document.createElement("td");
    edadCelda.textContent = usuario.edad;

    var ciudadCelda = document.createElement("td");
    ciudadCelda.textContent = usuario.ciudad;

    var fotoCelda = document.createElement("td");
    var fotoUsuario = document.createElement("img");
    fotoUsuario.src = usuario.foto || fotoanonima;
    fotoUsuario.alt = `Foto de ${usuario.nombre}`;
    fotoUsuario.style.width = "50px";
    fotoUsuario.style.borderRadius = "50%";
    fotoUsuario.style.cursor = "pointer";

    fotoUsuario.addEventListener("click", function () {
        obtenerAficionesYMostrarDetalles(usuario);
    });

    fotoCelda.appendChild(fotoUsuario);

    filaUsuario.appendChild(nombreCelda);
    filaUsuario.appendChild(edadCelda);
    filaUsuario.appendChild(ciudadCelda);
    filaUsuario.appendChild(fotoCelda);

    tablaUsuarios.appendChild(filaUsuario);
}

// Obtener aficiones y mostrar detalles del usuario
function obtenerAficionesYMostrarDetalles(usuario) {
    var solicitud = indexedDB.open("vitomaitebd", 1);

    solicitud.onsuccess = function (evento) {
        var db = evento.target.result;

        var transaccion = db.transaction(["AficionesUsuarios", "Aficiones"], "readonly");
        var aficionesUsuariosStore = transaccion.objectStore("AficionesUsuarios");
        var aficionesStore = transaccion.objectStore("Aficiones");

        var index = aficionesUsuariosStore.index("email");
        var cursor = index.openCursor(IDBKeyRange.only(usuario.email));

        var aficionesIds = [];
        var aficiones = [];

        cursor.onsuccess = function (eventoCursor) {
            var resultado = eventoCursor.target.result;

            if (resultado) {
                aficionesIds.push(resultado.value.aficion);
                resultado.continue();
            } else {
                // Buscar nombres de las aficiones
                if (aficionesIds.length > 0) {
                    var count = 0;
                    aficionesIds.forEach(function (id) {
                        var request = aficionesStore.get(id);

                        request.onsuccess = function (eventoAficion) {
                            aficiones.push(eventoAficion.target.result.nombre);
                            count++;
                            if (count === aficionesIds.length) {
                                mostrarVentana(usuario, aficiones);
                            }
                        };
                    });
                } else {
                    mostrarVentana(usuario, []);
                }
            }
        };
    };

    solicitud.onerror = function () {
        console.error("Error al abrir la base de datos");
    };
}

// Función para mostrar los detalles del usuario en una ventana superpuesta
function mostrarVentana(usuario, aficiones) {
    var overlay = document.createElement("div");
    overlay.id = "overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    overlay.style.zIndex = "1000";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";

    var content = document.createElement("div");
    content.style.backgroundColor = "white";
    content.style.padding = "20px";
    content.style.borderRadius = "10px";
    content.style.width = "400px";
    content.style.textAlign = "center";

    // Añadir información del usuario
    content.innerHTML = `
        <h2>${usuario.nombre}</h2>
        <p><strong>Género:</strong> ${usuario.genero}</p>
        <p><strong>Edad:</strong> ${usuario.edad}</p>
        <p><strong>Altura:</strong> ${usuario.altura}</p>
        <p><strong>Ciudad:</strong> ${usuario.ciudad}</p>
        <p><strong>Aficiones:</strong> ${aficiones.join(", ") || "No especificadas"}</p>
        <div id="mapaUsuario" style="width: 100%; height: 200px; margin-top: 10px;"></div>
    `;

    // Botón de cerrar
    var closeButton = document.createElement("button");
    closeButton.textContent = "Cerrar";
    closeButton.style.marginTop = "10px";
    closeButton.addEventListener("click", function () {
        document.body.removeChild(overlay);
    });

    content.appendChild(closeButton);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Inicializar el mapa
    initMapaUsuario(usuario.lat, usuario.long);
}

// Inicializar el mapa de Google Maps
function initMapaUsuario(lat, long) {
    var map = new google.maps.Map(document.getElementById("mapaUsuario"), {
        center: { lat: parseFloat(lat), lng: parseFloat(long) },
        zoom: 14,
    });

    new google.maps.Marker({
        position: { lat: parseFloat(lat), lng: parseFloat(long) },
        map: map,
        title: "Ubicación del usuario"
    });
}
fotoanonima = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEmWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI0LTExLTIxPC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkV4dElkPjA3OWJlMWZhLTYxZDYtNGY4MS04MmJmLWI0ZGIyOTA0MWY3NDwvQXR0cmliOkV4dElkPgogICAgIDxBdHRyaWI6RmJJZD41MjUyNjU5MTQxNzk1ODA8L0F0dHJpYjpGYklkPgogICAgIDxBdHRyaWI6VG91Y2hUeXBlPjI8L0F0dHJpYjpUb3VjaFR5cGU+CiAgICA8L3JkZjpsaT4KICAgPC9yZGY6U2VxPgogIDwvQXR0cmliOkFkcz4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6ZGM9J2h0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvJz4KICA8ZGM6dGl0bGU+CiAgIDxyZGY6QWx0PgogICAgPHJkZjpsaSB4bWw6bGFuZz0neC1kZWZhdWx0Jz5mb3RvYW5vbmltYSAtIDE8L3JkZjpsaT4KICAgPC9yZGY6QWx0PgogIDwvZGM6dGl0bGU+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRlc2NyaXB0aW9uIHJk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";




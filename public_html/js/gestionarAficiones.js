/////TODO LO DEL INICIO (añadir la foto, boton de cerrar sesion y boton de volver al inicio)

document.getElementById("volverAlInicioBtn").addEventListener('click', function () {
    
    window.location.href = 'logeado.html';
}
);

document.getElementById("botonCerrarSesion").addEventListener('click', function () {
// Limpiar la información del usuario de sessionStorage
    sessionStorage.removeItem('email');
    sessionStorage.removeItem('nombre');
    sessionStorage.removeItem('foto');
    sessionStorage.removeItem('genero');
    sessionStorage.removeItem('ciudad');
    sessionStorage.removeItem('edad');

    // Redirigir a la página de inicio de sesión
    window.location.href = 'index.html';
}
);


document.addEventListener('DOMContentLoaded', function () {
    // Mostrar mensaje de bienvenida
    usuarioEmail = sessionStorage.getItem('email');

    fotoUsuario = sessionStorage.getItem('foto');
    fotoUsuarioElement = document.getElementById("fotoUsuario");


    if (fotoUsuarioElement && fotoUsuario) {
        fotoUsuarioElement.src = fotoUsuario;
    }
    
    cargarAficiones(usuarioEmail);

});


    document.getElementById('botonActualizarAficiones').addEventListener('click', function () {
        actualizarAficiones(usuarioEmail);
    });
    
    function cargarAficiones(emailUsuario) {
    const dbRequest = indexedDB.open("vitomaitebd", 1);

    dbRequest.onsuccess = function (event) {
        const db = event.target.result;

        const transaction = db.transaction(["AficionesUsuarios", "Aficiones"], "readonly");
        const aficionesUsuariosStore = transaction.objectStore("AficionesUsuarios");
        const aficionesStore = transaction.objectStore("Aficiones");

        const usuarioAficiones = [];
        const todasLasAficiones = [];

        aficionesUsuariosStore.openCursor().onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.value.email === emailUsuario) {
                    usuarioAficiones.push(cursor.value.aficion);
                }
                cursor.continue();
            } else {
                aficionesStore.getAll().onsuccess = function (event) {
                    todasLasAficiones.push(...event.target.result);

                    const aficionesRestantes = todasLasAficiones.filter(
                        (aficion) => !usuarioAficiones.includes(aficion.id)
                    );

                    generarCheckboxes(
                        "aficionesDelUsuarioContainer",
                        usuarioAficiones,
                        todasLasAficiones,
                        "Aficiones del Usuario"
                    );
                    generarCheckboxes(
                        "aficionesPorAñadirContainer",
                        aficionesRestantes.map((aficion) => aficion.id),
                        todasLasAficiones,
                        "Aficiones por Añadir"
                    );
                };
            }
        };
    };

    dbRequest.onerror = function () {
        Swal.fire('Error', 'No se pudo cargar las aficiones desde la base de datos.', 'error');
    };
}

function generarCheckboxes(containerId, aficionesIds, todasLasAficiones, titulo) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    const tituloElemento = document.createElement("h3");
    tituloElemento.textContent = titulo;
    container.appendChild(tituloElemento);

    const checkboxGroup = document.createElement("div");
    checkboxGroup.className = "checkbox-group";

    aficionesIds.forEach((aficionId) => {
        const aficion = todasLasAficiones.find((item) => item.id === aficionId);
        if (aficion) {
            const label = document.createElement("label");
            label.textContent = aficion.nombre;

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = containerId;
            checkbox.value = aficion.id;

            label.prepend(checkbox);
            checkboxGroup.appendChild(label);
        }
    });

    container.appendChild(checkboxGroup);
}

function actualizarAficiones(emailUsuario) {
    const dbRequest = indexedDB.open("vitomaitebd", 1);

    dbRequest.onsuccess = function (event) {
        const db = event.target.result;

        const aficionesPorEliminar = obtenerAficionesSeleccionadas("aficionesDelUsuarioContainer");
        const aficionesPorAñadir = obtenerAficionesSeleccionadas("aficionesPorAñadirContainer");

        const transaction = db.transaction("AficionesUsuarios", "readwrite");
        const aficionesUsuariosStore = transaction.objectStore("AficionesUsuarios");

        // Eliminar aficiones seleccionadas
        aficionesPorEliminar.forEach((aficionId) => {
            const index = aficionesUsuariosStore.index("email");
            const request = index.openCursor(IDBKeyRange.only(emailUsuario));

            request.onsuccess = function (event) {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.aficion === aficionId) {
                        cursor.delete();
                        console.log(`Afición con ID ${aficionId} eliminada para ${emailUsuario}`);
                    }
                    cursor.continue();
                }
            };

            request.onerror = function () {
                console.error(`Error al eliminar la afición con ID ${aficionId} para ${emailUsuario}`);
            };
        });

        // Añadir nuevas aficiones seleccionadas
        aficionesPorAñadir.forEach((aficionId) => {
            aficionesUsuariosStore.add({ email: emailUsuario, aficion: aficionId });
            console.log(`Afición con ID ${aficionId} añadida para ${emailUsuario}`);
        });

        transaction.oncomplete = function () {
            Swal.fire('Actualizado', 'Las aficiones se han actualizado correctamente.', 'success').then(() => {
                window.location.href = 'Logeado.html';
            });
        };

        transaction.onerror = function () {
            Swal.fire('Error', 'No se pudieron actualizar las aficiones.', 'error');
        };
    };

    dbRequest.onerror = function () {
        Swal.fire('Error', 'No se pudo abrir la base de datos para actualizar aficiones.', 'error');
    };
}

function obtenerAficionesSeleccionadas(containerId) {
    const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`);
    return Array.from(checkboxes).map((checkbox) => parseInt(checkbox.value, 10));
}
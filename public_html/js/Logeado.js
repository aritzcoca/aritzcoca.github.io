//Saludar al Usuario en la nav bar con mensaje de bienvenida con su nombre 

document.addEventListener('DOMContentLoaded', function () {
    // Obtener la información del usuario de sessionStorage
    var nombreUsuario = sessionStorage.getItem('nombre');
    var fotoUsuario = sessionStorage.getItem('foto');
    // Mostrar el mensaje de bienvenida
    var mensajeBienvenida = document.getElementById("mensajeBienvenida");
    mensajeBienvenida.textContent = "Bienvenido/a, " + nombreUsuario;
    // Mostrar la foto del usuario
    var fotoUsuarioElement = document.getElementById("fotoUsuario");

    if (fotoUsuario === '')
        fotoUsuarioElement.src = "img/1.png";
    else
        fotoUsuarioElement.src = fotoUsuario;
});

//Botón de cerrar sesión

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
});

//Botón para ver los likes que he recibido 
document.getElementById("misLikesBtn").addEventListener('click', function () {
    var contenedorLikes = document.getElementById("contenedorLikes");
    contenedorLikes.value = '';
    mostrarLikes();
});

function mostrarLikes() {
    var contenedorLikes = document.getElementById("contenedorLikes");
    contenedorLikes.innerHTML = "";

    var solicitud = indexedDB.open("vitomaitebd", 1);

    solicitud.onsuccess = function (evento) {
        var db = evento.target.result;
        var transaccion = db.transaction(["Likes"], "readonly");
        var LikessStore = transaccion.objectStore("Likes");
        var cursor = LikessStore.openCursor();

        var tienesLikes = false;
        
        var emailUsuario = sessionStorage.getItem('email');

        cursor.onsuccess = function (eventoCursor) {
            var resultado = eventoCursor.target.result;

            if (resultado) {
                

                var like = resultado.value;
                if (like.usuario2 === emailUsuario) {
                    tienesLikes = true;
                    verificarMatchYAgregarLike(like);
                }

                // Mover al siguiente registro
                resultado.continue();
            } else {
                // Cuando el cursor termina de recorrer la tabla
                 if (!tienesLikes) {
                    Swal.fire("No tienes likes a tu perfil!\n :/");
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

function verificarMatchYAgregarLike(like) {
    var solicitud = indexedDB.open("vitomaitebd", 1);

    solicitud.onsuccess = function (evento) {
        var db = evento.target.result;
        var transaccion = db.transaction(["Likes"], "readonly");
        var visitasStore = transaccion.objectStore("Likes");
        var cursor = visitasStore.openCursor();

        var emailUsuario = sessionStorage.getItem('email');
        var matchEncontrado = false;

        cursor.onsuccess = function (eventoCursor) {
            var resultado = eventoCursor.target.result;

            if (resultado) {
                var likeReverso = resultado.value;

                // Comprobar si existe un like inverso (mutuo)
                if (likeReverso.usuario1 === emailUsuario && likeReverso.usuario2 === like.usuario1) {
                    matchEncontrado = true;
                }

                resultado.continue();
            } else {
                // Una vez terminado el cursor, agregar el like a la interfaz con la información de si hay match
                agregarLikeALaInterfaz(like, matchEncontrado);
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

function agregarLikeALaInterfaz(like, esMatch) {
    var contenedorLikes = document.getElementById("contenedorLikes");
    var tablaLikes = document.querySelector(".tabla-likes");

    if (!tablaLikes) {
        // Crear la tabla solo si no existe
        tablaLikes = document.createElement("table");
        tablaLikes.className = "tabla-likes";

        // Crear la fila de la cabecera
        var filaCabecera = document.createElement("tr");

        // Crear celdas de la cabecera
        var fechaCabecera = document.createElement("th");
        fechaCabecera.textContent = "Fecha Like";

        var usuarioCabecera = document.createElement("th");
        usuarioCabecera.textContent = "Usuario";

        var fotoCabecera = document.createElement("th");
        fotoCabecera.textContent = "Foto";

        var matchCabecera = document.createElement("th");
        matchCabecera.textContent = "Match";

        // Agregar celdas de la cabecera a la fila de la cabecera
        filaCabecera.appendChild(fechaCabecera);
        filaCabecera.appendChild(usuarioCabecera);
        filaCabecera.appendChild(fotoCabecera);
        filaCabecera.appendChild(matchCabecera);

        // Añadir la cabecera a la tabla
        tablaLikes.appendChild(filaCabecera);
        contenedorLikes.appendChild(tablaLikes);
    }

    var filaLike = document.createElement("tr");
    var fechaCelda = document.createElement("td");
    fechaCelda.textContent = extraerFecha(like.fecha);

    var usuarioCelda = document.createElement("td");
    var fotoCelda = document.createElement("td");
    var matchCelda = document.createElement("td");

    var fotoUsuario = document.createElement("img");
    fotoUsuario.style.width = "50px";
    fotoUsuario.style.borderRadius = "50%";

    var emailUsuario = like.usuario1;

    obtenerInformacionUsuario(emailUsuario, function (usuario) {
        if (usuario) {
            // Mostrar el nombre del usuario
            usuarioCelda.textContent = usuario.nombre;

            // Asignar la foto del usuario, si no tiene, usar la foto anónima
            fotoUsuario.src = usuario.foto && usuario.foto.trim() !== "" ? usuario.foto : fotoanonima;

            if (esMatch) {
                // Mostrar el icono del corazón si hay match
                var corazonImg = document.createElement("img");
                corazonImg.src = "img/like.png";
                corazonImg.alt = "Match!";
                corazonImg.style.width = "30px";
                corazonImg.style.cursor = "pointer";

                corazonImg.addEventListener("click", function () {
                    Swal.fire("¡Tienes un match con " + usuario.nombre + "!");
                });

                matchCelda.appendChild(corazonImg);
            }
        } else {
            console.log("Usuario no encontrado o error al buscar.");
            usuarioCelda.textContent = "Desconocido";
            fotoUsuario.src = fotoanonima; // Usar foto anónima si no se encuentra el usuario
        }

        fotoCelda.appendChild(fotoUsuario);
    });

    filaLike.appendChild(fechaCelda);
    filaLike.appendChild(usuarioCelda);
    filaLike.appendChild(fotoCelda);
    filaLike.appendChild(matchCelda);

    // Agregar la fila del artículo a la tabla
    tablaLikes.appendChild(filaLike);
}

//Extrae la fecha con hora del like
function extraerFecha(fechaConHora) {
    // Separa la fecha y la hora en el punto 'T'
    const [fecha] = fechaConHora.split('T');

    // Retorna solo la parte de la fecha
    return fecha;
}

 
//Sirve para obtener la información de un usuario con su email, sacandolo de la bd
function obtenerInformacionUsuario(email, callback) {
    var solicitud = indexedDB.open("vitomaitebd", 1);

    solicitud.onsuccess = function (evento) {
        var db = evento.target.result;
        var transaccion = db.transaction(["Usuarios"], "readonly");
        var usuariosStore = transaccion.objectStore("Usuarios");

        // Buscar el usuario por email usando el índice
        var indiceEmail = usuariosStore.index("email");
        var cursor = indiceEmail.openCursor(IDBKeyRange.only(email));

        cursor.onsuccess = function (eventoCursor) {
            var resultado = eventoCursor.target.result;

            if (resultado) {
                // Llamar al callback con toda la información del usuario
                callback(resultado.value);
            } else {
                // Si no se encuentra el usuario, llamar al callback con null
                callback(null);
            }
        };

        cursor.onerror = function () {
            console.error("Error al buscar el usuario");
            callback(null);
        };
    };

    solicitud.onerror = function () {
        console.error("Error al abrir la base de datos");
        callback(null);
    };
}

document.getElementById("buscarBtn").addEventListener('click', function () {

    window.location.href = 'Busqueda.html';
}
);

document.getElementById("editarPerfilBtn").addEventListener('click', function () {

    window.location.href = 'EditarPerfil.html';
}
);

fotoanonima = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEmWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI0LTExLTIxPC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkV4dElkPjA3OWJlMWZhLTYxZDYtNGY4MS04MmJmLWI0ZGIyOTA0MWY3NDwvQXR0cmliOkV4dElkPgogICAgIDxBdHRyaWI6RmJJZD41MjUyNjU5MTQxNzk1ODA8L0F0dHJpYjpGYklkPgogICAgIDxBdHRyaWI6VG91Y2hUeXBlPjI8L0F0dHJpYjpUb3VjaFR5cGU+CiAgICA8L3JkZjpsaT4KICAgPC9yZGY6U2VxPgogIDwvQXR0cmliOkFkcz4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6ZGM9J2h0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvJz4KICA8ZGM6dGl0bGU+CiAgIDxyZGY6QWx0PgogICAgPHJkZjpsaSB4bWw6bGFuZz0neC1kZWZhdWx0Jz5mb3RvYW5vbmltYSAtIDE8L3JkZjpsaT4KICAgPC9yZGY6QWx0PgogIDwvZGM6dGl0bGU+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRlc2NyaXB0aW9uIHJk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";





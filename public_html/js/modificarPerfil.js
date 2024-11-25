
document.addEventListener('DOMContentLoaded', function () {
    // Mostrar mensaje de bienvenida
    
    var fotoUsuario = sessionStorage.getItem('foto');
    var fotoUsuarioElement = document.getElementById("fotoUsuario");


    if (fotoUsuarioElement && fotoUsuario) {
        fotoUsuarioElement.src = fotoUsuario;
    }
});


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


////////////////////////////CHAT////////////////////////////////////////////
//Cargar una nueva imagen y que se vea en pantalla
document.getElementById('fotoEquipo').addEventListener('change', function() {
    const inputFile = document.getElementById('fotoEquipo');
    const file = inputFile.files[0];

    if (file) {
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];

        if (!validImageTypes.includes(file.type)) {
            alert('Por favor, sube un archivo de imagen válido (JPEG, PNG o GIF).');
            inputFile.value = ''; // Limpiar la selección si el archivo no es válido
            return;
        }

        // Mostrar la imagen en la pantalla******************************************************************************************************
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgElement = document.createElement('img');
            imgElement.src = e.target.result;
            imgElement.style.maxWidth = '300px'; // Ajusta el tamaño de la imagen como desees

            // Limpiar el contenedor y añadir la nueva imagen
            const container = document.getElementById('imageContainer');
            container.innerHTML = ''; // Limpiar contenido previo
            container.appendChild(imgElement);
        };

        reader.readAsDataURL(file);
    } else {
        alert('No se ha seleccionado ninguna imagen.');
    }
});



document.getElementById('botonGuardarCambios').addEventListener('click', function() {
   
   
   console.error("Aqui");
   imagenCuadradaBase64 = null;
   //let ciudadSeleccionada = null;
   
   
   imgElement = document.getElementById('imageContainer').querySelector('img');
    
    if (imgElement) {
        // Crear un canvas para redimensionar la imagen
        canvas = document.createElement('canvas');
        context = canvas.getContext('2d');

        // Fijar las dimensiones del canvas a 50px x 50px
        const targetSize = 60;
        canvas.width = targetSize;
        canvas.height = targetSize;

        // Dibujar la imagen en el canvas redimensionándola
        context.drawImage(imgElement, 0, 0, targetSize, targetSize);

        // Convertir el canvas a una imagen en Base64
        imagenCuadradaBase64 = canvas.toDataURL('image/png'); 

        // Guardar la imagen redimensionada en sessionStorage
        sessionStorage.setItem('foto', imagenCuadradaBase64);
        console.log("HOLA");
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////
     // Guardar la ciudad seleccionada en sessionStorage y IndexedDB
    elementoCiudadSeleccionada = document.querySelector('input[name="ciudad"]:checked');
    ciudadSeleccionada = elementoCiudadSeleccionada ? elementoCiudadSeleccionada.id : null;

    if (ciudadSeleccionada) {
        sessionStorage.setItem('ciudad', ciudadSeleccionada);
        
    }
    console.log (imagenCuadradaBase64);
        if (imagenCuadradaBase64 || ciudadSeleccionada) {
        console.log ("ENTRO EN ACTUALIZAR INDEXED");
        actualizarDatosEnIndexedDB(imagenCuadradaBase64, ciudadSeleccionada);

    } else {
        console.log("No se realizaron cambios en la foto o la ciudad.");
    }

      window.location.href = 'logeado.html';


    });
    
     ////////////////////////////////////////////////////////////////////////////////////////////////
     




function actualizarDatosEnIndexedDB(fotoBase64, ciudad) {
    const userId = sessionStorage.getItem('email'); // Email del usuario como clave primaria
    console.log("LLEGO");
    if (!userId) {
        console.error("No se encontró el usuario en sessionStorage.");
        return;
    }

    const request = indexedDB.open('vitomaitebd', 1); // Cambia al nombre de tu base de datos

    request.onsuccess = function (event) {
        const db = event.target.result;
                
        const transaction = db.transaction(["Usuarios"], 'readwrite'); // Cambia 'Usuarios' al nombre de tu tabla
        const store = transaction.objectStore("Usuarios");

        // Obtener el registro actual del usuario
        const index = store.index('email');
        const getRequest = index.get(userId);
        
        getRequest.onsuccess = function () {
        const userData = getRequest.result;

            if (userData) {
                // Actualizar los campos necesarios
                if (fotoBase64) {
                    userData.foto = fotoBase64;
                }
                if (ciudad) {
                    userData.ciudad = ciudad;
                }

                // Guardar el registro actualizado
                const updateRequest = store.put(userData);
                updateRequest.onsuccess = function () {
                    console.log("Los cambios se guardaron correctamente en IndexedDB.");
                };

                updateRequest.onerror = function () {
                    console.error("Error al guardar los cambios en IndexedDB.");
                    console.log("Error al guardar los cambios en IndexedDB.");

                };
            } else {
                console.error("No se encontró el usuario en IndexedDB.");
                console.log("No se encontró el usuario en IndexedDB.");
            }
        };

        getRequest.onerror = function () {
            console.error("Error al obtener el registro del usuario en IndexedDB.");
            console.log("Error al obtener el registro del usuario en IndexedDB.");
        };
    };

    request.onerror = function () {
        console.error("Error al abrir la base de datos IndexedDB.");        
        console.log("Error al abrir la base de datos IndexedDB.");
    };
} ;  
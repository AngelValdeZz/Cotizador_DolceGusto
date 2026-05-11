// UBICACIÓN BASE
const ORIGEN_LAT = 25.6866;
const ORIGEN_LNG = -100.3161;

let distanciaKm = 0;
let costoDistancia = 0;

let map;
let markerDestino;

// INPUTS
const inputBusqueda =
document.getElementById("buscadorDireccion");

const resultadosBusqueda =
document.getElementById("resultadosBusqueda");

// INICIO
window.onload = function(){

    generarPersonas();

    inicializarMapa();

};

// GENERAR PERSONAS
function generarPersonas(){

    const selectPersonas =
    document.getElementById('cantidadPersonas');

    for(let i = 30; i <= 200; i += 10){

        let option =
        document.createElement('option');

        option.value = i;

        option.text = i + " Personas";

        selectPersonas.add(option);

    }

}

// ACTUALIZAR PAQUETES
function actualizarPaquetes(){

    const personas =
    parseInt(
        document.getElementById('cantidadPersonas').value
    );

    const selectPaquete =
    document.getElementById('paquete');

    selectPaquete.innerHTML =
    '<option value="0" disabled selected>Elige un paquete...</option>';

    selectPaquete.add(
        new Option(
            `Paquete 1: ${personas/2} Frituras C/E + ${personas/2} Vasos de Elote`,
            "P1"
        )
    );

    selectPaquete.add(
        new Option(
            `Paquete 2: ${personas} Frituras C/E`,
            "P2"
        )
    );

    selectPaquete.add(
        new Option(
            `Paquete 3: ${personas} Vasos de Elote`,
            "P3"
        )
    );

    calcularTotal();

}

// MAPA
function inicializarMapa(){

    map = L.map('mapa').setView(
        [ORIGEN_LAT, ORIGEN_LNG],
        11
    );

    L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            attribution:'© OpenStreetMap'
        }
    ).addTo(map);

    // CLICK MANUAL
    map.on('click', function(e){

        seleccionarUbicacion(
            e.latlng.lat,
            e.latlng.lng,
            "📍 Ubicación seleccionada manualmente"
        );

    });

}

// BUSCADOR
// API KEY GEOAPIFY
const GEOAPIFY_API_KEY =
"a4d20d7f69f54e168a8a8ce36bc0f7c5";

// BUSCADOR
inputBusqueda.addEventListener(
    "input",
    async function(){

        let texto = this.value;

        if(texto.length < 3){

            resultadosBusqueda.innerHTML = "";

            return;

        }

        const url =
`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(texto)}&filter=rect:-100.8,25.3,-99.8,26.1&bias=proximity:-100.3161,25.6866&limit=5&apiKey=${GEOAPIFY_API_KEY}`;

        try{

            const response =
            await fetch(url);

            const data =
            await response.json();

            resultadosBusqueda.innerHTML = "";

            // SIN RESULTADOS
            if(
                !data.features ||
                data.features.length === 0
            ){

                resultadosBusqueda.innerHTML =
                `<div class="resultado-item">
                    No encontramos resultados 😢
                </div>`;

                return;
            }

            // RESULTADOS
            data.features.forEach(lugar => {

                const item =
                document.createElement("div");

                item.className =
                "resultado-item";

                const props =
                lugar.properties;

                item.innerHTML =
                `
                <strong>
                    ${props.name || 'Ubicación'}
                </strong>
                <br>
                <small>
                    ${props.formatted}
                </small>
                `;

                item.onclick = function(){

                    seleccionarLugarGeoapify(
                        lugar
                    );

                };

                resultadosBusqueda.appendChild(item);

            });

        }
        catch(error){

            console.log(error);

            resultadosBusqueda.innerHTML =
            `<div class="resultado-item">
                Error al buscar ubicación
            </div>`;
        }

    }
);

// SELECCIONAR LUGAR GEOAPIFY
function seleccionarLugarGeoapify(lugar){

    resultadosBusqueda.innerHTML = "";

    const props =
    lugar.properties;

    inputBusqueda.value =
    props.formatted;

    const lat =
    lugar.geometry.coordinates[1];

    const lng =
    lugar.geometry.coordinates[0];

    seleccionarUbicacion(
        lat,
        lng,
        `📍 ${props.formatted}`
    );

}

// UBICACIÓN GENERAL
function seleccionarUbicacion(lat, lng, texto){

    map.flyTo([lat, lng], 16);

    // ELIMINAR MARCADOR ANTERIOR
    if(markerDestino){

        map.removeLayer(markerDestino);

    }

    // NUEVO MARCADOR
    markerDestino = L.marker(
        [lat, lng],
        {
            draggable:true
        }
    ).addTo(map);

    // ANIMACIÓN
    markerDestino._icon.classList.add(
        "marcador-destino"
    );

    // TEXTO
    document.getElementById(
        "direccionSeleccionada"
    ).innerHTML = texto;

    // DISTANCIA
    calcularRuta(lat, lng);

    // DRAG
    markerDestino.on(
        'dragend',
        function(event){

            const posicion =
            event.target.getLatLng();

            calcularRuta(
                posicion.lat,
                posicion.lng
            );

        }
    );

}

// CALCULAR RUTA
function calcularRuta(destLat, destLng){

    document.getElementById(
        'infoDistancia'
    ).innerText =
    "Calculando ruta...";

    const url =
`https://router.project-osrm.org/route/v1/driving/${ORIGEN_LNG},${ORIGEN_LAT};${destLng},${destLat}?overview=false`;

    fetch(url)

    .then(response => response.json())

    .then(data => {

        if(
            data.routes &&
            data.routes.length > 0
        ){

            let metros =
            data.routes[0].distance;

            distanciaKm =
            parseFloat(
                (metros / 1000).toFixed(1)
            );

            document.getElementById(
                'infoDistancia'
            ).innerText =
            `Ubicación lista (${distanciaKm} km detectados)`;

            calcularCostoEnvio(
                distanciaKm
            );

            calcularTotal();

        }

    })

    .catch(err => {

        alert(
            "Hubo un error al calcular la distancia."
        );

    });

}

// COSTO ENVÍO
function calcularCostoEnvio(km){

    if(km >= 1 && km <= 10){

        costoDistancia = 300;

    }
    else if(km > 10 && km <= 19){

        costoDistancia = 600;

    }
    else if(km > 19 && km <= 29){

        costoDistancia = 850;

    }
    else if(km > 29 && km <= 35){

        costoDistancia = 950;

    }
    else if(km > 35 && km <= 50){

        costoDistancia = 1100;

    }
    else if(km > 50){

        alert(
            "⚠️ La distancia excede los 50 km."
        );

        costoDistancia = 0;

    }
    else{

        costoDistancia = 300;

    }

}

// TOTAL
function calcularTotal(){

    const personas =
    parseInt(
        document.getElementById(
            'cantidadPersonas'
        ).value
    ) || 0;

    const paquete =
    document.getElementById(
        'paquete'
    ).value;

    let costoPaquete = 0;

    if(
        personas > 0 &&
        paquete !== "0"
    ){

        if(paquete === "P1"){

            costoPaquete =
            ((personas / 2) * 45) +
            ((personas / 2) * 65);

        }
        else if(paquete === "P2"){

            costoPaquete =
            personas * 65;

        }
        else if(paquete === "P3"){

            costoPaquete =
            personas * 45;

        }

    }

    let total =
    costoPaquete + costoDistancia;

    if(
        total > 0 &&
        paquete !== "0" &&
        distanciaKm > 0
    ){

        document.getElementById(
            'resultadoTotal'
        ).innerText =
        "Total: $" +
        total.toLocaleString('es-MX');

    }
    else{

        document.getElementById(
            'resultadoTotal'
        ).innerText =
        "Total: $0";

    }

    return total;

}

// WHATSAPP
function enviarWhatsApp(){

    let personas =
    document.getElementById(
        'cantidadPersonas'
    ).value;

    let paquete =
    document.getElementById(
        'paquete'
    ).value;

    let selectPaquete =
    document.getElementById(
        'paquete'
    );

    let textoPaquete =
    selectPaquete.options[
        selectPaquete.selectedIndex
    ].text;

    let total =
    calcularTotal();

    if(
        personas === "0" ||
        paquete === "0" ||
        distanciaKm === 0
    ){

        alert(
            "Por favor completa los 3 pasos."
        );

        return;
    }

    let mensaje =
`¡Hola Dolce Gusto! 🌽✨

Quiero cotizar para mi evento:

👥 Personas: ${personas}
📦 Paquete: ${textoPaquete}
📍 Distancia calculada: ${distanciaKm} km
💰 Total: $${total.toLocaleString('es-MX')}

¿Tienen disponibilidad para mi fecha?`;

    let numeroTelefono =
    "5281XXXXXXXX";

    window.open(
`https://wa.me/${numeroTelefono}?text=${encodeURIComponent(mensaje)}`,
        '_blank'
    );

}
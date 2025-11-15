# Práctica 8 | Informática Gráfica
### Visualización de datos

**Autor:** Raúl Marrero Marichal    
**Enlace codesandbox:** https://codesandbox.io/p/sandbox/ig-practica-8-654lzy

# Desarrollo

En esta práctica, se ha partido de la base y modificando en gran medida la prática anterior [P6-7 Sistema Solar](https://github.com/raulm1906/IG_P67_solar_system), centrándose en el representación de datos orbitales de diversos cuerpos del sistema solar.

Para ello, se ha usado la [Small-Body Database](https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/) de la NASA para obtener los datos de varios asteroides y cometas del sistema solar. La intención inicial era hacer uso de su [API](https://ssd-api.jpl.nasa.gov/doc/sbdb.html), pero lamentablemente no permite su acceso directamente desde navegador, por lo que hubo que descargar los datos de los 20 cuerpos representados con un script bash. Esto permite modificar los cuerpos representados añadiendo o eliminando el correspondiente archivo `.json`, pudiendo obtenerse nuevos desde la URL `https://ssd-api.jpl.nasa.gov/sbdb.api?des=<DES>&phys-par=true` siendo `<DES>` la designación del cuerpo (ej.: "1P", "1221").

*Script usado para la descarga de datos*
```bash
#!/bin/bash

# Lista de objetos a descargar
OBJECTS=("1" "2" "3" "1P" \
  "3200" "133P" "176P" "238P" "259P" "288P" "324P" "358P" "2201" \
  "343158" "887" "8013" "1221" "2340" "99942" "4179")

# Carpeta donde se guardarán los JSON
OUTPUT_DIR="sbdb_json"

mkdir -p "$OUTPUT_DIR"

echo "Descargando datos desde la Small-Body Database..."
echo

for OBJ in "${OBJECTS[@]}"; do
    # Reemplazar caracteres no válidos en nombres de archivo
    SAFE_NAME=$(echo "$OBJ" | tr '/:' '_' )

    URL="https://ssd-api.jpl.nasa.gov/sbdb.api?des=${OBJ}&phys-par=true"

    echo "→ Descargando $OBJ ..."
    curl -s "$URL" -o "${OUTPUT_DIR}/${SAFE_NAME}.json"

    if [ $? -eq 0 ]; then
        echo "   Guardado en ${OUTPUT_DIR}/${SAFE_NAME}.json"
    else
        echo "Error descargando $OBJ"
    fi

    echo
done

echo "Proceso completado."

```

Para una mejor visualización, se han modificado las escalas de los cuerpos celestes, siendo los siguientes:
- **Sol:** 1/50000
- **Planetas y Plutón:** 1/10000
- **Asteroides y cometas:** 1/1000

Todos los asteroides comparten la misma textura dado que la gran mayoría no disponen de una propia.

Además, sobre el planeta Tierra se muestra la localización de eventos de bólidos reportados desde el 15 de Abril de 1988, con datos obtenidos del [CNEOS](https://cneos.jpl.nasa.gov/fireballs/) de la NASA.

### Uso de Inteligencia Artificial

Debibo a la gran complejidad que trae representar las [órbitas de Kepler](https://en.wikipedia.org/wiki/Kepler_orbit) en un sistema 3D, se ha recurrido IA generativa para algunas funciones auxiliares como `solveEccentricAnomaly` y la generación de la matriz de rotación de cada grupo orbital. También se ha usado para el parser que extrae los datos del archivo `cneos_fireball_data.csv`.

## Estructura

- `index.js` – Script principal que inicializa la escena, cámaras, controles y carga de cuerpos celestes.

- `planeta.js` – Módulo para crear objetos de tipo Planeta, con texturas, rotación y órbita.

- `asteroid.js` – Módulo para crear asteroides a partir de datos orbitales de JSON.

- `grupo.js` – Crea grupos que representan la órbita de un planeta o asteroide.

- `fireball.js` - Crea marcadores de eventos de bólido.

- `data/` – Carpeta con archivos JSON de cuerpos menores (asteroides, cometas) obtenidos de la Small-Body Database.

- `textures/` – Texturas para planetas, anillos y el fondo estelar.

- `src/Timber_Hearth.mp3` – Música de fondo de la simulación.

- `src/cneos_fireball_data.csv` - Archivo de datos sobre eventos de bólido.

## Controles

- **Orbit controls:** orbitar alrededor del objetivo seleccionado.
- **GUI:** seleccionar cuerpo objetivo, acelerar el tiempo y mostrar u ocultar los marcadores de bólidos.

## Estructura de objetos

- `scene.userData.Cuerpos` - Array con todos los cuerpos que deben representarse.
- `objectsList` - Objeto que mapea los nombres de cuerpos a sus mesh. Ejemplo:

```js
objectsList = {
    "Tierra": tierraMesh,
    "Marte": marteMesh,
    ...
}
```

## Cálculo de órbitas

Se ha puesto especial énfasis en representar de manera realista las órbitas de los cuerpos, pudiéndose ver las órbitas de los planetas y Plutón en blanco y la de asteroides y cometas, en rojo.

A partir de los archivos obtenidos de la NASA, se obtienen los datos del radio, semieje mayor, excentricidad, inclinación, longitud del nodo ascendente, argumento del perihelio, anomalía media y movimiento medio; necesarios para la representación precisa de las órbitas. La explicación de los [elementos orbitales](https://en.wikipedia.org/wiki/Orbital_elements) es compleja y no es objeto de esta práctica.

- Se usa la Ecuación de Kepler para calcular la anomalía excéntrica a partir de la anomalía media y excentricidad.
- La posición en la órbita se calcula en cada frame de animación.
```js
const x = -planetGroup.userData.disp + planetGroup.userData.s_major_axis * Math.cos(E);
const z = planetGroup.userData.s_minor_axis * Math.sin(E);
```
- Se aplica la rotación orbital usando la `rotMatrix` para orientar correctamente la órbita 3D.

## Localización de bólidos

Cabecera del CSV:
```js
"Peak Brightness Date/Time (UT)","Latitude (deg.)","Longitude (deg.)","Altitude (km)","vx","vy","vz","Total Radiated Energy (J)","Calculated Total Impact Energy (kt)"
```

### Pasos para mostrar los bólidos

1. Se crea un `THREE.group` llamado `fireballGroup` como hijo del objeto 3D de la Tierra, para así heredar su rotación y traslación:
```js
const fireballGroup = new THREE.Group();
tierra.add(fireballGroup);
```
2. Cada marcador de fireball se representa como una pequeña esfera (`THREE.SphereGeometry`) de material `MeshBasicMaterial` para que no se vea afectado por la iluminación y con color naranja:

```js
function createFireballMarker(size = 0.01, color = 0xffaa00) {
    const geo = new THREE.SphereGeometry(size, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: color, emissive: color });
    const m = new THREE.Mesh(geo, mat);
    return m;
}
```
3. La posición de cada evento se calcula a partir de la latitud y longitud usando la función `latLongToVector3`:
```js
const pos = latLongToVector3(lat, lon, earthRadius + offset);
marker.position.copy(pos);
```

```js
function latLongToVector3(lat, lon, radius = 0.63) {
    // lat: grados norte positivos, lon: grados este positivos
    // phi = colatitud, theta = longitud en radianes desplazada para que lon=0 esté en X+
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon + 180);
  
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y =  radius * Math.cos(phi);
    const z =  radius * Math.sin(phi) * Math.sin(theta);
  
    return new THREE.Vector3(x, y, z);
}
```

4. Se añade el marcador al grupo:
```js
fireballGroup.add(marker);
```

### Carga de datos

La carga de datos simplemente se realiza llamando a la función `loadFireballsFromCSV` desde `init()`, que es la única función necesaria de importar desde el archivo `fireball.js`. Además, se le debe pasar como argumentos el grupo al que añadir los objetos y la ruta del archivo:
```js
loadFireballsFromCSV(fireballGroup, "src/cneos_fireball_data.csv");
```



## Animación

**Estructura del loop principal:**

```js
function animationLoop() {
    requestAnimationFrame(animationLoop);

    // Actualizar posiciones de planetas, asteroides y anillos
    // Aplicar movimiento orbital y rotación

    updateCameraFollow(); // Actualiza posición de la cámara según planeta objetivo
    camcontrols.update(1);
    renderer.render(scene, orCamera);
}
```

# Fuentes

- [lil-gui - Guide](https://lil-gui.georgealways.com/)
- [Wikipedia - Kepler orbit](https://en.wikipedia.org/wiki/Kepler_orbit)
- [Wikipedia - Orbital elements](https://en.wikipedia.org/wiki/Orbital_elements)
- [NASA - Small-Body Database](https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/)
- [NASA - SBDB API](https://ssd-api.jpl.nasa.gov/doc/sbdb.html)
- [NASA Center for Near Earth Object Studies - Fireballs](https://cneos.jpl.nasa.gov/fireballs/)
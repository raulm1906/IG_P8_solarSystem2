# Práctica 8 | Informática Gráfica
### Visualización de datos

**Autor:** Raúl Marrero Marichal    
**Enlace codesandbox:** https://codesandbox.io/p/sandbox/ig-practica-8-654lzy

# Desarrollo

En esta práctica, se ha partido de la base y modificando en gran medida la prática anterior [P6-7 Sistema Solar](https://github.com/raulm1906/IG_P67_solar_system), centrándose en el representación de datos orbitales de diversos cuerpos del sistema solar.

Para ello, se ha usado la [Small-Body Database](https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/) de la NASA para obtener los datos de varios asteroides y cometas del sistema solar. La intención inicial era hacer uso de su [API](https://ssd-api.jpl.nasa.gov/doc/sbdb.html), pero lamentablemente no permite su acceso directamente desde navegador, por lo que hubo que descargar los datos de los 20 cuerpos representados con un script bash.

Para una mejor visualización, se han modificado las escalas de los cuerpos celestes, siendo los siguientes:
- **Sol:** 1/50000
- **Planetas y Plutón:** 1/10000
- **Asteroides y cometas:** 1/1000

Todos los asteroides comparten la misma textura dado que la gran mayoría no disponen de una propia.

### Uso de Inteligencia Artificial

Debibo a la gran complejidad que trae representar las [órbitas de Kepler](https://en.wikipedia.org/wiki/Kepler_orbit) en un sistema 3D, se ha recurrido IA generativa para algunas funciones auxiliares como `solveEccentricAnomaly` y la generación de la matriz de rotación de cada grupo orbital.

## Estructura

- `index.js` – Script principal que inicializa la escena, cámaras, controles y carga de cuerpos celestes.

- `planeta.js` – Módulo para crear objetos de tipo Planeta, con texturas, rotación y órbita.

- `asteroid.js` – Módulo para crear asteroides a partir de datos orbitales de JSON.

- `grupo.js` – Crea grupos que representan la órbita de un planeta o asteroide.

- `data/` – Carpeta con archivos JSON de cuerpos menores (asteroides, cometas) obtenidos de la Small-Body Database.

- `textures/` – Texturas para planetas, anillos y el fondo estelar.

- `src/Timber_Hearth.mp3` – Música de fondo de la simulación.

## Controles

- **Orbit controls:** orbitar alrededor del objetivo seleccionado.
- **GUI:** seleccionar cuerpo objetivo y acelerar el tiempo.

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
- [NASA Jet Propulsion Laboratory - Small-Body Database](https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/)
- [NASA Jet Propulsion Laboratory - SBDB API](https://ssd-api.jpl.nasa.gov/doc/sbdb.html)
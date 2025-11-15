import * as THREE from "three";
import { Planeta } from "./planeta.js";
import { Asteroid } from "./asteroid.js";
import { Grupo } from "./grupo.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FlyControls } from "three/examples/jsm/controls/FlyControls";
import { loadFireballsFromCSV } from "./fireball.js";
import GUI from 'lil-gui'; 
import fs from 'fs';
import path from 'path';


const DATA_DIR = 'data';
let scene, renderer;
let camera;
let orCamera, orControls;
let info;
let estrella,
  Lunas = [];
let t0 = 0;
let accglobal = 0.001;
let timestamp;
let camcontrols;


const gui = new GUI();
let params;

init();
animationLoop();

function init() {
  info = document.createElement("div");
  info.style.position = "absolute";
  info.style.top = "30px";
  info.style.width = "100%";
  info.style.textAlign = "center";
  info.style.color = "#fff";
  info.style.fontWeight = "bold";
  info.style.backgroundColor = "transparent";
  info.style.zIndex = "1";
  info.style.fontFamily = "Monospace";
  info.innerHTML = "Sistema solar - Raúl Marrero Marichal";
  document.body.appendChild(info);

  //Defino cámara
  scene = new THREE.Scene();
  scene.userData.Groups = [];
  scene.userData.Cuerpos = [];
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100000
  );
  camera.position.set(0, 0, 20);

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.shadowMap.enabled = true;

  camcontrols = new FlyControls(camera, renderer.domElement);
  camcontrols.dragToLook = true;
  camcontrols.movementSpeed = 0.1;
  camcontrols.rollSpeed = 0.01;

  orCamera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.05,
    100000
  );

  // Camara que sigue planetas
  orControls = new OrbitControls(orCamera, renderer.domElement);

  orControls.enableDamping = true;
  orControls.dampingFactor = 0.1;
  orControls.minDistance = 0.1

  // Skybox de fondo
  const stars = new THREE.TextureLoader().load('textures/2k_stars_milky_way.jpg');
  stars.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = stars;

  //Objetos
  Estrella(696350, 0xffff00);
  // Tierra

  const tierraGroup = Grupo(scene, 1, 0.016, 0.0, -11.260, 114.207);

  const tierra = Planeta(scene, tierraGroup, 6378, 23.934, 23, 365.26, 358.617, true, true, "textures/earth/2k_earth_daymap.jpg", undefined, undefined, "textures/earth/2k_earth_normal_map.jpg", "textures/earth/2k_earth_specular_map.jpg");

  Planeta(scene,tierraGroup, 6700, 15, 23, 365.26, 358.617, false, true, "textures/earth/2k_earth_clouds.jpg", undefined, "textures/earth/2k_earth_clouds.jpg");

  // Marte
  const marteGroup = Grupo(scene, 1.523, 0.0934, 1.85, 49.578, 286.5);
  const marte = Planeta(scene, marteGroup, 3397, 24.623, 25, 686.980, 19.412, true, true, "textures/mars/mars_1k_color.jpg", undefined, undefined, "textures/mars/mars_1k_normal.jpg");

  // Mercurio
  const mercuryGroup = Grupo(scene, 0.387098, 0.205, 7.005, 48.33, 29.124);
  const mercury = Planeta(scene, mercuryGroup, 2439, 1407.6, 7, 87.9691, 174.796, true, true, "textures/2k_mercury.jpg");

  // Venus
  const venusGroup = Grupo(scene, 0.723332, 0.006772, 3.394, 76.680, 54.884);
  const venus = Planeta(scene, venusGroup, 6050,  5832, 177, 224.701, 87.9691, true, true, "textures/2k_venus_surface.jpg");
  
  // Jupiter
  const jupiterGroup = Grupo(scene, 5.2038, 0.0489, 1.303, 100.464, 273.867);
  const jupiter = Planeta(scene, jupiterGroup, 71400, 9.842, 3, 4332.59, 20.020, false, true, "textures/jupiter2_1k.jpg");

  // Saturno
  const saturnGroup = Grupo(scene, 9.5826, 0.0565, 2.485, 113.665, 339.39);
  const saturn = Planeta(scene, saturnGroup, 60000, 10.233, 27, 10755.70, 317.020, false, true, "textures/saturn/2k_saturn.jpg");
  Anillos(saturnGroup, 67300, 140300, 27, 10755.70, 317.020, "textures/saturn/2k_saturn_ring_alpha_vert.png");
  
  // Urano
  const uranusGroup = Grupo(scene, 19.191, 0.047, 0.773, 74.006, 96.998);
  const uranus = Planeta(scene, uranusGroup, 26200, 22, 98, 30688.5, 142.238, false, true, "textures/uranus/uranusmap.jpg");
  Anillos(uranusGroup, 38000, 98000, 98, 30688.5, 142.238, "textures/uranus/uranusringcolour.jpg", "textures/uranus/uranusringtrans.jpg");

  // Neptuno
  const neptuneGroup = Grupo(scene, 30.07, 0.008, 1.770, 131.783, 273.187);
  const neptune = Planeta(scene, neptuneGroup, 24200, 19, 30, 60195,259.883, false, true, "textures/2k_neptune.jpg");

  // Pluton
  const plutoGroup = Grupo(scene, 39.482, 0.2488, 17.16, 110.299, 113.834);
  const pluto = Planeta(scene, plutoGroup, 1222.5, 81.36, 118, 90560, 14.53, false, true, "textures/plutomap1k.jpg");

  const objectsList = {
    "Tierra": tierra,
  
    "Mercurio": mercury,
    "Venus": venus,
    "Marte": marte,
    "Júpiter": jupiter,
    "Saturno": saturn,
    "Urano": uranus,
    "Neptuno": neptune,
    "Plutón": pluto,
  };

  // Asteroides y cometas
  const files = fs.readdirSync(DATA_DIR);

  files.forEach(file => {
    if (path.extname(file) === '.json') {
        const filePath = path.join(DATA_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        const parsedData = parseOrbitalElements(data);

        const body = Asteroid(scene, parsedData.radius, parsedData.a, parsedData.e,
          parsedData.i, parsedData.omega, parsedData.w, parsedData.n, parsedData.M);
    
        objectsList[parsedData.fullname] = body;

      };
  });

  const fireballGroup = new THREE.Group();
  tierra.add(fireballGroup);

  loadFireballsFromCSV(fireballGroup, "src/cneos_fireball_data.csv");

  // Música de fondo
  const listener = new THREE.AudioListener();
  orCamera.add(listener);

  const sound = new THREE.Audio(listener);

  const audioLoader = new THREE.AudioLoader();
  audioLoader.load('src/Timber_Hearth.mp3', (buffer) => {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(0.2);
      sound.play();
  });

  orControls.target.set(-4, 0, 0)
  orControls.update();

  // Parametros lil-gui
  params = {
    targetPlanet: tierra,
    timeScale: 101,
    fireball: true,
  };

  gui.add(params, "targetPlanet",objectsList).name("Planeta");

  gui.add(params, "timeScale", 1, 100000, 50).name("Escala de tiempo");

  gui.add(params, "fireball").name("Mostrar bólidos").onChange(() => {
    fireballGroup.visible = params.fireball;
  });



  //Inicio tiempo
  t0 = Date.now();
}

function Estrella(rad, col) {
  rad = rad/50000;
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("textures/2k_sun.jpg");
  const material = new THREE.MeshBasicMaterial({
    map: texture,
  });

  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.02);
  scene.add(ambientLight);

  const light = new THREE.PointLight(0xffffff, 1, 10000); // color, intensidad, distancia
  light.position.set(0, 0, 0); // misma posición que la esfera
  light.castShadow = true;
  light.shadow.mapSize.width = 4096;
  light.shadow.mapSize.height = 4096;
  
  light.shadow.radius = 16;

  scene.add(light);
  let geometry = new THREE.SphereGeometry(rad, 32, 32);
  estrella = new THREE.Mesh(geometry, material);
  scene.add(estrella);
}

function updateCameraFollow () {
    orCamera.position.sub(orControls.target);
    params.targetPlanet.parent.localToWorld(orControls.target.copy( params.targetPlanet.position )) //more robust
    orCamera.position.add(orControls.target);
    orControls.update();
}

function Anillos(group, inRad, outRad, tilt, period, mean_anomaly, text, texalpha) {
  inRad = inRad/10000;
  outRad = outRad/10000;

  const mean_motion = (2*Math.PI)/(period*86400);
  mean_anomaly = THREE.MathUtils.degToRad(mean_anomaly);

  const texture = new THREE.TextureLoader().load(text);

  const geometry = new THREE.RingGeometry(inRad, outRad, 256);

  var uvs = geometry.attributes.uv.array;
  var phiSegments = geometry.parameters.phiSegments || 0;
  var thetaSegments = geometry.parameters.thetaSegments || 0;
  phiSegments = phiSegments !== undefined ? Math.max( 1, phiSegments ) : 1;
  thetaSegments = thetaSegments !== undefined ? Math.max( 3, thetaSegments ) : 8;
  for ( var c = 0, j = 0; j <= phiSegments; j ++ ) {
      for ( var i = 0; i <= thetaSegments; i ++ ) {
          uvs[c++] = i / thetaSegments,
          uvs[c++] = j / phiSegments;
      }
  }

  
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color: 0xaaaaaa,
    side: THREE.DoubleSide,
    transparent: true
  });

  //Transparencia
  if (texalpha != undefined) {
    const alpha = new THREE.TextureLoader().load(texalpha);
    //Con mapa de transparencia
    material.alphaMap = alpha;
    material.opacity = 1.0;
  }

  const rings = new THREE.Mesh(geometry, material);

  rings.rotation.x = THREE.MathUtils.degToRad(90+tilt);
  scene.userData.Cuerpos.push(rings);

  rings.userData.group = group;
  rings.userData.mean_motion = mean_motion;
  rings.userData.mean_anomaly = mean_anomaly;
  rings.userData.rot = 0;

  scene.add(rings);

  return rings;
}

function solveEccentricAnomaly(M, e, tol = 1e-12, maxIter = 50) {
  // Normalizar M a rango [-PI, PI] o [0, 2PI]
  M = (M % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

  // Initial guess: series según e
  let E = M + (e * Math.sign(Math.sin(M))) * 0.85;
  for (let i = 0; i < maxIter; i++) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    const dE = f / fp;
    E -= dE;
    if (Math.abs(dE) < tol) break;
  }
  return E;
}

function parseOrbitalElements(data) {
  const el = {};
  
  let radius = null;

    if (Array.isArray(data.phys_par)) {
        // buscar diámetro directo
        const diamObj = data.phys_par.find(p => p.name === "diameter");
        if (diamObj && diamObj.value) {
            const d = parseFloat(diamObj.value);
            if (!isNaN(d)) radius = d / 2;
        }

        // buscar extent si no hay diameter
        if (!radius) {
            const extObj = data.phys_par.find(p => p.name === "extent");
            if (extObj && extObj.value) {
                // ejemplo "14.9x8.2" → promedio de los dos / 2
                const parts = extObj.value.split("x").map(Number);
                if (parts.length === 2 && parts.every(n => !isNaN(n))) {
                    radius = (parts[0] + parts[1]) / 4;
                }
            }
        }
    };


  data.orbit.elements.forEach(e => {
    el[e.name] = parseFloat(e.value);
  });

  return {
      fullname: data.object.fullname,
      radius: radius, // en km
      a: el.a,          // semi-major axis (AU)
      e: el.e,          // eccentricity
      i: el.i,     // inclination
      omega: el.om, // ascending node
      w: el.w,      // argument of perihelion
      M: el.ma,     // mean anomaly
      n: el.n       // mean motion
  };
};

//Bucle de animación
function animationLoop() {
  timestamp = (Date.now() - t0) * accglobal;

  requestAnimationFrame(animationLoop);

  for (let object of scene.userData.Cuerpos) {

    const planetGroup = object.userData.group;

    object.userData.mean_anomaly += object.userData.mean_motion*params.timeScale;

    const E = solveEccentricAnomaly(object.userData.mean_anomaly, planetGroup.userData.eccentricity);

    // Movimiento elíptico
    const x = -planetGroup.userData.disp + planetGroup.userData.s_major_axis * Math.cos(E);
    const z = planetGroup.userData.s_minor_axis * Math.sin(E);

    const pos = new THREE.Vector3(x, 0, z);

    // Aplicar orientación orbital al vector (sin rotar el planeta)
    pos.applyMatrix4(planetGroup.userData.rotMatrix);
    object.position.copy(pos);

    object.rotation.y += object.userData.rot*params.timeScale;
  }

  updateCameraFollow();
  camcontrols.update(1);
  renderer.render(scene, orCamera);
}

import * as THREE from "three";
import { Grupo } from "./grupo.js";

export function Asteroid(scene, radio, s_major_axis, eccentricity, inclination, asc_node, peri_argument, mean_motion, mean_anomaly) {
    radio = radio/1000;  
    mean_motion = THREE.MathUtils.degToRad(mean_motion/86400);
    mean_anomaly = THREE.MathUtils.degToRad(mean_anomaly);
  
    const group = Grupo(scene, s_major_axis, eccentricity, inclination, asc_node, peri_argument, 0xFF6666, 0.3);

    ///////////////
    const mat = new THREE.MeshPhongMaterial({color: 0xffffff});

    const texture = new THREE.TextureLoader().load("textures/2k_ceres_fictional.jpg");
    mat.map = texture;

    let geom = new THREE.SphereGeometry(radio, 64, 64);
    let asteroid = new THREE.Mesh(geom, mat);

    scene.userData.Cuerpos.push(asteroid);

    asteroid.userData.mean_motion = mean_motion;
    asteroid.userData.mean_anomaly = mean_anomaly;
    asteroid.userData.rot = 0;
    asteroid.userData.group = group;

    scene.add(asteroid);

  
    return asteroid;
  }
import * as THREE from "three";

export function Grupo (scene, s_major_axis, eccentricity, inclination, asc_node, peri_argument, orbitColor = 0xFFFFFF, orbitAlpha = 1) {

    s_major_axis = s_major_axis*149.597870; //Pasar de UA a km
    var s_minor_axis = s_major_axis * Math.sqrt(1 - eccentricity * eccentricity);
    var disp = s_major_axis * eccentricity;                    // desplazamiento del foco
    inclination = THREE.MathUtils.degToRad(inclination);
  
    const group = new THREE.Group();

    scene.add(group);
  
    group.userData.s_major_axis = s_major_axis;
    group.userData.s_minor_axis = s_minor_axis;
    group.userData.disp = disp;
    group.userData.inclination = inclination;
    group.userData.asc_node = THREE.MathUtils.degToRad(asc_node);
    group.userData.peri_argument = THREE.MathUtils.degToRad(peri_argument);
    group.userData.eccentricity = eccentricity;

    const Rz1 = new THREE.Matrix4().makeRotationY(asc_node);
    const Rx  = new THREE.Matrix4().makeRotationX(inclination);
    const Rz2 = new THREE.Matrix4().makeRotationY(peri_argument);

    const rotMatrix = new THREE.Matrix4().multiplyMatrices(Rz1, Rx).multiply(Rz2);

    group.userData.rotMatrix = rotMatrix;

    //Crea geometría
    const points = [];
    for (let t = 0; t <= 2 * Math.PI; t += 0.02) {
      const x = s_major_axis * Math.cos(t) - disp; // foco en el origen
      const z = s_minor_axis * Math.sin(t);
      const v = new THREE.Vector3(x, 0, z).applyMatrix4(rotMatrix);
      points.push(v);
    };

    let geome = new THREE.BufferGeometry().setFromPoints(points);
    let mate = new THREE.LineBasicMaterial({ color: orbitColor, transparent: true, opacity: orbitAlpha });
    // Objeto
    let orbita = new THREE.Line(geome, mate);
  
    group.add(orbita)
    scene.add(orbita);

    scene.userData.Groups.push(group);
    return group;
  }
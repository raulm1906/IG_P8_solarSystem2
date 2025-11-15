import * as THREE from "three";

export function Planeta(scene, group, radio, rot, tilt, period, mean_anomaly, cShadow, rShadow, text, bump, texalpha, normals, spec) {
    radio = radio/10000;
    tilt = THREE.MathUtils.degToRad(tilt);
    const mean_motion = (2*Math.PI)/(period*86400);
    mean_anomaly = THREE.MathUtils.degToRad(mean_anomaly);

    const mat = new THREE.MeshPhongMaterial({color: 0xffffff});
  
    if (text != undefined) {
      const texture = new THREE.TextureLoader().load(text);
      mat.map = texture;
    }
  
    if (bump != undefined) {
      const bumpMap = new THREE.TextureLoader().load(bump); 
      mat.bumpMap = bumpMap;
      mat.bumpScale = 0.02;
    }
    
    if (normals != undefined) {
      const normalText = new THREE.TextureLoader().load(normals); 
      mat.normalMap = normalText;
      mat.normalScale.set(10, -10)
    }
  
    if (texalpha != undefined) {
      const alpha = new THREE.TextureLoader().load(texalpha);
      mat.alphaMap = alpha;
      mat.transparent = true;
      mat.side = THREE.DoubleSide;
      mat.opacity = 1.0;
    }
  
    if (spec != undefined) {
      const specularText = new THREE.TextureLoader().load(spec);
      mat.specular = new THREE.Color(0x4444AA);
      mat.specularMap = specularText;
      mat.shininess = 10;
    }
  
    let geom = new THREE.SphereGeometry(radio, 64, 64);
    let planeta = new THREE.Mesh(geom, mat);
    planeta.rotation.x = tilt;
    planeta.userData.rot = (2*Math.PI)/(rot*3600);
    planeta.userData.mean_motion = mean_motion;
    planeta.userData.mean_anomaly = mean_anomaly;
    planeta.userData.radio = radio;
  
    planeta.castShadow = cShadow;
    planeta.receiveShadow = rShadow;

    scene.userData.Cuerpos.push(planeta);

    planeta.userData.group = group;

    scene.add(planeta);

  
    return planeta;
  }
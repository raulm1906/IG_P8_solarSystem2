import * as THREE from "three";
import fs from 'fs';

// Parseo de lat/lon con sufijos N/S/E/W
function parseLatLonToken(tok) {
    if (!tok) return NaN;
    tok = String(tok).trim().replace(/^"|"$/g, ""); // quitar comillas
    if (tok.length === 0) return NaN;
  
    // Normalizar espacios
    tok = tok.replace(/\s+/g, "");
  
    const last = tok.slice(-1).toUpperCase();
    if (last === "N" || last === "S" || last === "E" || last === "W") {
      const num = parseFloat(tok.slice(0, -1));
      if (!isFinite(num)) return NaN;
      if (last === "N" || last === "E") return num;
      if (last === "S" || last === "W") return -num;
    }
  
    // Si viene con signo o sin sufijo
    const num = parseFloat(tok);
    return isFinite(num) ? num : NaN;
};
  
// Parser CSV robusto
function splitCSVLine(line) {
    const result = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        // escape de comilla doble
        if (inQuotes && line[i+1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (ch === ',' && !inQuotes) {
        result.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    result.push(cur);
    return result.map(s => s.trim());
}

// Loader CSV que usa parseLatLonToken y latLongToVector3
export function loadFireballsFromCSV(fireballGroup, csvPath) {
    const raw = fs.readFileSync(csvPath, "utf8");
    const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
  
    // cabecera (sin comillas)
    const header = splitCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, "").trim());
  
    const idxLat = header.findIndex(h => /Latitude/i.test(h));
    const idxLon = header.findIndex(h => /Longitude/i.test(h));
  
    // lectura de filas
    for (let i = 1; i < lines.length; i++) {
      const parts = splitCSVLine(lines[i]);
      if (parts.length <= Math.max(idxLat, idxLon)) continue;
  
      const rawLat = parts[idxLat];
      const rawLon = parts[idxLon];
  
      const lat = parseLatLonToken(rawLat);
      const lon = parseLatLonToken(rawLon);
  
      let size = 0.005;
  
      const marker = createFireballMarker(size);
      const pos = latLongToVector3(lat, lon, 0.63 + 0.005); // earthRadius + offset
      marker.position.copy(pos);
  
      // orientarlo hacia fuera
      marker.lookAt(pos.clone().multiplyScalar(2));
  
      fireballGroup.add(marker);
    }
};

// Pasar lat/lon a Vector3
function latLongToVector3(lat, lon, radius = 0.63) {
    // lat: grados norte positivos, lon: grados este positivos
    // phi = colatitud, theta = longitud en radianes desplazada para que lon=0 esté en X+
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon + 180);
  
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y =  radius * Math.cos(phi);
    const z =  radius * Math.sin(phi) * Math.sin(theta);
  
    return new THREE.Vector3(x, y, z);
};

// Marcador
function createFireballMarker(size = 0.01, color = 0xffaa00) {
    const geo = new THREE.SphereGeometry(size, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: color, emissive: color });
    const m = new THREE.Mesh(geo, mat);
    return m;
};
  
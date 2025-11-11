// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export default function WorldGlobe({ points }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const globeRef = useRef(null);
  const pointsRef = useRef(null);
  const animationIdRef = useRef(null);
  const resizeHandlerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    camera.position.set(0, 0, 4);
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 3, 5);
    scene.add(dir);
    const radius = 1.3;
    const globeGeometry = new THREE.SphereGeometry(radius, 64, 64);
    const globeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#020617"),
      emissive: new THREE.Color("#0f172a"),
      metalness: 0.4,
      roughness: 0.6
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);
    globeRef.current = globe;
    const atmosphereGeometry = new THREE.SphereGeometry(radius * 1.03, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#38bdf8"),
      transparent: true,
      opacity: 0.08
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);
    const pointGeometry = new THREE.BufferGeometry();
    const maxPoints = 6000;
    const positions = new Float32Array(maxPoints * 3);
    pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pointMaterial = new THREE.PointsMaterial({
      color: new THREE.Color("#38bdf8"),
      size: 0.02,
      transparent: true,
      opacity: 0.9
    });
    const pointsCloud = new THREE.Points(pointGeometry, pointMaterial);
    scene.add(pointsCloud);
    pointsRef.current = {
      geometry: pointGeometry,
      material: pointMaterial,
      maxPoints,
      positions
    };
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    function onPointerDown(event) {
      isDragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
    }
    function onPointerMove(event) {
      if (!isDragging) {
        return;
      }
      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      globe.rotation.y += deltaX * 0.005;
      globe.rotation.x += deltaY * 0.003;
      atmosphere.rotation.copy(globe.rotation);
      pointsCloud.rotation.copy(globe.rotation);
    }
    function onPointerUp() {
      isDragging = false;
    }
    function onWheel(event) {
      const delta = event.deltaY * 0.001;
      const newZ = THREE.MathUtils.clamp(camera.position.z + delta, 2.2, 6);
      camera.position.z = newZ;
    }
    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    container.addEventListener("wheel", onWheel);
    function handleResize() {
      const newWidth = container.clientWidth || 600;
      const newHeight = container.clientHeight || 600;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    }
    resizeHandlerRef.current = handleResize;
    window.addEventListener("resize", handleResize);
    const clock = new THREE.Clock();
    function animate() {
      const delta = clock.getDelta();
      const elapsed = clock.elapsedTime;
      globe.rotation.y += delta * 0.06;
      atmosphere.rotation.y += delta * 0.06;
      pointsCloud.rotation.y += delta * 0.06;
      const data = pointsRef.current;
      if (data) {
        const pulse = 0.018 + 0.01 * Math.sin(elapsed * 3.5);
        data.material.size = pulse;
      }
      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    }
    animate();
    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("wheel", onWheel);
      if (pointsCloud) {
        scene.remove(pointsCloud);
        pointsCloud.geometry.dispose();
        pointsCloud.material.dispose();
      }
      if (globe) {
        scene.remove(globe);
        globe.geometry.dispose();
        globe.material.dispose();
      }
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  useEffect(() => {
    const data = pointsRef.current;
    if (!data || !points || points.length === 0) {
      return;
    }
    const { geometry, positions, maxPoints } = data;
    const radius = 1.32;
    const count = Math.min(points.length, maxPoints);
    for (let i = 0; i < count; i += 1) {
      const item = points[i];
      const v = latLonToVector3(item.latitude, item.longitude, radius);
      positions[i * 3] = v.x;
      positions[i * 3 + 1] = v.y;
      positions[i * 3 + 2] = v.z;
    }
    for (let i = count; i < maxPoints; i += 1) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }
    geometry.setDrawRange(0, count);
    geometry.attributes.position.needsUpdate = true;
  }, [points]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[320px] sm:h-[420px] md:h-[520px] rounded-3xl bg-gradient-to-b from-slate-900/80 via-slate-950 to-black/90 border border-white/5 overflow-hidden"
    />
  );
}
